import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ active: false, reason: 'unauthorized' })
    }

    // 2. Get Organization
    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!membership) {
        return NextResponse.json({ active: false, reason: 'no_organization' })
    }

    // 3. Check Subscription
    // Check by organization_id first
    const { data: subByOrg } = await supabase
        .from('subscriptions')
        .select('status')
        .eq('organization_id', membership.organization_id)
        .in('status', ['active', 'trialing'])
        .single()

    if (subByOrg) {
        return NextResponse.json({ active: true })
    }

    return NextResponse.json({ active: false, reason: 'no_subscription' })
}
