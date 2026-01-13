'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import {
    createMassCampaign,
    controlCampaign,
    buildCampaignMessages,
    getCampaignStatus,
    type MassCampaignMessage
} from '@/lib/uazapi'

// Zod validation schemas
const messageSchema = z.object({
    type: z.enum(['text', 'button', 'list', 'document', 'carousel']),
    text: z.string().optional(),
    file: z.string().optional(),
    docName: z.string().optional(),
    footerText: z.string().optional(),
    imageButton: z.string().optional(),
    listButton: z.string().optional(),
    choices: z.array(z.string()).optional()
}).refine(
    (msg) => {
        // Text message must have text
        if (msg.type === 'text') {
            return !!msg.text && msg.text.trim().length > 0
        }
        // Document must have file
        if (msg.type === 'document') {
            return !!msg.file
        }
        // Button/List need text at minimum
        if (msg.type === 'button' || msg.type === 'list') {
            return !!msg.text && msg.text.trim().length > 0
        }
        return true
    },
    { message: 'Mensagem inválida: verifique se todos os campos obrigatórios estão preenchidos' }
)

const createCampaignSchema = z.object({
    name: z.string()
        .min(1, 'Nome da campanha é obrigatório')
        .max(100, 'Nome da campanha deve ter no máximo 100 caracteres'),
    delayMin: z.number()
        .min(1, 'Delay mínimo deve ser pelo menos 1 segundo')
        .max(60, 'Delay mínimo deve ser no máximo 60 segundos')
        .optional()
        .default(3),
    delayMax: z.number()
        .min(1, 'Delay máximo deve ser pelo menos 1 segundo')
        .max(120, 'Delay máximo deve ser no máximo 120 segundos')
        .optional()
        .default(6),
    scheduledFor: z.date({ message: 'Data de agendamento é obrigatória' }),
    contactIds: z.array(z.string().uuid())
        .min(1, 'Selecione pelo menos um contato'),
    messages: z.array(messageSchema)
        .min(1, 'Adicione pelo menos uma mensagem')
}).refine(
    (data) => (data.delayMin || 3) <= (data.delayMax || 6),
    { message: 'Delay mínimo deve ser menor ou igual ao delay máximo', path: ['delayMin'] }
)

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

    // Get WhatsApp instance for this org (don't filter by status in query)
    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_token, status')
        .eq('organization_id', member.organization_id)
        .single()

    return {
        userId: user.id,
        organizationId: member.organization_id,
        instanceToken: instance?.instance_token || null,
        instanceConnected: instance?.status === 'connected'
    }
}

/**
 * Create a new mass campaign
 */
