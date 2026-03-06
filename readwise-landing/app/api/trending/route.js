import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import axios from 'axios'

export async function GET(request) {
    try {
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

        // Check if user is admin (you can secure this further)
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch trending books from Open Library
        const response = await axios.get(
            'https://openlibrary.org/trending/daily.json?limit=10'
        )

        const trending = response.data.works?.map((work, index) => ({
            book_id: work.key.split('/').pop(), // Extract OLID
            rank: index + 1,
            trend_type: 'daily',
            source: 'open_library'
        })) || []

        // Store in database
        const { error } = await supabase
            .from('trending_books')
            .upsert(trending, { onConflict: 'book_id' })

        if (error) throw error

        return NextResponse.json({ 
            message: 'Trending books updated successfully',
            count: trending.length 
        })
    } catch (error) {
        console.error('Error updating trending:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}