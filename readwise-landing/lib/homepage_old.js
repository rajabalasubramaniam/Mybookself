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
            { data: popularAuthors }
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

            // Featured/New releases (you can curate these via admin)
            supabase
                .from('books')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(8),

            // Popular authors (based on book count)
            supabase
                .from('books')
                .select('author, count')
                .not('author', 'is', null)
                .group('author')
                .order('count', { ascending: false })
                .limit(6)
        ])

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