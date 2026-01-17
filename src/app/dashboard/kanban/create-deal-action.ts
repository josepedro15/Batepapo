'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createDeal(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const title = formData.get('title') as string
    const value = parseFloat(formData.get('value') as string) || 0
    const contactId = formData.get('contactId') as string
    const stageId = formData.get('stageId') as string

    // Get Org
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    const orgId = member?.organization_id

    // Get Pipeline ID (assume first/default)
    const { data: pipeline } = await supabase.from('pipelines').select('id').eq('organization_id', orgId).single()

    if (!pipeline) throw new Error('No pipeline found')

    // Get contact's connected_phone
    const { data: contact } = await supabase
        .from('contacts')
        .select('connected_phone')
        .eq('id', contactId)
        .single()

    console.log('--- Creating Deal ---')
    console.log('Payload:', { orgId, pipelineId: pipeline.id, stageId, contactId, title, value })

    // Insert Deal
    const { data: newDeal, error } = await supabase.from('deals').insert({
        organization_id: orgId,
        pipeline_id: pipeline.id,
        stage_id: stageId,
        contact_id: contactId,
        title,
        value,
        position: 0,
        connected_phone: contact?.connected_phone
    }).select().single()

    console.log('Insert Result:', { newDeal, error })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/kanban')
    return { success: true }
}
