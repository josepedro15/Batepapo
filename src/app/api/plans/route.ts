import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// GET - List all active plans (public for authenticated users)
export async function GET(request: NextRequest) {
    const supabase = await createClient()

    // Verify user is authenticated
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Fetch active products with prices and limits
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select(`
                id,
                name,
                description,
                active,
                prices (
                    id,
                    unit_amount,
                    currency,
                    interval,
                    active,
                    trial_period_days,
                    plan_limits (
                        max_users,
                        max_contacts,
                        max_pipelines,
                        features
                    )
                )
            `)
            .eq('active', true)
            .order('created_at', { ascending: true })

        if (productsError) throw productsError

        // Transform to flat structure for easier consumption
        const plans = products?.map(product => {
            const price = product.prices?.find((p: any) => p.active) || product.prices?.[0]
            const limits = price?.plan_limits?.[0]

            // Generate display features from limits and features array
            const displayFeatures = [
                `${limits?.max_users || 1} atendentes`,
                `${(limits?.max_contacts || 100).toLocaleString()} contatos`,
                `${limits?.max_pipelines || 1} pipelines`,
                ...(limits?.features || [])
            ]

            return {
                id: product.id,
                name: product.name,
                description: product.description,
                price: (price?.unit_amount || 0) / 100, // Convert cents to reais
                priceId: price?.id,
                trialDays: price?.trial_period_days || 7,
                limits: {
                    users: limits?.max_users || 1,
                    contacts: limits?.max_contacts || 100,
                    pipelines: limits?.max_pipelines || 1
                },
                features: displayFeatures
            }
        }).filter(plan => plan.priceId) || []

        return NextResponse.json(plans)
    } catch (error: any) {
        console.error('Plans API Error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
