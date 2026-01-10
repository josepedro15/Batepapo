import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return NextResponse.json({ error: 'Admin client not configured' }, { status: 500 })
    }

    // 1. Check current status
    const { data: profile } = await adminClient
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // 2. Debug Products/Prices
    const { data: products } = await adminClient
        .from('products')
        .select(`
            id, 
            name, 
            active, 
            prices ( id, unit_amount, currency, interval )
        `)

    // 3. Debug Subscriptions (Simulate Admin API Query)
    const { data: subscriptions, error: subError } = await adminClient
        .from('subscriptions')
        .select('*, prices(product_id, products(name))')
        .eq('user_id', user.id)

    // 4. Check query param to execute fix
    const searchParams = request.nextUrl.searchParams
    const shouldFix = searchParams.get('fix') === 'true'

    let fixResult = null

    if (shouldFix && profile) {
        // Force update to true
        const { error } = await adminClient
            .from('profiles')
            .update({ is_super_admin: true })
            .eq('id', user.id)

        fixResult = error ? `Error: ${error.message}` : 'Success: User promoted to super_admin'

        // Refetch
        const { data: updatedProfile } = await adminClient
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()

        return NextResponse.json({
            user_id: user.id,
            email: user.email,
            status_before: profile,
            fix_attempt: fixResult,
            status_after: updatedProfile,
            AVAILABLE_PLANS: products,
            USER_SUBSCRIPTION: subscriptions,
            SUB_ERROR: subError,
            ENV_VAR_STARTER: process.env.STRIPE_PRICE_STARTER || 'Missing',
            ENV_VAR_PRO: process.env.STRIPE_PRICE_PRO || 'Missing',
            NEXT_STEP: "Try accessing /dashboard/admin now"
        })
    }

    return NextResponse.json({
        message: "Status Report",
        user_id: user.id,
        email: user.email,
        is_super_admin: profile?.is_super_admin,
        profile_data: profile,
        AVAILABLE_PLANS: products,
        USER_SUBSCRIPTION: subscriptions,
        SUB_ERROR: subError,
        ENV_VAR_STARTER: process.env.STRIPE_PRICE_STARTER || 'Missing',
        ENV_VAR_PRO: process.env.STRIPE_PRICE_PRO || 'Missing',
        INSTRUCTION: "To force fix this user, add ?fix=true to the URL"
    })
}
