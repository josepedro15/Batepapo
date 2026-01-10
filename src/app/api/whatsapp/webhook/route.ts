import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import * as uazapi from '@/lib/uazapi'

// Types for ACTUAL UAZAPI webhook payloads (discovered from real data)
interface UazapiWebhookPayload {
    BaseUrl?: string
    EventType?: string  // "messages", "connection", etc.
    token?: string      // Instance token
    instanceName?: string
    owner?: string      // Phone number of the WhatsApp instance

    // Message data
    message?: {
        chatid?: string      // e.g., "5519989349254@s.whatsapp.net"
        text?: string        // Message text
        fromMe?: boolean
        id?: string
        messageid?: string
        type?: string        // "media", "text", etc.
        messageType?: string // "ExtendedTextMessage", "AudioMessage", etc.
        senderName?: string
        sender?: string
        senderPhoto?: string  // Potential field for profile picture
        content?: {
            text?: string
            URL?: string     // UAZAPI audio URL
            url?: string     // Alternative casing
        }
        mediaType?: string
        wasSentByApi?: boolean
    }

    // Chat/Contact data
    chat?: {
        name?: string
        phone?: string
        wa_chatid?: string
        wa_contactName?: string
        profilePicUrl?: string
        image?: string       // From user payload
        imagePreview?: string // From user payload
    }

    // Legacy format support (for connection events)
    event?: string
    status?: 'disconnected' | 'connecting' | 'connected'
    phone?: string
}

