import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// POST: Create a new contact
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { name, phone, organization_id } = body

        if (!name || !phone) {
            return NextResponse.json({ error: 'Nome e telefone são obrigatórios' }, { status: 400 })
        }

        // Check if contact already exists
        const { data: existing } = await supabase
            .from('contacts')
            .select('id')
            .eq('organization_id', organization_id)
            .eq('phone', phone)
            .single()

        if (existing) {
            return NextResponse.json({
                id: existing.id,
                message: 'Contato já existe'
            })
        }

        // Create new contact
        const { data: contact, error } = await supabase
            .from('contacts')
            .insert({
                organization_id,
                name,
                phone,
                owner_id: user.id,
                status: 'open'
            })
            .select('id')
            .single()

        if (error) {
            console.error('Error creating contact:', error)
            return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 })
        }

        return NextResponse.json({ id: contact.id })
    } catch (error) {
        console.error('Error in POST /api/contacts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}

// GET: List contacts for organization
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

        // Get contacts
        const { data: contacts } = await supabase
            .from('contacts')
            .select('id, name, phone, status, created_at')
            .eq('organization_id', membership.organization_id)
            .order('created_at', { ascending: false })

        return NextResponse.json({ contacts: contacts || [] })
    } catch (error) {
        console.error('Error in GET /api/contacts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
