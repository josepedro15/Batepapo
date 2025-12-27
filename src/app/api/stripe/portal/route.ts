import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get Stripe customer ID
        const { data: customer } = await supabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        if (!customer?.stripe_customer_id) {
            return NextResponse.json(
                { error: 'No subscription found' },
                { status: 404 }
            )
        }

        // Create Billing Portal session
        const session = await stripe.billingPortal.sessions.create({
            customer: customer.stripe_customer_id,
            return_url: `${request.nextUrl.origin}/dashboard/settings`,
        })

        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error('Portal error:', error)
        return NextResponse.json(
            { error: 'Failed to create portal session' },
            { status: 500 }
        )
    }
}
