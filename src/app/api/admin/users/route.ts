import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Helper to check if user is super admin
async function isSuperAdmin(supabase: any) {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return false

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user.id)
        .single()

    return profile?.is_super_admin === true
}

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Security check
    if (!await isSuperAdmin(supabase)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
        // 1. Fetch all profiles
        const { data: profiles, error: profilesError } = await adminClient
            .from('profiles')
            .select('*')
            .order('created_at', { ascending: false })

        if (profilesError) throw profilesError

        // 2. Fetch all active/trialing subscriptions
        const { data: subscriptions, error: subsError } = await adminClient
            .from('subscriptions')
            .select('*, prices(product_id, products(name))')
            .in('status', ['active', 'trialing'])

        if (subsError) throw subsError

        // 3. Merge data
        const users = profiles.map(profile => {
            const sub = subscriptions.find(s => s.user_id === profile.id)
            return {
                ...profile,
                subscription: sub ? {
                    status: sub.status,
                    planName: sub.prices?.products?.name || 'Unknown',
                    currentPeriodEnd: sub.current_period_end
                } : null
            }
        })

        return NextResponse.json(users)
    } catch (error: any) {
        console.error('Admin API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function PATCH(request: NextRequest) {
    const supabase = await createClient()

    // Security check
    if (!await isSuperAdmin(supabase)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
        const body = await request.json()
        const { userId, action, planId } = body

        if (!userId || !action) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
        }

        if (action === 'toggle_admin') {
            const { data: profile } = await adminClient
                .from('profiles')
                .select('is_super_admin')
                .eq('id', userId)
                .single()

            await adminClient
                .from('profiles')
                .update({ is_super_admin: !profile?.is_super_admin })
                .eq('id', userId)
        }

        // Handle subscription changes manually if needed (advanced)
        // For now, let's just assume we might want to cancel/activate
        // This is complex because it involves Stripe.
        // For "Plan Levels", we might update the subscription directly in DB?
        // Risky if not synced with Stripe.
        // Let's stick to toggling admin for now or simple updates.

        // If action is update_subscription, we would need to call Stripe API here.
        // I'll leave it simple for this step or ask user if they want full Stripe management.

        return NextResponse.json({ success: true })

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