export async function createCampaign(input: CreateCampaignInput) {
    // Validate input with Zod
    const validation = createCampaignSchema.safeParse(input)
    if (!validation.success) {
        const firstError = validation.error.issues[0]
        return { success: false, error: firstError.message }
    }

    const validatedInput = validation.data

    const supabase = await createClient()
    const { organizationId, instanceToken, instanceConnected } = await getOrgAndInstance()

    console.log('[Campaign] Starting creation:', {
        name: validatedInput.name,
        contactCount: validatedInput.contactIds.length,
        instanceConnected,
        hasToken: !!instanceToken
    })

    if (!instanceConnected || !instanceToken) {
        console.log('[Campaign] WhatsApp not connected')
        return { success: false, error: 'WhatsApp não conectado. Conecte sua instância primeiro.' }
    }

    try {
        // 1. Fetch selected contacts with phone numbers
        const { data: contacts, error: contactsError } = await supabase
            .from('contacts')
            .select('id, name, phone')
            .in('id', validatedInput.contactIds)

        if (contactsError || !contacts?.length) {
            console.error('[Campaign] Error fetching contacts:', contactsError)
            return { success: false, error: 'Erro ao buscar contatos' }
        }

        console.log('[Campaign] Found contacts:', contacts.length)

        // 2. Determine initial status based on scheduling
        // If scheduledFor is in the future by more than 2 minutes, set as 'scheduled'
        // Otherwise, set as 'sending' for immediate send
        const isScheduledForFuture = validatedInput.scheduledFor &&
            (validatedInput.scheduledFor.getTime() - Date.now()) > 120000; // More than 2 minutes in future

        const initialStatus = isScheduledForFuture ? 'scheduled' : 'sending'

        const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .insert({
                organization_id: organizationId,
                name: validatedInput.name,
                message_template: validatedInput.messages[0]?.text || 'Campanha em massa',
                status: initialStatus,
                total_contacts: contacts.length,
                scheduled_for: validatedInput.scheduledFor?.toISOString() || null
            })
            .select()
            .single()

        if (campaignError || !campaign) {
            console.error('[Campaign] Error creating campaign:', campaignError)
            return { success: false, error: 'Erro ao criar campanha: ' + (campaignError?.message || 'unknown') }
        }

        console.log('[Campaign] Created campaign:', campaign.id)

        // 3. Try to save campaign messages (optional - table may not exist)
        try {
            const messageInserts = validatedInput.messages.map((msg, index) => ({
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
        } catch (msgErr) {
            console.log('[Campaign] campaign_messages table may not exist, skipping')
        }

        // 4. Try to save campaign recipients (optional - table may not exist)
        try {
            const recipientInserts = contacts.map(c => ({
                campaign_id: campaign.id,
                contact_id: c.id,
                phone: c.phone,
                status: 'pending'
            }))
            await supabase.from('campaign_recipients').insert(recipientInserts)
        } catch (recErr) {
            console.log('[Campaign] campaign_recipients table may not exist, skipping')
        }

        // 5. Build UAZAPI messages and send campaign
        const uazapiMessages = buildCampaignMessages(
            contacts.map(c => ({ phone: c.phone, name: c.name })),
            validatedInput.messages
        )

        console.log('[Campaign] Sending to UAZAPI:', uazapiMessages.length, 'messages')
        console.log('[Campaign] First message sample:', JSON.stringify(uazapiMessages[0], null, 2))

        // Calculate scheduled time
        // If scheduledFor is provided, calculate minutes from now
        // Otherwise, use 1 minute (immediate)
        const scheduledMinutes = validatedInput.scheduledFor
            ? Math.max(1, Math.round((validatedInput.scheduledFor.getTime() - Date.now()) / 60000))
            : 1

        console.log('[Campaign] Scheduling config:', {
            inputScheduledFor: validatedInput.scheduledFor?.toISOString() || 'immediate',
            scheduledMinutes,
            isScheduledForFuture,
            initialStatus,
            delayMin: validatedInput.delayMin,
            delayMax: validatedInput.delayMax
        })

        try {
            const uazapiResponse = await createMassCampaign(instanceToken, {
                delayMin: validatedInput.delayMin,
                delayMax: validatedInput.delayMax,
                info: validatedInput.name,
                scheduledFor: scheduledMinutes,
                messages: uazapiMessages
            })

            console.log('[Campaign] UAZAPI response:', JSON.stringify(uazapiResponse, null, 2))

            // 6. Update campaign with UAZAPI folder_id
            // Set status based on whether it's scheduled or immediate
            const finalStatus = isScheduledForFuture ? 'scheduled' : 'sending'

            const { error: updateError } = await supabase
                .from('campaigns')
                .update({
                    uazapi_folder_id: uazapiResponse.folder_id || 'unknown',
                    status: finalStatus
                })
                .eq('id', campaign.id)

            if (updateError) {
                console.error('[Campaign] Error updating campaign:', updateError)
            } else {
                console.log('[Campaign] Successfully updated campaign status to', finalStatus)
            }
        } catch (uazapiError) {
            console.error('[Campaign] UAZAPI error:', uazapiError)
            // Update campaign to show error
            await supabase
                .from('campaigns')
                .update({
                    status: 'draft' // Keep as draft if UAZAPI fails
                })
                .eq('id', campaign.id)

            return {
                success: false,
                error: 'Erro ao enviar para UAZAPI: ' + (uazapiError instanceof Error ? uazapiError.message : 'Erro desconhecido')
            }
        }

        revalidatePath('/dashboard/campaigns')
        return { success: true, campaignId: campaign.id }

    } catch (error) {
        console.error('[Campaign] Creation error:', error)
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

/**
 * Sync campaign status from UAZAPI
 * Updates sent_count, failed_count and status in the database
 * Auto-finalizes campaign when complete
 */
export async function syncCampaignStatus(campaignId: string) {
    const supabase = await createClient()
    const { organizationId, instanceToken } = await getOrgAndInstance()

    if (!instanceToken) {
        return { success: false, error: 'WhatsApp não conectado' }
    }

    // Get campaign with folder_id
    const { data: campaign, error } = await supabase
        .from('campaigns')
        .select('id, uazapi_folder_id, status, total_contacts, sent_count, failed_count, scheduled_for')
        .eq('id', campaignId)
        .eq('organization_id', organizationId)
        .single()

    if (error || !campaign) {
        return { success: false, error: 'Campanha não encontrada' }
    }

    // Skip if campaign is already done or has no folder_id
    if (campaign.status === 'done' || campaign.status === 'draft') {
        return { success: true, campaign, noUpdate: true }
    }

    if (!campaign.uazapi_folder_id) {
        return { success: false, error: 'ID da campanha UAZAPI não encontrado' }
    }

    try {
        // Fetch status from UAZAPI
        const statusInfo = await getCampaignStatus(instanceToken, campaign.uazapi_folder_id)

        if (!statusInfo) {
            // If UAZAPI doesn't return info, try to infer from scheduled time
            // If scheduled_for has passed, mark as sending
            if (campaign.status === 'scheduled' && campaign.scheduled_for) {
                const scheduledTime = new Date(campaign.scheduled_for).getTime()
                if (Date.now() >= scheduledTime) {
                    await supabase
                        .from('campaigns')
                        .update({ status: 'sending' })
                        .eq('id', campaignId)

                    return {
                        success: true,
                        campaign: { ...campaign, status: 'sending' }
                    }
                }
            }
            return { success: true, campaign, noUpdate: true }
        }

        // Determine new status
        let newStatus = campaign.status

        // Map UAZAPI status to our status (UAZAPI returns: scheduled, sending, paused, done, deleting)
        if (statusInfo.status === 'done') {
            newStatus = 'done'
        } else if (statusInfo.status === 'sending') {
            newStatus = 'sending'
        } else if (statusInfo.status === 'paused') {
            newStatus = 'paused'
        } else if (statusInfo.status === 'scheduled') {
            newStatus = 'scheduled'
        }

        // Auto-finalize if all messages sent/failed
        if (statusInfo.sent_count + statusInfo.failed_count >= campaign.total_contacts) {
            newStatus = 'done'
        }

        // Update database if there are changes
        const hasChanges =
            campaign.sent_count !== statusInfo.sent_count ||
            campaign.failed_count !== statusInfo.failed_count ||
            campaign.status !== newStatus

        if (hasChanges) {
            await supabase
                .from('campaigns')
                .update({
                    sent_count: statusInfo.sent_count,
                    failed_count: statusInfo.failed_count,
                    status: newStatus
                })
                .eq('id', campaignId)

            console.log('[Campaign] Synced status:', {
                id: campaignId,
                sent: statusInfo.sent_count,
                failed: statusInfo.failed_count,
                status: newStatus
            })
        }

        return {
            success: true,
            campaign: {
                ...campaign,
                sent_count: statusInfo.sent_count,
                failed_count: statusInfo.failed_count,
                status: newStatus
            }
        }
    } catch (err) {
        console.error('Sync campaign status error:', err)
        return { success: false, error: 'Erro ao sincronizar status' }
    }
}

/**
 * Sync all active campaigns (sending/scheduled status)
 * Called by frontend polling
 */
export async function syncAllActiveCampaigns() {
    const supabase = await createClient()
    const { organizationId } = await getOrgAndInstance()

    // Get all campaigns that are sending or scheduled
    const { data: campaigns, error } = await supabase
        .from('campaigns')
        .select('id')
        .eq('organization_id', organizationId)
        .in('status', ['sending', 'scheduled'])

    if (error || !campaigns?.length) {
        return { success: true, campaigns: [] }
    }

    // Sync each campaign
    const results = await Promise.all(
        campaigns.map(c => syncCampaignStatus(c.id))
    )

    // Get updated campaigns
    const { data: updatedCampaigns } = await supabase
        .from('campaigns')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    return { success: true, campaigns: updatedCampaigns || [] }
}

