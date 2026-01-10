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

// GET - List all plans with prices and limits
export async function GET(request: NextRequest) {
    const supabase = await createClient()

    if (!await isSuperAdmin(supabase)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
        const { data: products, error: productsError } = await adminClient
            .from('products')
            .select(`
                id,
                name,
                description,
                active,
                created_at,
                prices (
                    id,
                    unit_amount,
                    currency,
                    interval,
                    active,
                    plan_limits (
                        max_users,
                        max_contacts,
                        max_pipelines,
                        features
                    )
                )
            `)
            .order('created_at', { ascending: false })

        if (productsError) throw productsError

        // Transform to flat structure for easier consumption
        const plans = products?.map(product => {
            const price = product.prices?.[0]
            const limits = price?.plan_limits?.[0]
            return {
                id: product.id,
                name: product.name,
                description: product.description,
                active: product.active,
                created_at: product.created_at,
                price_id: price?.id || null,
                price_amount: price?.unit_amount || 0,
                price_currency: price?.currency || 'brl',
                price_interval: price?.interval || 'month',
                price_active: price?.active || false,
                max_users: limits?.max_users || 1,
                max_contacts: limits?.max_contacts || 100,
                max_pipelines: limits?.max_pipelines || 1,
                features: limits?.features || []
            }
        }) || []

        return NextResponse.json(plans)
    } catch (error: any) {
        console.error('Plans API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// POST - Create new plan
export async function POST(request: NextRequest) {
    const supabase = await createClient()

    if (!await isSuperAdmin(supabase)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
        const body = await request.json()
        const {
            name,
            description,
            price_amount,
            max_users,
            max_contacts,
            max_pipelines,
            features
        } = body

        if (!name || price_amount === undefined) {
            return NextResponse.json({ error: 'Name and price are required' }, { status: 400 })
        }

        // Generate IDs
        const productId = `prod_${name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`
        const priceId = `price_${name.toLowerCase().replace(/\s+/g, '_')}_monthly`

        // 1. Create product
        const { error: productError } = await adminClient
            .from('products')
            .insert({
                id: productId,
                name,
                description: description || '',
                active: true
            })

        if (productError) throw productError

        // 2. Create price
        const { error: priceError } = await adminClient
            .from('prices')
            .insert({
                id: priceId,
                product_id: productId,
                unit_amount: price_amount,
                currency: 'brl',
                type: 'recurring',
                interval: 'month',
                active: true
            })

        if (priceError) throw priceError

        // 3. Create plan limits
        const { error: limitsError } = await adminClient
            .from('plan_limits')
            .insert({
                price_id: priceId,
                max_users: max_users || 1,
                max_contacts: max_contacts || 100,
                max_pipelines: max_pipelines || 1,
                features: features || []
            })

        if (limitsError) throw limitsError

        return NextResponse.json({
            success: true,
            product_id: productId,
            price_id: priceId
        })
    } catch (error: any) {
        console.error('Create Plan Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// PATCH - Update existing plan
export async function PATCH(request: NextRequest) {
    const supabase = await createClient()

    if (!await isSuperAdmin(supabase)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
        const body = await request.json()
        const {
            product_id,
            price_id,
            name,
            description,
            active,
            price_amount,
            max_users,
            max_contacts,
            max_pipelines,
            features
        } = body

        if (!product_id) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        // 1. Update product
        const { error: productError } = await adminClient
            .from('products')
            .update({
                name,
                description,
                active
            })
            .eq('id', product_id)

        if (productError) throw productError

        // 2. Update price if provided
        if (price_id && price_amount !== undefined) {
            const { error: priceError } = await adminClient
                .from('prices')
                .update({
                    unit_amount: price_amount,
                    active
                })
                .eq('id', price_id)

            if (priceError) throw priceError
        }

        // 3. Update plan limits if provided
        if (price_id) {
            const { error: limitsError } = await adminClient
                .from('plan_limits')
                .upsert({
                    price_id,
                    max_users: max_users || 1,
                    max_contacts: max_contacts || 100,
                    max_pipelines: max_pipelines || 1,
                    features: features || []
                })

            if (limitsError) throw limitsError
        }

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Update Plan Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

// DELETE - Delete a plan
export async function DELETE(request: NextRequest) {
    const supabase = await createClient()

    if (!await isSuperAdmin(supabase)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return NextResponse.json({ error: 'Server configuration error' }, { status: 500 })
    }

    try {
        const { searchParams } = new URL(request.url)
        const productId = searchParams.get('product_id')

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
        }

        // Get associated price_id first
        const { data: prices } = await adminClient
            .from('prices')
            .select('id')
            .eq('product_id', productId)

        // Delete in order: plan_limits -> prices -> products
        for (const price of prices || []) {
            await adminClient
                .from('plan_limits')
                .delete()
                .eq('price_id', price.id)

            await adminClient
                .from('prices')
                .delete()
                .eq('id', price.id)
        }

        const { error: productError } = await adminClient
            .from('products')
            .delete()
            .eq('id', productId)

        if (productError) throw productError

        return NextResponse.json({ success: true })
    } catch (error: any) {
        console.error('Delete Plan Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
