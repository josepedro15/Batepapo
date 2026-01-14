import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import Stripe from 'stripe'

// Disable body parsing, we need raw body for webhook verification
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
    // Create admin client
    const adminClient = createAdminClient()

    // Check if Stripe and Supabase Admin are configured
    if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET || !adminClient) {
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
    const adminClient = createAdminClient()
    if (!adminClient) return

    const userId = session.metadata?.supabase_user_id
    if (!userId) return

    // Find user's existing organization (created during onboarding)
    const { data: membership } = await adminClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .single()

    if (!membership) {
        console.error('No organization found for user:', userId)
        return
    }

    const organizationId = membership.organization_id

    // Create default pipeline if not exists
    const { data: existingPipeline } = await adminClient
        .from('pipelines')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)
        .single()

    if (!existingPipeline) {
        const { data: pipeline } = await adminClient
            .from('pipelines')
            .insert({
                organization_id: organizationId,
                name: 'Vendas',
            })
            .select()
            .single()

        if (pipeline) {
            // Create default stages
            await adminClient.from('stages').insert([
                { pipeline_id: pipeline.id, name: 'Novo', position: 0, color: '#3b82f6' },
                { pipeline_id: pipeline.id, name: 'Em Negociação', position: 1, color: '#f59e0b' },
                { pipeline_id: pipeline.id, name: 'Fechado', position: 2, color: '#10b981' },
            ])
        }
    }

    // Link subscription to organization
    if (session.subscription) {
        await adminClient
            .from('subscriptions')
            .update({ organization_id: organizationId })
            .eq('id', session.subscription as string)
    }
}

async function upsertSubscription(subscription: Stripe.Subscription) {
    const adminClient = createAdminClient()
    if (!adminClient) return

    const userId = subscription.metadata?.supabase_user_id
    if (!userId) return

    // Get user's organization to link subscription properly
    const { data: membership } = await adminClient
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', userId)
        .single()

    const priceId = subscription.items.data[0]?.price.id
    const item = subscription.items.data[0]

    await adminClient.from('subscriptions').upsert({
        id: subscription.id,
        user_id: userId,
        organization_id: membership?.organization_id || null,
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
    const adminClient = createAdminClient()
    if (!adminClient) return

    await adminClient
        .from('subscriptions')
        .update({ status: 'canceled' })
        .eq('id', subscriptionId)
}
