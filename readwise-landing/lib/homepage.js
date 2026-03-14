import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function getHomepageData() {
    const cookieStore = cookies()
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name) {
                    return cookieStore.get(name)?.value
                },
            },
        }
    )

    try {
        // Fetch all homepage data in parallel
        const [
            { data: events },
            { data: trending },
            { data: featuredBooks },
            { data: booksForAuthors }
        ] = await Promise.all([
            // Upcoming events
            supabase
                .from('events')
                .select('*')
                .eq('is_published', true)
                .gte('start_date', new Date().toISOString())
                .order('start_date', { ascending: true })
                .limit(5),

            // Trending books
            supabase
                .from('trending_books')
                .select(`
                    *,
                    book:books(*)
                `)
                .eq('trend_type', 'daily')
                .order('rank', { ascending: true })
                .limit(10),

            // Featured/New releases
            supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(8),

            // Get all books to calculate popular authors
            supabase
                .from('books')
                .select('author')
                .not('author', 'is', null)
        ])

        // FIXED: Fetch reviews separately with proper error handling
        let recentReviews = [];
        try {
            // First get approved reviews
            const { data: reviews, error: reviewsError } = await supabase
                .from('user_reviews')
                .select('*')
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .limit(6);

            if (reviewsError) {
                console.error('Error fetching reviews:', reviewsError);
            } else if (reviews && reviews.length > 0) {
                // Get user profiles for these reviews
                const userIds = [...new Set(reviews.map(r => r.user_id))];
                const { data: profiles } = await supabase
                    .from('profiles')
                    .select('id, full_name, username, avatar_url')
                    .in('id', userIds);

                // Get book details for these reviews
                const bookIds = [...new Set(reviews.map(r => r.book_id))];
                const { data: books } = await supabase
                    .from('books')
                    .select('id, title, author, cover_url')
                    .in('id', bookIds);

                // Combine the data
                const profileMap = Object.fromEntries((profiles || []).map(p => [p.id, p]));
                const bookMap = Object.fromEntries((books || []).map(b => [b.id, b]));

                recentReviews = reviews.map(review => ({
                    ...review,
                    user: profileMap[review.user_id] || { 
    full_name: 'Reader ' + review.user_id.substring(0, 4) // Shows "Reader a738"
},
                    book: bookMap[review.book_id] || { title: 'Unknown Book', author: '' }
                }));
            }
        } catch (reviewError) {
            console.error('Error processing reviews:', reviewError);
        }

        // Calculate popular authors manually
        const authorCount = {};
        (booksForAuthors || []).forEach(book => {
            if (book.author) {
                authorCount[book.author] = (authorCount[book.author] || 0) + 1;
            }
        });

        // Convert to array and sort by count
        const popularAuthors = Object.entries(authorCount)
            .map(([author, count]) => ({ author, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 6);

        return {
            events: events || [],
            trending: trending || [],
            recentReviews: recentReviews || [],
            featuredBooks: featuredBooks || [],
            popularAuthors: popularAuthors || []
        }
    } catch (error) {
        console.error('Error fetching homepage data:', error);
        return {
            events: [],
            trending: [],
            recentReviews: [],
            featuredBooks: [],
            popularAuthors: []
        }
    }
}