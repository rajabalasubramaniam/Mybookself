import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET() {
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

    // Get approved reviews without joins first
    const { data: reviews, error: reviewsError } = await supabase
        .from('user_reviews')
        .select('*')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })

    // Get user profiles separately
    const userIds = [...new Set(reviews?.map(r => r.user_id) || [])]
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', userIds)

    // Get books separately
    const bookIds = [...new Set(reviews?.map(r => r.book_id) || [])]
    const { data: books } = await supabase
        .from('books')
        .select('id, title, author, cover_url')
        .in('id', bookIds)

    // Combine manually
    const enrichedReviews = reviews?.map(review => ({
        ...review,
        user: profiles?.find(p => p.id === review.user_id) || null,
        book: books?.find(b => b.id === review.book_id) || null
    })) || []

    return NextResponse.json({
        message: "Foreign keys need to be added for proper joins",
        approvedCount: reviews?.length || 0,
        reviews: enrichedReviews,
        databaseInfo: {
            hasUserId: reviews?.some(r => r.user_id) || false,
            hasBookId: reviews?.some(r => r.book_id) || false,
            profileCount: profiles?.length || 0,
            bookCount: books?.length || 0
        }
    })
}