import { NextRequest, NextResponse } from 'next/server'
import { stripe, PRICES, PlanType } from '@/lib/stripe'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
    // Check if Stripe is configured
    if (!process.env.STRIPE_SECRET_KEY) {
        return NextResponse.json(
            { error: 'Stripe integration not configured' },
            { status: 503 }
        )
    }

    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { plan } = body as { plan: PlanType }

        if (!plan || !PRICES[plan]) {
            return NextResponse.json(
                { error: 'Invalid plan selected' },
                { status: 400 }
            )
        }

        // Check if user has an organization (required before checkout)
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json(
                { error: 'Please complete onboarding first' },
                { status: 400 }
            )
        }

        // Check if user already has a Stripe customer
        const { data: customer } = await supabase
            .from('customers')
            .select('stripe_customer_id')
            .eq('id', user.id)
            .single()

        let stripeCustomerId = customer?.stripe_customer_id

        // Create Stripe customer if doesn't exist
        if (!stripeCustomerId) {
            const stripeCustomer = await stripe.customers.create({
                email: user.email,
                metadata: {
                    supabase_user_id: user.id,
                },
            })
            stripeCustomerId = stripeCustomer.id

            await supabase.from('customers').upsert({
                id: user.id,
                stripe_customer_id: stripeCustomerId,
            })
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            customer: stripeCustomerId,
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [
                {
                    price: PRICES[plan],
                    quantity: 1,
                },
            ],
            success_url: `${request.nextUrl.origin}/onboarding/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${request.nextUrl.origin}/onboarding/plan`,
            subscription_data: {
                trial_period_days: 7,
                metadata: {
                    supabase_user_id: user.id,
                },
            },
            metadata: {
                supabase_user_id: user.id,
                plan,
            },
        })

        return NextResponse.json({ url: session.url })
    } catch (error) {
        console.error('Checkout error:', error)
        return NextResponse.json(
            { error: 'Failed to create checkout session' },
            { status: 500 }
        )
    }
}
