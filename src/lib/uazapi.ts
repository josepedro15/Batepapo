/**
 * UAZAPI Client
 * Centralized client for UAZAPI WhatsApp integration
 * Server: https://atendsoft.uazapi.com (fixed)
 */

const UAZAPI_BASE_URL = 'https://atendsoft.uazapi.com'

// Get admin token from environment
function getAdminToken(): string {
    const token = process.env.UAZAPI_ADMIN_TOKEN
    // DEBUG: Log token info (remove after debugging)
    console.log('[UAZAPI DEBUG] Token exists:', !!token)
    console.log('[UAZAPI DEBUG] Token preview:', token ? `${token.substring(0, 10)}...` : 'EMPTY')
    if (!token) {
        throw new Error('UAZAPI_ADMIN_TOKEN environment variable is required')
    }
    return token
}

// Types
export interface UazapiInstance {
    name: string
    token: string
    status: 'disconnected' | 'connecting' | 'connected'
    phone?: string
}

export interface UazapiStatusResponse {
    status: 'disconnected' | 'connecting' | 'connected'
    qrcode?: string
    phone?: string
    pairingCode?: string
}

export interface UazapiConnectResponse {
    status: string
    qrcode?: string
    pairingCode?: string
}

export interface UazapiWebhookConfig {
    enabled: boolean
    url: string
    events: string[]
    excludeMessages?: string[]
}

/**
 * Create a new WhatsApp instance
 * POST /instance/init
 */
export async function createInstance(instanceName: string): Promise<{ name: string; token: string }> {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/init`, {
        method: 'POST',
        headers: {
            'admintoken': getAdminToken(),
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            name: instanceName,
            systemName: 'crm-batepapo'
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to create instance: ${error}`)
    }

    return response.json()
}

/**
 * List all instances
 * GET /instance/all
 */
export async function listInstances(): Promise<UazapiInstance[]> {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/all`, {
        headers: {
            'admintoken': getAdminToken()
        }
    })

    if (!response.ok) {
        throw new Error('Failed to list instances')
    }

    return response.json()
}

/**
 * Configure webhook for an instance
 * POST /webhook
 */
export async function configureWebhook(
    instanceToken: string,
    webhookUrl: string
): Promise<void> {
    const config: UazapiWebhookConfig = {
        enabled: true,
        url: webhookUrl,
        events: ['messages', 'connection', 'messages_update'],
        excludeMessages: ['wasSentByApi']
    }

    const response = await fetch(`${UAZAPI_BASE_URL}/webhook`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(config)
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to configure webhook: ${error}`)
    }
}

/**
 * Start connection (generate QR code)
 * POST /instance/connect
 */
export async function connect(instanceToken: string): Promise<UazapiConnectResponse> {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/connect`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({}) // Empty body = generate QR code
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to connect: ${error}`)
    }

    const data = await response.json()

    // QR code is nested inside instance object
    return {
        status: data.instance?.status || 'connecting',
        qrcode: data.instance?.qrcode || data.qrcode,
        pairingCode: data.instance?.paircode || data.paircode
    }
}

/**
 * Get instance status (includes QR code if connecting)
 * Uses /instance/all with admintoken to get complete status including qrcode
 */
export async function getStatus(instanceToken: string): Promise<UazapiStatusResponse> {
    // Use /instance/all which includes qrcode in response
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/all`, {
        headers: {
            'admintoken': getAdminToken()
        }
    })

    if (!response.ok) {
        throw new Error('Failed to get status')
    }

    const instances = await response.json()

    // Find our instance by token
    const instance = instances.find((inst: { token: string }) => inst.token === instanceToken)

    if (!instance) {
        return {
            status: 'disconnected',
            qrcode: undefined,
            phone: undefined
        }
    }

    return {
        status: instance.status || 'disconnected',
        qrcode: instance.qrcode || undefined,
        phone: instance.owner || undefined,
        pairingCode: instance.paircode || undefined
    }
}

/**
 * Disconnect instance
 * POST /instance/disconnect
 */
export async function disconnect(instanceToken: string): Promise<void> {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance/disconnect`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        }
    })

    if (!response.ok) {
        throw new Error('Failed to disconnect')
    }
}

/**
 * Delete instance completely
 * DELETE /instance
 */
export async function deleteInstance(instanceToken: string): Promise<void> {
    const response = await fetch(`${UAZAPI_BASE_URL}/instance`, {
        method: 'DELETE',
        headers: {
            'token': instanceToken
        }
    })

    if (!response.ok) {
        throw new Error('Failed to delete instance')
    }
}

/**
 * Send text message
 * POST /message/text
 */
