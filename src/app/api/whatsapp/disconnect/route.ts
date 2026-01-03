import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as uazapi from '@/lib/uazapi'

// POST: Disconnect WhatsApp instance
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
            .select('organization_id, role')
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'No organization found' }, { status: 404 })
        }

        if (!['owner', 'manager'].includes(membership.role)) {
            return NextResponse.json({ error: 'Only owners/managers can manage WhatsApp' }, { status: 403 })
        }

        // Get WhatsApp instance
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('id, instance_token')
            .eq('organization_id', membership.organization_id)
            .single()

        if (!instance) {
            return NextResponse.json({ error: 'No instance found' }, { status: 404 })
        }

        try {
            // Disconnect from UAZAPI
            await uazapi.disconnect(instance.instance_token)
        } catch (error) {
            console.warn('UAZAPI disconnect error:', error)
        }

        // Update status in database
        await supabase
            .from('whatsapp_instances')
            .update({ status: 'disconnected', phone_number: null })
            .eq('id', instance.id)

        return NextResponse.json({
            success: true,
            message: 'WhatsApp disconnected'
        })

    } catch (error) {
        console.error('Error in POST /api/whatsapp/disconnect:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
