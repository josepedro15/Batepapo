/**
 * Database types for CRM+BATEPAPO
 * Centralized type definitions matching Supabase schema
 */

// ============================================
// Core Entities
// ============================================

export type Profile = {
    id: string
    email: string | null
    name: string | null
    avatar_url: string | null
    created_at: string
}

export type Organization = {
    id: string
    name: string
    slug: string
    created_at: string
    owner_id: string | null
}

export type OrganizationMember = {
    id: string
    organization_id: string
    user_id: string
    role: 'owner' | 'manager' | 'attendant'
    joined_at: string
}

// ============================================
// CRM Entities
// ============================================

export type ContactStatus = 'open' | 'closed' | 'archived'

export type Contact = {
    id: string
    organization_id: string
    name: string
    phone: string
    email: string | null
    tags: string[] | null
    status: ContactStatus
    owner_id: string | null
    avatar_url: string | null
    created_at: string
    updated_at: string | null
}

export type MessageSenderType = 'user' | 'contact' | 'system'
export type MessageStatus = 'sent' | 'delivered' | 'read'

export type Message = {
    id: string
    organization_id: string
    contact_id: string
    sender_type: MessageSenderType
    sender_id: string | null
    body: string | null
    media_url: string | null
    media_type: string | null
    status: MessageStatus
    created_at: string
}

// ============================================
// Kanban Entities
// ============================================

export type Pipeline = {
    id: string
    organization_id: string
    name: string
    created_at: string
}

export type Stage = {
    id: string
    pipeline_id: string
    name: string
    position: number
    color: string | null
}

export type Deal = {
    id: string
    organization_id: string
    pipeline_id: string
    stage_id: string
    contact_id: string
    title: string
    value: number
    position: number
    status: string
    created_at: string
    updated_at: string | null
}

// ============================================
// Extended Types (with relations)
// ============================================

export type StageWithDeals = Stage & {
    deals: (Deal & { contacts?: { name: string } })[]
}

export type ContactWithOwner = Contact & {
    owner?: Profile
}

export type DealWithContact = Deal & {
    contacts?: { name: string }
}

// ============================================
// API Response Types
// ============================================

export type ChatData = {
    myChats: Contact[]
    awaitingChats: Contact[]
    allChats: Contact[]
    finishedChats: Contact[]
    currentUserId: string
    orgId: string
    userRole: string
}

export type KanbanData = {
    stages: StageWithDeals[] | null
    pipeline: Pipeline | null
    pipelines: Pipeline[] | null
}

// ============================================
// Subscription Entities
// ============================================

export type Product = {
    id: string
    active: boolean
    name: string
    description: string | null
    image: string | null
    metadata: Record<string, string> | null
    created_at: string
}

export type PriceInterval = 'day' | 'week' | 'month' | 'year'
export type PriceType = 'one_time' | 'recurring'

export type Price = {
    id: string
    product_id: string
    active: boolean
    currency: string
    unit_amount: number
    type: PriceType
    interval: PriceInterval | null
    interval_count: number
    trial_period_days: number | null
    metadata: Record<string, string> | null
}

export type SubscriptionStatus =
    | 'trialing'
    | 'active'
    | 'canceled'
    | 'past_due'
    | 'unpaid'
    | 'incomplete'
    | 'incomplete_expired'

export type Subscription = {
    id: string
    user_id: string
    organization_id: string | null
    price_id: string
    status: SubscriptionStatus
    quantity: number
    trial_start: string | null
    trial_end: string | null
    current_period_start: string | null
    current_period_end: string | null
    cancel_at: string | null
    canceled_at: string | null
    cancel_at_period_end: boolean
    created_at: string
    updated_at: string
}

export type PlanLimits = {
    price_id: string
    max_users: number
    max_contacts: number
    max_pipelines: number
    features: {
        api?: boolean
        tags?: boolean
        notes?: boolean
        campaigns?: boolean
        analytics?: boolean
        webhooks?: boolean
    }
}

// ============================================
// Subscription Response Types
// ============================================

export type SubscriptionWithPlan = Subscription & {
    price: Price & {
        product: Product
    }
    limits: PlanLimits
}

export type PlanInfo = {
    id: string
    name: string
    description: string | null
    price: number
    interval: PriceInterval
    features: string[]
    limits: {
        users: number
        contacts: number
        pipelines: number
    }
}

