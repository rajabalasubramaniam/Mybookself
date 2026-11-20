import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/supabaseAdmin'

export async function POST(request) {
    try {
        const { userId } = await request.json()
        const cookieStore = cookies()

        // 1. Verify admin using the regular (user-session) client
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) { return cookieStore.get(name)?.value },
                    set() {},
                    remove() {},
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .single()

        if (!profile?.is_admin) {
            return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
        }

        if (userId === user.id) {
            return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 })
        }

        // 2. Remove the user's data with the admin client (bypasses RLS)
        const cleanup = [
            ['user_activity_logs', 'user_id'],
            ['user_posts', 'user_id'],
            ['notifications', 'user_id'],
            ['reading_sessions', 'user_id'],
            ['user_reviews', 'user_id'],
            ['goals', 'user_id'],
            ['achievements', 'user_id'],
            ['user_challenges', 'user_id'],
            ['shares', 'user_id'],
            ['book_exchanges', 'offering_user_id'],
            ['books', 'user_id'],
            ['writer_books', 'writer_id'],
            ['publisher_inventory', 'publisher_id'],
            ['writer_profiles', 'id'],
            ['publisher_profiles', 'id'],
            ['profiles', 'id'],
        ]
        for (const [table, column] of cleanup) {
            const { error: delErr } = await supabaseAdmin.from(table).delete().eq(column, userId)
            if (delErr) console.error(`Cleanup ${table}.${column}:`, delErr.message)
        }

        // 3. Delete the login itself (service_role key)
        const { error } = await supabaseAdmin.auth.admin.deleteUser(userId)

        if (error) {
            console.error('Delete error:', error)
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Server error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}