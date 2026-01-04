/**
 * UAZAPI Client
 * Centralized client for UAZAPI WhatsApp integration
 * Server: https://atendsoft.uazapi.com (fixed)
 */

const UAZAPI_BASE_URL = 'https://atendsoft.uazapi.com'

// Get admin token from environment
function getAdminToken(): string {
    const token = process.env.UAZAPI_ADMIN_TOKEN
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
    return sendMedia(instanceToken, phone, 'audio', audioUrl)
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

    } catch (error) {
        console.error('Error fetching profile picture:', error)
        return null
    }
    return null
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
