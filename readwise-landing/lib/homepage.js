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
            { data: recentReviews },
            { data: featuredBooks },
            { data: booksForAuthors }  // Changed: fetch books first
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

            // Recent user reviews
            supabase
                .from('user_reviews')
                .select(`
                    *,
                    user:profiles(username, full_name, avatar_url),
                    book:books(title, author, cover_url)
                `)
                .eq('is_approved', true)
                .order('created_at', { ascending: false })
                .limit(6),

            // Featured/New releases
            supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(8),

            // Get all books to calculate popular authors manually
            supabase
                .from('books')
                .select('author')
                .not('author', 'is', null)
        ])

        // Calculate popular authors manually (since .group() isn't available)
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
            .slice(0, 6); // Take top 6

        return {
            events: events || [],
            trending: trending || [],
            recentReviews: recentReviews || [],
            featuredBooks: featuredBooks || [],
            popularAuthors: popularAuthors || []
        }
    } catch (error) {
        console.error('Error fetching homepage data:', error)
        return {
            events: [],
            trending: [],
            recentReviews: [],
            featuredBooks: [],
            popularAuthors: []
        }
    }
}