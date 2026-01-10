import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { listContacts } from '@/lib/uazapi'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { organization_id, page = 1, search = '' } = body

        if (!organization_id) {
            return NextResponse.json({ error: 'Organization ID is required' }, { status: 400 })
        }

        // Verify organization membership
        const { data: membership } = await supabase
            .from('organization_members')
            .select('role')
            .eq('organization_id', organization_id)
            .eq('user_id', user.id)
            .single()

        if (!membership) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Get WhatsApp instance token
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('instance_token, status')
            .eq('organization_id', organization_id)
            .single()

        if (!instance || !instance.instance_token) {
            return NextResponse.json({ error: 'WhatsApp instance not found' }, { status: 404 })
        }

        if (instance.status !== 'connected') {
            return NextResponse.json({ error: 'WhatsApp instance not connected' }, { status: 400 })
        }

        // Fetch contacts from UAZAPI
        const contacts = await listContacts(instance.instance_token, {
            page,
            pageSize: 20,
            search
        })

        return NextResponse.json(contacts)
    } catch (error) {
        console.error('Error fetching WhatsApp contacts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
