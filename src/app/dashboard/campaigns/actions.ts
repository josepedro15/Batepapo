'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
    createMassCampaign,
    controlCampaign,
    buildCampaignMessages,
    type MassCampaignMessage
} from '@/lib/uazapi'

// Types
export interface CreateCampaignInput {
    name: string
    delayMin?: number
    delayMax?: number
    scheduledFor?: Date | null
    contactIds: string[]
    messages: Array<{
        type: MassCampaignMessage['type']
        text?: string
        file?: string
        docName?: string
        footerText?: string
        imageButton?: string
        listButton?: string
        choices?: string[]
    }>
}

export interface CampaignData {
    id: string
    name: string
    status: string
    total_contacts: number
    sent_count: number
    failed_count: number
    created_at: string
    scheduled_for: string | null
    message_template: string | null
    uazapi_folder_id: string | null
}

/**
 * Get current user's organization and WhatsApp instance
 */
async function getOrgAndInstance() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member?.organization_id) throw new Error('Organization not found')

    // Get WhatsApp instance for this org
    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('id, token, status')
        .eq('organization_id', member.organization_id)
        .eq('status', 'connected')
        .single()

    return {
        userId: user.id,
        organizationId: member.organization_id,
        instanceToken: instance?.token || null,
        instanceConnected: instance?.status === 'connected'
    }
}

/**
 * Create a new mass campaign
 */
export async function createCampaign(input: CreateCampaignInput) {
    const supabase = await createClient()
    const { organizationId, instanceToken, instanceConnected } = await getOrgAndInstance()

    if (!instanceConnected || !instanceToken) {
        return { success: false, error: 'WhatsApp não conectado. Conecte sua instância primeiro.' }
    }

    if (input.contactIds.length === 0) {
        return { success: false, error: 'Selecione pelo menos um contato' }
    }

    if (input.messages.length === 0) {
        return { success: false, error: 'Adicione pelo menos uma mensagem' }
    }

    try {
        // 1. Fetch selected contacts with phone numbers
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('id, name, phone')
            .in('id', input.contactIds)

        if (contactsError || !contacts?.length) {
            return { success: false, error: 'Erro ao buscar contatos' }
        }

        // 2. Create campaign in database (status: scheduled)
        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert({
                organization_id: organizationId,
                name: input.name,
                message_template: input.messages[0]?.text || 'Campanha em massa',
                status: 'scheduled',
                total_contacts: contacts.length,
                delay_min: input.delayMin || 3,
                delay_max: input.delayMax || 6,
                scheduled_for: input.scheduledFor?.toISOString() || null
            })
            .select()
            .single()

        if (campaignError || !campaign) {
            console.error('Campaign creation error:', campaignError)
            return { success: false, error: 'Erro ao criar campanha' }
        }

        // 3. Save campaign messages
        const messageInserts = input.messages.map((msg, index) => ({
            campaign_id: campaign.id,
            order_index: index,
            type: msg.type,
            content: {
                text: msg.text,
                file: msg.file,
                docName: msg.docName,
                footerText: msg.footerText,
                imageButton: msg.imageButton,
                listButton: msg.listButton,
                choices: msg.choices
            }
        }))

        await supabase.from('campaign_messages').insert(messageInserts)

        // 4. Save campaign recipients
        const recipientInserts = contacts.map(c => ({
            campaign_id: campaign.id,
            contact_id: c.id,
            phone: c.phone,
            status: 'pending'
        }))

        await supabase.from('campaign_recipients').insert(recipientInserts)

        // 5. Build UAZAPI messages and send campaign
        const uazapiMessages = buildCampaignMessages(
            contacts.map(c => ({ phone: c.phone, name: c.name })),
            input.messages
        )

        const scheduledMinutes = input.scheduledFor
            ? Math.max(1, Math.round((input.scheduledFor.getTime() - Date.now()) / 60000))
            : 1

        const uazapiResponse = await createMassCampaign(instanceToken, {
            delayMin: input.delayMin || 3,
            delayMax: input.delayMax || 6,
            info: input.name,
            scheduledFor: scheduledMinutes,
            messages: uazapiMessages
        })

        // 6. Update campaign with UAZAPI folder_id
        await supabase
            .from('campaigns')
            .update({
                uazapi_folder_id: uazapiResponse.folder_id,
                status: uazapiResponse.status || 'scheduled'
            })
            .eq('id', campaign.id)

        revalidatePath('/dashboard/campaigns')
        return { success: true, campaignId: campaign.id }

    } catch (error) {
        console.error('Campaign creation error:', error)
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
    }
}

/**
 * Get all campaigns for the current organization
 */
export async function getCampaigns(): Promise<CampaignData[]> {
    const supabase = await createClient()
    const { organizationId } = await getOrgAndInstance()

    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) {
        console.error('Get campaigns error:', error)
        return []
    }

    return campaigns || []
}

/**
 * Get contacts for contact selector with optional filters
 */
