import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request) {
    // Skip middleware during build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    })

    try {
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
            {
                cookies: {
                    get(name) {
                        return request.cookies.get(name)?.value
                    },
                    set(name, value, options) {
                        request.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value,
                            ...options,
                        })
                    },
                    remove(name, options) {
                        request.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                        response = NextResponse.next({
                            request: {
                                headers: request.headers,
                            },
                        })
                        response.cookies.set({
                            name,
                            value: '',
                            ...options,
                        })
                    },
                },
            }
        )

        const { data: { user } } = await supabase.auth.getUser()

        if (!user && request.nextUrl.pathname.startsWith('/dashboard')) {
            return NextResponse.redirect(new URL('/auth/login', request.url))
        }

        if (user && request.nextUrl.pathname.startsWith('/auth')) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    } catch (error) {
        console.error('Middleware error:', error);
    }

    return response
}

export const config = {
    matcher: ['/dashboard/:path*', '/auth/:path*', '/profile/:path*', '/books/:path*'],
}