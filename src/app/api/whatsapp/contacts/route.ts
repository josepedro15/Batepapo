import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import * as uazapi from '@/lib/uazapi'

// GET: Fetch WhatsApp contacts from UAZAPI
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
            .select('instance_token, status')
            .eq('organization_id', membership.organization_id)
            .single()

        if (!instance) {
            return NextResponse.json({ error: 'WhatsApp not configured' }, { status: 404 })
        }

        if (instance.status !== 'connected') {
            return NextResponse.json({ error: 'WhatsApp not connected' }, { status: 400 })
        }

        try {
            const contacts = await uazapi.getContacts(instance.instance_token)
            return NextResponse.json({ contacts })
        } catch (error) {
            console.error('UAZAPI contacts error:', error)
            return NextResponse.json({ error: 'Failed to fetch contacts' }, { status: 502 })
        }

    } catch (error) {
        console.error('Error in GET /api/whatsapp/contacts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