// POST: Receive webhooks from UAZAPI
export async function POST(request: NextRequest) {
    try {
        const body: UazapiWebhookPayload = await request.json()
        const supabase = createAdminClient()

        if (!supabase) {
            console.error('Admin client not configured')
            return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
        }

        // Log the full payload for debugging
        console.log('=== WEBHOOK RECEIVED ===')
        console.log('EventType:', body.EventType)
        console.log('Token:', body.token)
        console.log('Full body:', JSON.stringify(body, null, 2))

        // Get instance token from body or URL
        const instanceToken = body.token ||
            request.headers.get('x-instance-token') ||
            request.nextUrl.searchParams.get('token')

        // Find the organization by instance token
        let organizationId: string
        let instanceId: string

        if (instanceToken) {
            const { data: instance } = await supabase
                .from('whatsapp_instances')
                .select('id, organization_id, status')
                .eq('instance_token', instanceToken)
                .single()

            if (instance) {
                organizationId = instance.organization_id
                instanceId = instance.id
            } else {
                // Fallback: get first instance
                const { data: firstInstance } = await supabase
                    .from('whatsapp_instances')
                    .select('id, organization_id')
                    .limit(1)
                    .single()

                if (!firstInstance) {
                    console.error('No WhatsApp instances configured')
                    return NextResponse.json({ error: 'No instance found' }, { status: 404 })
                }

                organizationId = firstInstance.organization_id
                instanceId = firstInstance.id
            }
        } else {
            // No token - use first instance
            const { data: firstInstance } = await supabase
                .from('whatsapp_instances')
                .select('id, organization_id')
                .limit(1)
                .single()

            if (!firstInstance) {
                console.error('No WhatsApp instances configured')
                return NextResponse.json({ error: 'No instance found' }, { status: 404 })
            }

            organizationId = firstInstance.organization_id
            instanceId = firstInstance.id
        }

        console.log('Using organization:', organizationId)

        // Handle connection events (legacy format)
        if (body.status || body.event === 'connection' || body.EventType === 'connection') {
            const newStatus = body.status || 'disconnected'

            await supabase
                .from('whatsapp_instances')
                .update({
                    status: newStatus,
                    phone_number: body.phone || body.owner || null,
                    last_connected_at: newStatus === 'connected' ? new Date().toISOString() : null
                })
                .eq('id', instanceId)

            console.log(`Instance ${instanceId} status updated to: ${newStatus}`)
            return NextResponse.json({ success: true })
        }

        // Handle message events (NEW UAZAPI FORMAT)
        if (body.EventType === 'messages' && body.message) {
            const msg = body.message
            const chat = body.chat

            console.log('Processing message:', {
                chatid: msg.chatid,
                text: msg.text,
                fromMe: msg.fromMe,
                senderName: msg.senderName
            })

            // Skip if no chatid
            if (!msg.chatid) {
                console.log('No chatid, skipping')
                return NextResponse.json({ success: true })
            }

            // Skip messages sent by API (to avoid loops)
            if (msg.wasSentByApi) {
                console.log('Message was sent by API, skipping to avoid loop')
                return NextResponse.json({ success: true })
            }

            // Deduplication: Check if message already exists
            const messageId = msg.messageid || msg.id
            if (messageId) {
                const { data: existingMsg } = await supabase
                    .from('messages')
                    .select('id')
                    .eq('whatsapp_id', messageId)
                    .single()

                if (existingMsg) {
                    console.log('Duplicate message, skipping:', messageId)
                    return NextResponse.json({ success: true })
                }
            }

            // Extract phone number from chatid
            const phoneFromChatId = msg.chatid.split('@')[0]
            const digits = phoneFromChatId.replace(/\D/g, '')
            const rawPhone = `+${digits}`

            // Get contact name
            const contactName = msg.senderName || chat?.name || chat?.wa_contactName || rawPhone

            console.log('Looking for contact:', { rawPhone, contactName, organizationId })

            // Find or create contact
            let contactId: string | undefined

            // Try to find existing contact by phone
            const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('phone', rawPhone)
                .single()

            if (existingContact) {
                contactId = existingContact.id
                console.log('Found existing contact:', contactId)
            } else {
                // Also try with formatted phone (from chat.phone)
                const formattedPhone = chat?.phone
                if (formattedPhone) {
                    const { data: formattedContact } = await supabase
                        .from('contacts')
                        .select('id')
                        .eq('organization_id', organizationId)
                        .eq('phone', formattedPhone)
                        .single()

                    if (formattedContact) {
                        contactId = formattedContact.id
                        console.log('Found contact by formatted phone:', contactId)
                    }
                }

                // Create new contact if not found
                // Create new contact if not found
                if (!contactId) {
                    console.log('Creating new contact...')
                    const { data: newContact, error } = await supabase
                        .from('contacts')
                        .insert({
                            organization_id: organizationId,
                            phone: rawPhone,
                            name: contactName,
                            avatar_url: msg.senderPhoto || chat?.imagePreview || chat?.image || chat?.profilePicUrl || null,
                            status: 'open'
                        })
                        .select('id')
                        .single()

                    if (error || !newContact) {
                        console.error('Error creating contact:', error)
                        return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
                    }
                    contactId = newContact.id
                    console.log('Created new contact:', contactId)

                }
            }



            // Update avatar_url if provided and different
            const newAvatarUrl = msg.senderPhoto || chat?.imagePreview || chat?.image || chat?.profilePicUrl
            if (newAvatarUrl && contactId) {
                await supabase
                    .from('contacts')
                    .update({ avatar_url: newAvatarUrl })
                    .eq('id', contactId)
            }

            // Extract message text and media
            const messageText = msg.text || msg.content?.text || ''
            const isFromMe = msg.fromMe || false

            let mediaUrl = null
            let mediaType = null

            // Handle Media (Audio/Image)
            if (['ptt', 'audio', 'image'].includes(msg.mediaType || '') || msg.type === 'audio' || msg.type === 'image') {
                console.log(`Media message detected (${msg.mediaType}). Proceeding to download...`)
                try {
                    // 1. Download Base64 from UAZAPI
                    // Use msg.id (long ID) as n8n does
                    const media = await uazapi.downloadMedia(instanceToken as string, msg.id || messageId || '')

                    if (media && media.base64 && media.base64.length > 100) {
                        // 2. Convert Base64 to Buffer
                        const buffer = Buffer.from(media.base64, 'base64')

                        // Determine extension
                        let ext = media.mimeType.split('/')[1] || 'ogg'
                        if (msg.mediaType === 'image') {
                            ext = 'jpeg'
                        }

                        const fileName = `${contactId}/${messageId}.${ext}`

                        // 3. Upload to Supabase Storage
                        // Use admin client for storage upload
                        const { data: uploadData, error: uploadError } = await supabase
                            .storage
                            .from('chat-media')
                            .upload(fileName, buffer, {
                                contentType: media.mimeType,
                                upsert: true
                            })

                        if (uploadError) {
                            console.error('Error uploading media to storage:', uploadError)
                        } else {
                            // 4. Get Public URL
                            const { data: publicUrlData } = supabase
                                .storage
                                .from('chat-media')
                                .getPublicUrl(fileName)

                            mediaUrl = publicUrlData.publicUrl
                            mediaType = msg.mediaType === 'ptt' ? 'audio' : msg.mediaType
                            console.log(`✅ Media (${mediaType}) uploaded to:`, mediaUrl)
                        }
                    } else {
                        console.error('Failed to download media form UAZAPI (empty or null)')
                    }
                } catch (err: any) {
                    console.error('Error processing media:', err)
                }
            }

            // Determine body text fallback
            let bodyContent = messageText
            if (!bodyContent) {
                if (mediaType === 'audio') bodyContent = 'Áudio'
                else if (mediaType === 'image') bodyContent = 'Imagem'
            }

            // Save message (messageId already defined above for dedup check)
            console.log('Saving message:', { contactId, messageText, isFromMe, messageId, mediaType })
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    organization_id: organizationId,
                    contact_id: contactId,
                    sender_type: isFromMe ? 'user' : 'contact',
                    body: bodyContent,
                    media_url: mediaUrl,
                    media_type: mediaType,
                    status: isFromMe ? 'sent' : 'received',
                    whatsapp_id: messageId || null
                })

            if (msgError) {
                console.error('Error saving message:', msgError)
                return NextResponse.json({ error: 'Failed to save message', details: msgError.message }, { status: 500 })
            }

            console.log(`✅ Message saved successfully from ${rawPhone}`)
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// Format phone number
function formatPhoneNumber(phone: string): string {
    const digits = phone.replace(/\D/g, '')

    if (digits.length === 13 && digits.startsWith('55')) {
        return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 9)}-${digits.slice(9)}`
    } else if (digits.length === 12 && digits.startsWith('55')) {
        return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
    }

    return `+${digits}`
}

// GET: Diagnostic endpoint
export async function GET() {
    const supabase = createAdminClient()

    if (!supabase) {
        return NextResponse.json({
            status: 'error',
            message: 'Admin client not configured',
            env: {
                hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
            }
        })
    }

    // Test DB connection
    const { data: instances, error: instanceError } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name, status')
        .limit(1)

    const { count: messageCount } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })

    const { count: contactCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })

    return NextResponse.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        database: {
            connected: !instanceError,
            instances: instances?.length || 0,
            messageCount,
            contactCount
        }
    })
}
