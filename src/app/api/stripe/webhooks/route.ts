import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { adminAuthClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

// Disable body parsing, we need raw body for webhook verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    // Check if Stripe and Supabase Admin are configured
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !adminAuthClient) {
        return NextResponse.json(
            { error: 'Stripe integration not configured' },
            { status: 503 }
        )
    }

    const body = await request.text()
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
        return NextResponse.json(
            { error: 'Missing stripe-signature header' },
            { status: 400 }
        )
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET!
        )
    } catch (error) {
        console.error('Webhook signature verification failed:', error)
        return NextResponse.json(
            { error: 'Invalid signature' },
            { status: 400 }
        )
    }

    const supabase = adminAuthClient

    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object as Stripe.Checkout.Session
                await handleCheckoutCompleted(session)
                break
            }

            case 'customer.subscription.created':
            case 'customer.subscription.updated': {
                const subscription = event.data.object as Stripe.Subscription
                await upsertSubscription(subscription)
                break
            }

            case 'customer.subscription.deleted': {
                const subscription = event.data.object as Stripe.Subscription
                await deleteSubscription(subscription.id)
                break
            }

            case 'invoice.payment_failed': {
                const invoice = event.data.object
                // Could send notification to user here
                const subscriptionId = (invoice as { subscription?: string }).subscription
                if (subscriptionId) {
                    console.error('Payment failed for subscription:', subscriptionId)
                }
                break
            }
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Webhook handler error:', error)
        return NextResponse.json(
            { error: 'Webhook handler failed' },
            { status: 500 }
        )
    }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
    if (!adminAuthClient) return

    const userId = session.metadata?.supabase_user_id
    if (!userId) return

    // Create organization for the user
    const { data: org, error: orgError } = await adminAuthClient
        .from('organizations')
        .insert({
            name: 'Minha Empresa',
            slug: `org-${Date.now()}`,
            owner_id: userId,
        })
        .select()
        .single()

    if (orgError) {
        console.error('Error creating organization:', orgError)
        return
    }

    // Add user as owner member
    await adminAuthClient.from('organization_members').insert({
        organization_id: org.id,
        user_id: userId,
        role: 'owner',
    })

    // Create default pipeline
    const { data: pipeline } = await adminAuthClient
        .from('pipelines')
        .insert({
            organization_id: org.id,
            name: 'Vendas',
        })
        .select()
        .single()

    if (pipeline) {
        // Create default stages
        await adminAuthClient.from('stages').insert([
            { pipeline_id: pipeline.id, name: 'Novo', position: 0, color: '#3b82f6' },
            { pipeline_id: pipeline.id, name: 'Em Negociação', position: 1, color: '#f59e0b' },
            { pipeline_id: pipeline.id, name: 'Fechado', position: 2, color: '#10b981' },
        ])
    }

    // Link subscription to organization
    if (session.subscription) {
        await adminAuthClient
            .from('subscriptions')
            .update({ organization_id: org.id })
            .eq('id', session.subscription as string)
    }
}

async function upsertSubscription(subscription: Stripe.Subscription) {
    if (!adminAuthClient) return

    const userId = subscription.metadata?.supabase_user_id
    if (!userId) return

    const priceId = subscription.items.data[0]?.price.id
    const item = subscription.items.data[0]

    await adminAuthClient.from('subscriptions').upsert({
        id: subscription.id,
        user_id: userId,
        price_id: priceId,
        status: subscription.status,
        quantity: item?.quantity || 1,
        trial_start: subscription.trial_start
            ? new Date(subscription.trial_start * 1000).toISOString()
            : null,
        trial_end: subscription.trial_end
            ? new Date(subscription.trial_end * 1000).toISOString()
            : null,
        current_period_start: item?.current_period_start
            ? new Date(item.current_period_start * 1000).toISOString()
            : null,
        current_period_end: item?.current_period_end
            ? new Date(item.current_period_end * 1000).toISOString()
            : null,
        cancel_at: subscription.cancel_at
            ? new Date(subscription.cancel_at * 1000).toISOString()
            : null,
        canceled_at: subscription.canceled_at
            ? new Date(subscription.canceled_at * 1000).toISOString()
            : null,
        cancel_at_period_end: subscription.cancel_at_period_end,
    })
}

async function deleteSubscription(subscriptionId: string) {
    if (!adminAuthClient) return

    await adminAuthClient
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscriptionId)
}