export async function sendTextMessage(
    instanceToken: string,
    phone: string,
    message: string
): Promise<{ messageId: string }> {
    const response = await fetch(`${UAZAPI_BASE_URL}/send/text`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            number: phone.includes('@') ? phone : `${phone.replace(/\D/g, '')}@s.whatsapp.net`,
            text: message
        })
    })

    if (!response.ok) {
        const error = await response.text()
        throw new Error(`Failed to send message: ${error}`)
    }

    return response.json()
}

/**
 * Send media (image, video, audio, document)
 * POST /send/media
 * Unified endpoint for all media types
 */
export async function sendMedia(
    instanceToken: string,
    phone: string,
    type: 'image' | 'video' | 'audio' | 'ptt' | 'document',
    fileUrl: string,
    caption?: string
): Promise<{ messageId: string }> {
    const response = await fetch(`${UAZAPI_BASE_URL}/send/media`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            number: phone.replace(/\D/g, ''),
            phone: phone.replace(/\D/g, ''), // Redundant for compatibility
            type,
            file: fileUrl,
            url: fileUrl, // Redundant for compatibility
            media: fileUrl, // Redundant for compatibility
            text: caption,
            caption: caption // Redundant for compatibility
        })
    })

    if (!response.ok) {
        const errorText = await response.text()
        console.error('UAZAPI send/media error:', errorText)
        throw new Error(`Failed to send ${type}: ${errorText}`)
    }

    return response.json()
}

/**
 * Send image message (wrapper for sendMedia)
 */
export async function sendImageMessage(
    instanceToken: string,
    phone: string,
    imageUrl: string,
    caption?: string
): Promise<{ messageId: string }> {
    return sendMedia(instanceToken, phone, 'image', imageUrl, caption)
}

/**
 * Send voice message (PTT) (wrapper for sendMedia)
 */
export async function sendVoiceMessage(
    instanceToken: string,
    phone: string,
    audioUrl: string
): Promise<{ messageId: string }> {
    return sendMedia(instanceToken, phone, 'ptt', audioUrl)
}

/**
 * Get WhatsApp contacts from the connected phone
 * GET /contacts
 */
export interface WhatsAppContact {
    id: string
    name: string
    phone: string
    isGroup?: boolean
    profilePicUrl?: string
}

export async function getContacts(instanceToken: string): Promise<WhatsAppContact[]> {
    const response = await fetch(`${UAZAPI_BASE_URL}/contacts`, {
        headers: {
            'token': instanceToken
        }
    })

    if (!response.ok) {
        throw new Error('Failed to get contacts')
    }

    const data = await response.json()

    // Format contacts - filter out groups and extract phone
    return (data || [])
        .filter((c: any) => !c.id?.includes('@g.us')) // Filter groups
        .map((c: any) => ({
            id: c.id,
            name: c.name || c.notify || c.id?.split('@')[0] || 'Unknown',
            phone: c.id?.split('@')[0] || '',
            profilePicUrl: c.profilePicUrl || c.image || c.imagePreview || c.picture || c.params?.imagePreview
        }))
        .slice(0, 100) // Limit to 100 contacts
}

/**
 * List contacts with pagination
 * POST /contacts/list
 */
export interface ContactListParams {
    page?: number
    pageSize?: number // max 1000
    limit?: number // alias for pageSize
    offset?: number
    search?: string // Optional search term
}

export interface ContactListResponse {
    contacts: WhatsAppContact[]
    total?: number
    page?: number
    pageSize?: number
}

export async function listContacts(
    instanceToken: string,
    params: ContactListParams = {}
): Promise<ContactListResponse> {
    const response = await fetch(`${UAZAPI_BASE_URL}/contacts/list`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            page: params.page || 1,
            pageSize: params.pageSize || 20,
            ...(params.search ? { search: params.search } : {})
        })
    })

    if (!response.ok) {
        throw new Error('Failed to list contacts')
    }

    const data = await response.json()

    // Handle different response structures gracefully
    const rawContacts = Array.isArray(data) ? data : (data.contacts || data.items || [])

    // DEBUG: Log first contact structure to help debug "Unknown" issue
    if (rawContacts.length > 0) {
        console.log('[UAZAPI DEBUG] First contact keys:', Object.keys(rawContacts[0]))
    }

    const formattedContacts = rawContacts
        .filter((c: any) => {
            const id = c.jid || c.id || c.chatId
            return id && !id.includes('@g.us')
        })
        .map((c: any) => {
            const id = c.jid || c.id || c.chatId
            const phone = id ? id.split('@')[0] : (c.number || c.phone || '')

            // Map fields based on verified response: {"contact_name": "...", "jid": "..."}
            const name = c.contact_name || c.contact_FirstName || c.name || c.pushName || c.notify || c.verifiedName || phone || 'Unknown'

            return {
                id: id,
                name: name,
                phone: phone,
                // API response doesn't include profile pic in list
                profilePicUrl: c.profilePicUrl || c.image || c.picture || null
            }
        })

    // Fallback: If no contacts found via /contacts/list on first page, try /contacts
    if (formattedContacts.length === 0 && (!params.page || params.page === 1) && !params.search) {
        console.log('[UAZAPI] listContacts returned 0 items, trying /contacts fallback')
        try {
            const fallbackContacts = await getContacts(instanceToken)
            return {
                contacts: fallbackContacts,
                total: fallbackContacts.length,
                page: 1,
                pageSize: fallbackContacts.length
            }
        } catch (err) {
            console.error('[UAZAPI] Fallback also failed:', err)
        }
    }

    return {
        contacts: formattedContacts,
        total: data.total || formattedContacts.length,
        page: params.page || 1,
        pageSize: params.pageSize || 20
    }
}

