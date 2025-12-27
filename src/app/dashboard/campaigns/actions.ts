'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createCampaign(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const message = formData.get('message') as string

    // 1. Get Org
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    const orgId = member?.organization_id

    // 2. Fetch Target Contacts (For MVP: All "open" contacts of the org)
    // In real world, we would use formData.get('tags') to filter
    const { data: contacts } = await supabase
        .from('contacts')
        .select('id')
        .eq('organization_id', orgId)
        .neq('status', 'closed')

    if (!contacts || contacts.length === 0) {
        // In a real app we would return an error to state, here just redirecting
        redirect('/dashboard/campaigns?error=No contacts found')
    }

    // 3. Create Campaign Header
    const { data: campaign, error } = await supabase.from('campaigns').insert({
        organization_id: orgId,
        name,
        message_template: message,
        status: 'processing',
        total_contacts: contacts.length
    }).select().single()

    if (error) throw new Error(error.message)

    // 4. Bulk Insert into Queue
    const queueItems = contacts.map(c => ({
        organization_id: orgId,
        campaign_id: campaign.id,
        contact_id: c.id,
        status: 'pending'
    }))

    const { error: queueError } = await supabase.from('campaign_queue').insert(queueItems)
    if (queueError) throw new Error(queueError.message)

    revalidatePath('/dashboard/campaigns')
    return { success: true }
}
