import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// Types for UAZAPI webhook payloads
interface WebhookPayload {
    event?: string
    // Connection events
    status?: 'disconnected' | 'connecting' | 'connected'
    phone?: string
    // Message events  
    data?: {
        key?: {
            remoteJid?: string
            fromMe?: boolean
            id?: string
        }
        message?: {
            conversation?: string
            extendedTextMessage?: { text?: string }
            imageMessage?: { caption?: string; url?: string }
            audioMessage?: { url?: string }
            documentMessage?: { caption?: string; url?: string; fileName?: string }
        }
        pushName?: string
        status?: string
    }
}

// POST: Receive webhooks from UAZAPI
export async function POST(request: NextRequest) {
    try {
        const body: WebhookPayload = await request.json()
        const supabase = createAdminClient()

        if (!supabase) {
            console.error('Admin client not configured')
            return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
        }

        // Get instance token from URL path or header
        const instanceToken = request.headers.get('x-instance-token') ||
            request.nextUrl.searchParams.get('token')

        console.log('Webhook received:', { event: body.event, status: body.status })

        // Find the organization by instance token
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('id, organization_id, status')
            .eq('instance_token', instanceToken)
            .single()

        // If no instance found by token, try to match by any available instance
        let organizationId: string
        let instanceId: string

        if (instance) {
            organizationId = instance.organization_id
            instanceId = instance.id
        } else {
            // Fallback: get first instance (for development)
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

        // Handle connection events
        if (body.status || body.event === 'connection' || body.event === 'connection.update') {
            const newStatus = body.status || 'disconnected'

            await supabase
                .from('whatsapp_instances')
                .update({
                    status: newStatus,
                    phone_number: body.phone || null,
                    last_connected_at: newStatus === 'connected' ? new Date().toISOString() : null
                })
                .eq('id', instanceId)

            console.log(`Instance ${instanceId} status updated to: ${newStatus}`)
            return NextResponse.json({ success: true })
        }

        // Handle message events
        if (body.event === 'messages' || body.event === 'messages.upsert' || body.data?.key?.remoteJid) {
            const data = body.data
            if (!data?.key?.remoteJid || data.key.fromMe) {
                return NextResponse.json({ success: true })
            }

            // Extract message content
            const message = data.message
            let messageBody = ''
            let mediaUrl = ''
            let mediaType = ''

            if (message?.conversation) {
                messageBody = message.conversation
            } else if (message?.extendedTextMessage?.text) {
                messageBody = message.extendedTextMessage.text
            } else if (message?.imageMessage) {
                messageBody = message.imageMessage.caption || ''
                mediaUrl = message.imageMessage.url || ''
                mediaType = 'image'
            } else if (message?.audioMessage) {
                mediaUrl = message.audioMessage.url || ''
                mediaType = 'audio'
            } else if (message?.documentMessage) {
                messageBody = message.documentMessage.caption || message.documentMessage.fileName || ''
                mediaUrl = message.documentMessage.url || ''
                mediaType = 'document'
            }

            // Format phone number
            const phone = data.key.remoteJid.split('@')[0]
            const formattedPhone = formatPhoneNumber(phone)

            // Find or create contact
            const { data: existingContact } = await supabase
                .from('contacts')
                .select('id')
                .eq('organization_id', organizationId)
                .eq('phone', formattedPhone)
                .single()

            let contactId: string

            if (existingContact) {
                contactId = existingContact.id
            } else {
                // Create new contact
                const { data: newContact, error } = await supabase
                    .from('contacts')
                    .insert({
                        organization_id: organizationId,
                        phone: formattedPhone,
                        name: data.pushName || formattedPhone,
                        status: 'open'
                    })
                    .select('id')
                    .single()

                if (error || !newContact) {
                    console.error('Error creating contact:', error)
                    return NextResponse.json({ error: 'Failed to create contact' }, { status: 500 })
                }
                contactId = newContact.id
            }

            // Save message
            const { error: msgError } = await supabase
                .from('messages')
                .insert({
                    organization_id: organizationId,
                    contact_id: contactId,
                    sender_type: 'contact',
                    body: messageBody || null,
                    media_url: mediaUrl || null,
                    media_type: mediaType || null,
                    status: 'received'
                })

            if (msgError) {
                console.error('Error saving message:', msgError)
            } else {
                console.log(`Message saved from ${formattedPhone}`)
            }
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
