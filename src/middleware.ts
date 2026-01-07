import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { env } from '@/lib/env'

export async function middleware(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        env.supabase.url,
        env.supabase.anonKey,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Refresh session if expired
    const { data: { user } } = await supabase.auth.getUser()

    // If user is not signed in and the current path is /dashboard or /onboarding, redirect to /login
    if (!user && (request.nextUrl.pathname.startsWith('/dashboard') || request.nextUrl.pathname.startsWith('/onboarding'))) {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    // If user IS signed in and tries to access /login, redirect to /dashboard
    if (user && request.nextUrl.pathname === '/login') {
        return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // If user is signed in, check if they have an organization
    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
        const { data: membership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        // If no organization, redirect to onboarding
        if (!membership) {
            return NextResponse.redirect(new URL('/onboarding', request.url))
        }
    }

    // If user is on onboarding but already has an organization, redirect to dashboard
    if (user && request.nextUrl.pathname.startsWith('/onboarding')) {
        const { data: membership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        // If already has organization, redirect to dashboard
        if (membership) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/onboarding',
    ],
}
