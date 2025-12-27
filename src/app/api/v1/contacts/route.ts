import { NextResponse } from 'next/server'
import { authorizeApiKey } from '@/lib/api/auth'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
    // 1. Auth
    const auth = await authorizeApiKey(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const { organizationId } = auth

    // 2. Parse Body
    const body = await request.json()
    const { name, phone, email, tags } = body

    if (!name || !phone) {
        return NextResponse.json({ error: 'Name and Phone are required' }, { status: 400 })
    }

    // 3. Insert into DB
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('contacts')
        .upsert({
            organization_id: organizationId,
            name,
            phone,
            email,
            tags: tags || [],
            status: 'open'
        }, { onConflict: 'phone' }) // Assuming phone might be unique constraint later, or just insert
        .select()
        .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ success: true, contact: data })
}

export async function GET(request: Request) {
    const auth = await authorizeApiKey(request)
    if (auth.error) return NextResponse.json({ error: auth.error }, { status: auth.status })

    const supabase = await createClient()
    const { data } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', auth.organizationId)
        .limit(100)

    return NextResponse.json({ data })
}