export async function getContactsForCampaign(
    page = 1,
    pageSize = 50,
    filters?: { tagName?: string; stageId?: string }
) {
    const supabase = await createClient()
    const { organizationId } = await getOrgAndInstance()

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    // Build query
    let query = supabase
        .from('contacts')
        .select('id, name, phone, avatar_url, tags', { count: 'exact' })
        .eq('organization_id', organizationId)
        .neq('status', 'closed')

    // Apply tag filter (tags is an array column)
    if (filters?.tagName) {
        query = query.contains('tags', [filters.tagName])
    }

    // Apply stage filter (need to join with deals)
    // For now, we'll fetch contacts that have a deal in the specified stage
    let contactIdsInStage: string[] | null = null
    if (filters?.stageId) {
        const { data: deals } = await supabase
            .from('deals')
            .select('contact_id')
            .eq('organization_id', organizationId)
            .eq('stage_id', filters.stageId)

        if (deals && deals.length > 0) {
            contactIdsInStage = deals.map(d => d.contact_id)
            query = query.in('id', contactIdsInStage)
        } else {
            // No contacts in this stage
            return { contacts: [], total: 0, hasMore: false }
        }
    }

    // Execute query with pagination
    const { data: contacts, error, count } = await query
        .order('name')
        .range(from, to)

    if (error) {
        console.error('Get contacts error:', error)
        return { contacts: [], total: 0, hasMore: false }
    }

    // If we have stage filter, fetch stage names for display
    let contactsWithStage = contacts || []
    if (filters?.stageId && contactsWithStage.length > 0) {
        const { data: stageData } = await supabase
            .from('stages')
            .select('id, name')
            .eq('id', filters.stageId)
            .single()

        if (stageData) {
            contactsWithStage = contactsWithStage.map(c => ({
                ...c,
                stage_id: filters.stageId,
                stage_name: stageData.name
            }))
        }
    }

    return {
        contacts: contactsWithStage,
        total: count || 0,
        hasMore: (count || 0) > to + 1
    }
}

/**
 * Get all tags for the organization
 */
export async function getTags() {
    const supabase = await createClient()
    const { organizationId } = await getOrgAndInstance()

    const { data: tags, error } = await supabase
        .from('tags')
        .select('id, name, color')
        .eq('organization_id', organizationId)
        .order('name')

    if (error) {
        console.error('Get tags error:', error)
        return []
    }

    return tags || []
}

/**
 * Get all stages for the organization (from default pipeline)
 */
export async function getStages() {
    const supabase = await createClient()
    const { organizationId } = await getOrgAndInstance()

    // Get the default pipeline first
    const { data: pipeline } = await supabase
        .from('pipelines')
        .select('id')
        .eq('organization_id', organizationId)
        .limit(1)
        .single()

    if (!pipeline) {
        return []
    }

    const { data: stages, error } = await supabase
        .from('stages')
        .select('id, name, color')
        .eq('pipeline_id', pipeline.id)
        .order('position')

    if (error) {
        console.error('Get stages error:', error)
        return []
    }

    return stages || []
}


/**
 * Pause a running campaign
 */
export async function pauseCampaign(campaignId: string) {
    const supabase = await createClient()
    const { organizationId, instanceToken } = await getOrgAndInstance()

    if (!instanceToken) {
        return { success: false, error: 'WhatsApp não conectado' }
    }

    // Get campaign
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('uazapi_folder_id, status')
        .eq('id', campaignId)
        .eq('organization_id', organizationId)
        .single()

    if (error || !campaign) {
        return { success: false, error: 'Campanha não encontrada' }
    }

    if (!campaign.uazapi_folder_id) {
        return { success: false, error: 'ID da campanha não encontrado' }
    }

    try {
        await controlCampaign(instanceToken, campaign.uazapi_folder_id, 'stop')

        await supabase
            .from('campaigns')
            .update({ status: 'paused' })
            .eq('id', campaignId)

        revalidatePath('/dashboard/campaigns')
        return { success: true }
    } catch (err) {
        console.error('Pause campaign error:', err)
        return { success: false, error: 'Erro ao pausar campanha' }
    }
}

/**
 * Resume a paused campaign
 */
export async function resumeCampaign(campaignId: string) {
    const supabase = await createClient()
    const { organizationId, instanceToken } = await getOrgAndInstance()

    if (!instanceToken) {
        return { success: false, error: 'WhatsApp não conectado' }
    }

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('uazapi_folder_id, status')
        .eq('id', campaignId)
        .eq('organization_id', organizationId)
        .single()

    if (error || !campaign) {
        return { success: false, error: 'Campanha não encontrada' }
    }

    if (!campaign.uazapi_folder_id) {
        return { success: false, error: 'ID da campanha não encontrado' }
    }

    try {
        await controlCampaign(instanceToken, campaign.uazapi_folder_id, 'continue')

        await supabase
            .from('campaigns')
            .update({ status: 'sending' })
            .eq('id', campaignId)

        revalidatePath('/dashboard/campaigns')
        return { success: true }
    } catch (err) {
        console.error('Resume campaign error:', err)
        return { success: false, error: 'Erro ao continuar campanha' }
    }
}

/**
 * Delete a campaign
 */
export async function deleteCampaign(campaignId: string) {
    const supabase = await createClient()
    const { organizationId, instanceToken } = await getOrgAndInstance()

    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('uazapi_folder_id, status')
        .eq('id', campaignId)
        .eq('organization_id', organizationId)
        .single()

    if (error || !campaign) {
        return { success: false, error: 'Campanha não encontrada' }
    }

    try {
        // If campaign has UAZAPI folder_id and is not done, delete from UAZAPI too
        if (campaign.uazapi_folder_id && instanceToken && campaign.status !== 'done') {
            await controlCampaign(instanceToken, campaign.uazapi_folder_id, 'delete')
        }

        // Delete from database (cascade will handle messages and recipients)
        await supabase
            .from('campaigns')
            .delete()
            .eq('id', campaignId)

        revalidatePath('/dashboard/campaigns')
        return { success: true }
    } catch (err) {
        console.error('Delete campaign error:', err)
        return { success: false, error: 'Erro ao excluir campanha' }
    }
}