/**
 * Fetch profile picture for a specific phone number
 * POST /misc/downProfile
 */
/**
 * Fetch profile picture for a specific phone number
 * POST /misc/downProfile
 */
export async function fetchProfilePicture(
    instanceToken: string,
    phone: string
): Promise<string | null> {
    try {
        const cleanPhone = phone.replace(/\D/g, '')
        const formattedPhone = cleanPhone.includes('@') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`

        const response = await fetch(`${UAZAPI_BASE_URL}/misc/downProfile`, {
            method: 'POST',
            headers: {
                'token': instanceToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: formattedPhone
            })
        })

        if (!response.ok) {
            console.error('UAZAPI fetchProfilePicture error:', await response.text())
            // return null
        }

        const data = await response.json()
        // API usually returns { link: "url", ... } or just the url string in some versions
        // Based on similar APIs, it might be data.link, data.url, or data.picture

        // Debug
        // console.log('Profile Pic Response:', data)

        return data.link || data.url || data.picture || data.profilePic || null

    } catch (error) {
        console.error('Error fetching profile picture:', error)
        return null
    }
}

/**
 * Download media as Base64
 * POST /message/download
 */
export async function downloadMedia(
    instanceToken: string,
    messageId: string
): Promise<{ base64: string; mimeType: string } | null> {
    try {
        const response = await fetch(`${UAZAPI_BASE_URL}/message/download`, {
            method: 'POST',
            headers: {
                'token': instanceToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id: messageId,
                return_base64: "true"
            })
        })

        if (!response.ok) {
            console.error('UAZAPI download failed:', response.status, await response.text())
            return null
        }

        const data = await response.json()

        // Debug log
        console.log('UAZAPI Download Response Keys:', Object.keys(data))

        return {
            base64: data.base64Data || data.data || data.base64 || data.content || data.response || data.body,
            mimeType: data.mimetype || data.mimeType || 'audio/ogg'
        }
    } catch (error) {
        console.error('Error downloading media:', error)
        return null
    }
}

// =====================================================
// MASS CAMPAIGN FUNCTIONS
// =====================================================

/**
 * Message types for mass campaigns
 */
export interface MassCampaignMessage {
    number: string
    type: 'text' | 'button' | 'list' | 'document' | 'carousel'
    text?: string
    file?: string
    docName?: string
    footerText?: string
    imageButton?: string
    listButton?: string
    choices?: string[]
}

/**
 * Options for creating a mass campaign
 */
export interface MassCampaignOptions {
    delayMin?: number  // seconds (default: 3)
    delayMax?: number  // seconds (default: 6)
    info?: string      // campaign description
    scheduledFor?: number // timestamp in ms or minutes from now
    messages: MassCampaignMessage[]
}

/**
 * Response from creating a mass campaign
 */
export interface MassCampaignResponse {
    folder_id: string
    status: 'scheduled' | 'sending'
    total_messages: number
}

/**
 * Create a mass campaign using advanced sender
 * POST /sender/advanced
 */
export async function createMassCampaign(
    instanceToken: string,
    options: MassCampaignOptions
): Promise<MassCampaignResponse> {
    const response = await fetch(`${UAZAPI_BASE_URL}/sender/advanced`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            delayMin: options.delayMin || 3,
            delayMax: options.delayMax || 6,
            info: options.info || 'Campanha via CRM',
            scheduled_for: options.scheduledFor || 1, // 1 = start immediately (1 minute)
            messages: options.messages
        })
    })

    if (!response.ok) {
        const error = await response.text()
        console.error('UAZAPI createMassCampaign error:', error)
        throw new Error(`Failed to create mass campaign: ${error}`)
    }

    const data = await response.json()

    return {
        folder_id: data.folder_id || data.folderId || data.id,
        status: data.status || 'scheduled',
        total_messages: options.messages.length
    }
}

/**
 * Control an existing campaign (stop, continue, delete)
 * POST /sender/edit
 */
export async function controlCampaign(
    instanceToken: string,
    folderId: string,
    action: 'stop' | 'continue' | 'delete'
): Promise<{ success: boolean; status?: string }> {
    const response = await fetch(`${UAZAPI_BASE_URL}/sender/edit`, {
        method: 'POST',
        headers: {
            'token': instanceToken,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            folder_id: folderId,
            action: action
        })
    })

    if (!response.ok) {
        const error = await response.text()
        console.error('UAZAPI controlCampaign error:', error)
        throw new Error(`Failed to ${action} campaign: ${error}`)
    }

    const data = await response.json()

    // Map action to expected status
    const statusMap: Record<string, string> = {
        'stop': 'paused',
        'continue': 'sending',
        'delete': 'deleting'
    }

    return {
        success: true,
        status: data.status || statusMap[action]
    }
}

/**
 * Build campaign messages array from contacts and message template
 * Helper function to format messages for UAZAPI
 */
export function buildCampaignMessages(
    contacts: Array<{ phone: string; name?: string }>,
    messageTemplates: Array<{
        type: MassCampaignMessage['type']
        text?: string
        file?: string
        docName?: string
        footerText?: string
        imageButton?: string
        listButton?: string
        choices?: string[]
    }>
): MassCampaignMessage[] {
    const messages: MassCampaignMessage[] = []

    for (const contact of contacts) {
        const cleanPhone = contact.phone.replace(/\D/g, '')

        for (const template of messageTemplates) {
            // Replace {{nome}} placeholder with contact name
            const personalizedText = template.text?.replace(
                /\{\{nome\}\}/gi,
                contact.name || 'Cliente'
            )

            messages.push({
                number: cleanPhone,
                type: template.type,
                text: personalizedText,
                file: template.file,
                docName: template.docName,
                footerText: template.footerText,
                imageButton: template.imageButton,
                listButton: template.listButton,
                choices: template.choices
            })
        }
    }

    return messages
}

/**
 * Get campaign status/progress from UAZAPI
 * GET /sender/listfolders - Lists all campaigns with their status
 * Returns the current status of a campaign including sent/failed counts
 * 
 * Response fields:
 * - id: campaign folder_id
 * - info: campaign name/description
 * - status: 'scheduled' | 'sending' | 'paused' | 'done' | 'deleting'
 * - log_total: total messages in campaign
 * - log_sucess: successfully sent messages (note: typo in API)
 * - log_failed: failed messages
 */
export interface CampaignStatusInfo {
    folder_id: string
    info: string
    status: 'scheduled' | 'sending' | 'paused' | 'done' | 'deleting'
    total_messages: number
    sent_count: number
    failed_count: number
    pending_count: number
}

/**
 * List all campaigns (folders) with their status
 * GET /sender/listfolders
 */
export async function listCampaignFolders(
    instanceToken: string,
    statusFilter?: 'scheduled' | 'sending' | 'paused' | 'done'
): Promise<CampaignStatusInfo[]> {
    try {
        let url = `${UAZAPI_BASE_URL}/sender/listfolders`
        if (statusFilter) {
            url += `?status=${statusFilter}`
        }

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'token': instanceToken
            }
        })

        if (!response.ok) {
            const error = await response.text()
            console.error('UAZAPI listCampaignFolders error:', error)
            return []
        }

        const data = await response.json()

        // Data is an array of campaign folders
        const folders = Array.isArray(data) ? data : (data.folders || data.items || [])

        return folders.map((folder: any) => {
            const total = folder.log_total || 0
            const sent = folder.log_sucess || folder.log_success || 0 // UAZAPI has typo "sucess"
            const failed = folder.log_failed || 0

            return {
                folder_id: folder.id || folder.folder_id,
                info: folder.info || '',
                status: folder.status || 'scheduled',
                total_messages: total,
                sent_count: sent,
                failed_count: failed,
                pending_count: Math.max(0, total - sent - failed)
            }
        })
    } catch (error) {
        console.error('Error listing campaign folders:', error)
        return []
    }
}

/**
 * Get a specific campaign's status by folder_id
 */
export async function getCampaignStatus(
    instanceToken: string,
    folderId: string
): Promise<CampaignStatusInfo | null> {
    try {
        const folders = await listCampaignFolders(instanceToken)

        // Find the specific campaign
        const campaign = folders.find(f => f.folder_id === folderId)

        if (!campaign) {
            console.log(`[UAZAPI] Campaign not found in listfolders: ${folderId}`)
            return null
        }

        return campaign
    } catch (error) {
        console.error('Error getting campaign status:', error)
        return null
    }
}
