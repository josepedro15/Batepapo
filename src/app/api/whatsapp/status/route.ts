import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as uazapi from '@/lib/uazapi'

// GET: Get current status (with QR code if connecting)
export async function GET() {
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
            .select('id, instance_name, instance_token, status, phone_number')
            .eq('organization_id', membership.organization_id)
            .single()

        if (!instance) {
            return NextResponse.json({
                configured: false,
                status: 'not_configured'
            })
        }

        try {
            // Get real-time status from UAZAPI
            const uazapiStatus = await uazapi.getStatus(instance.instance_token)

            // Update local status if changed
            if (uazapiStatus.status !== instance.status ||
                (uazapiStatus.phone && uazapiStatus.phone !== instance.phone_number)) {
                await supabase
                    .from('whatsapp_instances')
                    .update({
                        status: uazapiStatus.status,
                        phone_number: uazapiStatus.phone || null,
                        last_connected_at: uazapiStatus.status === 'connected' ? new Date().toISOString() : null
                    })
                    .eq('id', instance.id)
            }

            return NextResponse.json({
                configured: true,
                status: uazapiStatus.status,
                phone_number: uazapiStatus.phone,
                qrcode: uazapiStatus.qrcode,
                pairingCode: uazapiStatus.pairingCode,
                instance_name: instance.instance_name
            })

        } catch (error) {
            console.error('UAZAPI status error:', error)
            // Return cached status if UAZAPI fails
            return NextResponse.json({
                configured: true,
                status: instance.status,
                phone_number: instance.phone_number,
                instance_name: instance.instance_name,
                error: 'Could not reach UAZAPI server'
            })
        }

    } catch (error) {
        console.error('Error in GET /api/whatsapp/status:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
