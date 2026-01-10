'use server'

import { createClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

const LAST_VIEWED_COOKIE = 'chat_last_viewed'

/**
 * Get the count of unread messages (messages from contacts since last view)
 */
export async function getUnreadMessageCount(): Promise<number> {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return 0

        // Get the user's organization
        const { data: member } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!member) return 0

        // Get last viewed timestamp from cookie
        const cookieStore = await cookies()
        const lastViewedCookie = cookieStore.get(LAST_VIEWED_COOKIE)
        const lastViewed = lastViewedCookie?.value || new Date(0).toISOString()

        // First, get contact IDs for this organization
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id')
            .eq('organization_id', member.organization_id)

        if (!contacts || contacts.length === 0) return 0

        const contactIds = contacts.map(c => c.id)

        // Count messages from contacts that arrived after last viewed
        const { count, error } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('sender_type', 'contact')
            .gt('created_at', lastViewed)
            .in('contact_id', contactIds)

        if (error) {
            console.error('Error counting unread messages:', error)
            return 0
        }

        return count || 0
    } catch (error) {
        console.error('Error in getUnreadMessageCount:', error)
        return 0
    }
}

/**
 * Get the last viewed timestamp
 */
export async function getLastViewedTimestamp(): Promise<string> {
    const cookieStore = await cookies()
    const lastViewedCookie = cookieStore.get(LAST_VIEWED_COOKIE)
    return lastViewedCookie?.value || new Date(0).toISOString()
}

/**
 * Update the last viewed timestamp to now
 */
export async function updateLastViewedTimestamp(): Promise<void> {
    const cookieStore = await cookies()
    cookieStore.set(LAST_VIEWED_COOKIE, new Date().toISOString(), {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 365 // 1 year
    })
}
