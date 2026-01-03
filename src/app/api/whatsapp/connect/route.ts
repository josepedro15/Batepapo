import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as uazapi from '@/lib/uazapi'

// POST: Reconnect existing instance (generate new QR code)
export async function POST() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
            .select('id, instance_token, status')
            .eq('organization_id', membership.organization_id)
            .single()

        if (!instance) {
            return NextResponse.json({
                error: 'No instance configured. Create one first.'
            }, { status: 404 })
        }

        // If already connected, just return success
        if (instance.status === 'connected') {
            return NextResponse.json({
                status: 'connected',
                message: 'Already connected'
            })
        }

        try {
            // Start connection (generate QR)
            const connectResult = await uazapi.connect(instance.instance_token)

            // Update status
            await supabase
                .from('whatsapp_instances')
                .update({ status: 'connecting' })
                .eq('id', instance.id)

            return NextResponse.json({
                status: 'connecting',
                qrcode: connectResult.qrcode,
                pairingCode: connectResult.pairingCode
            })

        } catch (error) {
            console.error('UAZAPI connect error:', error)
            return NextResponse.json({
                error: 'Failed to generate QR code'
            }, { status: 502 })
        }

    } catch (error) {
        console.error('Error in POST /api/whatsapp/connect:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
