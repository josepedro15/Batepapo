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

// GET: List contacts for organization with pagination and search
export async function GET(request: NextRequest) {
    try {
        const supabase = await createClient()
        const url = new URL(request.url)
        const page = parseInt(url.searchParams.get('page') || '1')
        const pageSize = parseInt(url.searchParams.get('pageSize') || '20')
        const search = url.searchParams.get('search') || ''

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

        // Build query
        let query = supabase
            .from('contacts')
            .select('id, name, phone, status, avatar_url, created_at', { count: 'exact' })
            .eq('organization_id', membership.organization_id)

        // Apply search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
        }

        // Apply pagination
        const from = (page - 1) * pageSize
        const to = from + pageSize - 1

        const { data: contacts, count, error } = await query
            .order('created_at', { ascending: false })
            .range(from, to)

        if (error) {
            console.error('Error fetching contacts:', error)
            return NextResponse.json({ error: 'Error fetching contacts' }, { status: 500 })
        }

        return NextResponse.json({
            contacts: contacts || [],
            total: count || 0,
            page,
            totalPages: count ? Math.ceil(count / pageSize) : 0
        })
    } catch (error) {
        console.error('Error in GET /api/contacts:', error)
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}
