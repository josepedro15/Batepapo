import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as uazapi from '@/lib/uazapi'

interface SendMessageBody {
    contact_id: string
    message: string
    type?: 'text' | 'image' | 'audio' | 'document'
    media_url?: string
}

// POST: Send message via WhatsApp
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body: SendMessageBody = await request.json()
        const { contact_id, message, type = 'text', media_url } = body

        if (!contact_id) {
            return NextResponse.json({ error: 'contact_id is required' }, { status: 400 })
        }

        if (!message && !media_url) {
            return NextResponse.json({ error: 'message or media_url is required' }, { status: 400 })
        }

        // Get user's organization
        const { data: membership } = await supabase
            .from('organization_members')
            .select('organization_id')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        // Get WhatsApp instance
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('instance_token, status')
            .eq('organization_id', membership.organization_id)
            .single()

        if (!instance) {
            return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 404 })
        }

        if (instance.status !== 'connected') {
            return NextResponse.json({ error: 'WhatsApp is not connected' }, { status: 400 })
        }

        // Get contact phone number
        const { data: contact } = await supabase
            .from('contacts')
            .select('phone')
            .eq('id', contact_id)
            .eq('organization_id', membership.organization_id)
            .single()

        if (!contact) {
            return NextResponse.json({ error: 'Contact not found' }, { status: 404 })
        }

        // Save message to database with 'sending' status
        const { data: savedMessage, error: saveError } = await supabase
            .from('messages')
            .insert({
                organization_id: membership.organization_id,
                contact_id,
                sender_type: 'user',
                sender_id: user.id,
                body: message || null,
                media_url: media_url || null,
                media_type: type !== 'text' ? type : null,
                status: 'sending'
            })
            .select('id')
            .single()

        if (saveError) {
            console.error('Error saving message:', saveError)
            return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
        }

        try {
            // Send via UAZAPI
            let result: { messageId: string }

            if (type === 'text') {
                result = await uazapi.sendTextMessage(
                    instance.instance_token,
                    contact.phone,
                    message
                )
            } else if (type === 'image' && media_url) {
                result = await uazapi.sendImageMessage(
                    instance.instance_token,
                    contact.phone,
                    media_url,
                    message
                )
            } else {
                throw new Error('Unsupported message type')
            }

            // Update message status to sent
            await supabase
                .from('messages')
                .update({ status: 'sent' })
                .eq('id', savedMessage.id)

            return NextResponse.json({
                success: true,
                message_id: savedMessage.id,
                whatsapp_id: result.messageId
            })

        } catch (error) {
            console.error('UAZAPI send error:', error)

            // Update message status to failed
            await supabase
                .from('messages')
                .update({ status: 'failed' })
                .eq('id', savedMessage.id)

            return NextResponse.json({
                error: `Failed to send: ${error instanceof Error ? error.message : 'Unknown error'}`
            }, { status: 502 })
        }

    } catch (error) {
        console.error('Error in POST /api/whatsapp/send:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
