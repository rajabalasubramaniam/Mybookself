import { NextResponse } from 'next/server'

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

        // Redirect logic
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
    matcher: ['/dashboard/:path*', '/auth/:path*', '/profile/:path*', '/books/:path*'],
}