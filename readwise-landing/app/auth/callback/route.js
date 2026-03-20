import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const cookieStore = cookies()
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return cookieStore.get(name)?.value
                    },
                    set(name, value, options) {
                        cookieStore.set({ name, value, ...options })
                    },
                    remove(name, options) {
                        cookieStore.set({ name, value: '', ...options })
                    },
                },
            }
        )
        await supabase.auth.exchangeCodeForSession(code)
		
		// Get the user's role
		const { data: { user } } = await supabase.auth.getUser()
		if (user) {
		const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()
		
		// Redirect based on role
      if (profile?.role === 'writer') {
        return NextResponse.redirect(new URL('/profile/writer/edit', request.url))
      } else if (profile?.role === 'publisher') {
        return NextResponse.redirect(new URL('/profile/publisher/edit', request.url))
      } else {
        return NextResponse.redirect(new URL('/profile/reader/edit', request.url))
      }
		}
		}
		
		// after successful signup (in handleSignUp)
		if (!error) {
		// fetch user role from metadata or response
		const role = user?.user_metadata?.role || 'reader';
		router.push(`/profile/${role}/edit`);
		}

     // Fallback to dashboard
	return NextResponse.redirect(new URL('/dashboard', request.url))
	}