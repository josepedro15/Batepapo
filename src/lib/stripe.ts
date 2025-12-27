import Stripe from 'stripe'

// Lazy-initialized Stripe client
let stripeInstance: Stripe | null = null

export function getStripe(): Stripe {
    if (!stripeInstance) {
        const secretKey = process.env.STRIPE_SECRET_KEY
        if (!secretKey) {
            throw new Error('Missing STRIPE_SECRET_KEY environment variable')
        }
        stripeInstance = new Stripe(secretKey, {
            typescript: true,
        })
    }
    return stripeInstance
}

// For backwards compatibility
export const stripe = {
    get customers() { return getStripe().customers },
    get checkout() { return getStripe().checkout },
    get billingPortal() { return getStripe().billingPortal },
    get webhooks() { return getStripe().webhooks },
    get subscriptions() { return getStripe().subscriptions },
}

// Price IDs from environment
export const PRICES = {
    starter: process.env.STRIPE_PRICE_STARTER || 'price_starter_monthly',
    pro: process.env.STRIPE_PRICE_PRO || 'price_pro_monthly',
} as const

export type PlanType = keyof typeof PRICES
