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

    // GLOBAL SUPER ADMIN CHECK
    // If user is super admin, they have full access and bypass all subscription logic
    if (user) {
        const { data: profile } = await supabase
            .from('profiles')
            .select('is_super_admin')
            .eq('id', user.id)
            .single()

        if (profile?.is_super_admin) {
            // If admin tries to access onboarding or plan pages, redirect to admin dashboard
            if (request.nextUrl.pathname.startsWith('/onboarding')) {
                return NextResponse.redirect(new URL('/dashboard/admin', request.url))
            }
            // Allow access to everything else (dashboard, api, etc)
            return supabaseResponse
        }
    }

    // Helper function to check active subscription
    const checkSubscription = async (userId: string) => {
        const { data: subscription } = await supabase
            .from('subscriptions')
            .select('id, status')
            .eq('user_id', userId)
            .in('status', ['active', 'trialing'])
            .limit(1)
            .single()
        return subscription
    }

    // If user is signed in and accessing dashboard
    if (user && request.nextUrl.pathname.startsWith('/dashboard')) {
        // Check if user has an organization
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

        // Check if user has an active subscription
        const subscription = await checkSubscription(user.id)
        if (!subscription) {
            return NextResponse.redirect(new URL('/onboarding/plan', request.url))
        }
    }

    // If user is on onboarding pages
    if (user && request.nextUrl.pathname.startsWith('/onboarding')) {
        const { data: membership } = await supabase
            .from('organization_members')
            .select('id')
            .eq('user_id', user.id)
            .limit(1)
            .single()

        // Check subscription status
        const subscription = await checkSubscription(user.id)

        // If user has organization AND active subscription, redirect to dashboard
        if (membership && subscription) {
            return NextResponse.redirect(new URL('/dashboard', request.url))
        }

        // If user has organization but NO subscription, should be on /onboarding/plan
        if (membership && !subscription) {
            // Allow access to plan and success pages
            if (request.nextUrl.pathname === '/onboarding') {
                return NextResponse.redirect(new URL('/onboarding/plan', request.url))
            }
            // Allow /onboarding/plan and /onboarding/success
        }

        // If user has NO organization, should be on /onboarding (not /plan)
        if (!membership) {
            if (request.nextUrl.pathname !== '/onboarding') {
                return NextResponse.redirect(new URL('/onboarding', request.url))
            }
        }
    }

    return supabaseResponse
}

export const config = {
    matcher: [
        '/dashboard/:path*',
        '/login',
        '/onboarding',
        '/onboarding/:path*',
    ],
}
