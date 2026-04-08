import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request) {
    // Skip middleware during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return NextResponse.next();
    }

    try {
        const { createServerClient } = await import('@supabase/ssr')
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return request.cookies.get(name)?.value
                    },
                    set() {}, // Not needed in middleware
                    remove() {}, // Not needed in middleware
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        // ========== NEW: Admin route protection ==========
        if (request.nextUrl.pathname.startsWith('/admin')) {
            // If not logged in, redirect to login
            if (!user) {
                return NextResponse.redirect(new URL('/auth/login', request.url))
            }

            // Check if user is admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single()

            // If not admin, redirect to dashboard
            if (!profile?.is_admin) {
                return NextResponse.redirect(new URL('/dashboard', request.url))
            }
        }
		
		// Writer routes protection
			if (request.nextUrl.pathname.startsWith('/writer')) {
				if (!user) {
				return NextResponse.redirect(new URL('/auth/login', request.url));
			}
			const { data: profile } = await supabase
				.from('profiles')
				.select('role')
				.eq('id', user.id)
				.single();
			if (profile?.role !== 'writer') {
			return NextResponse.redirect(new URL('/dashboard', request.url));
			}
			}

		// Publisher routes protection
			if (request.nextUrl.pathname.startsWith('/publisher')) {
			if (!user) {
			return NextResponse.redirect(new URL('/auth/login', request.url));
			}
			const { data: profile } = await supabase
			.from('profiles')
			.select('role')
			.eq('id', user.id)
			.single();
			if (profile?.role !== 'publisher') {
			return NextResponse.redirect(new URL('/dashboard', request.url));
			}
			}
		
        // ========== End of admin protection ==========

        // Your existing redirect logic
        if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
        if (!user && request.nextUrl.pathname.startsWith('/profile')) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
        if (!user && request.nextUrl.pathname.startsWith('/books')) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }
        if (user && request.nextUrl.pathname.startsWith('/auth')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    } catch (error) {
        console.error('Middleware error:', error)
    }

    return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/profile/:path*', '/books/:path*', '/writer/:path*', '/publisher/:path*'],
};