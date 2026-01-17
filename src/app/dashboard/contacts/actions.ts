'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ImportResult = {
    success: boolean
    count?: number
    errors?: string[]
}

export type ContactsResult = {
    contacts: any[]
    totalCount: number
    activeCount: number
    page: number
    pageSize: number
    totalPages: number
}

export async function getContactsPaginated(
    page: number = 1,
    pageSize: number = 50,
    search?: string
): Promise<ContactsResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { contacts: [], totalCount: 0, activeCount: 0, page: 1, pageSize, totalPages: 0 }
    }

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) {
        return { contacts: [], totalCount: 0, activeCount: 0, page: 1, pageSize, totalPages: 0 }
    }

    // Get connected WhatsApp instance
    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('phone_number')
        .eq('organization_id', member.organization_id)
        .eq('status', 'connected')
        .single()

    const connectedPhone = instance?.phone_number || null

    // If no WhatsApp connected, return empty
    if (!connectedPhone) {
        return { contacts: [], totalCount: 0, activeCount: 0, page, pageSize, totalPages: 0 }
    }

    const offset = (page - 1) * pageSize

    // Build query for contacts - filter by connected_phone
    let query = supabase
        .from('contacts')
        .select('*', { count: 'exact' })
        .eq('organization_id', member.organization_id)
        .eq('connected_phone', connectedPhone)

    // Add search filter if provided
    if (search && search.trim()) {
        const searchTerm = `%${search.trim()}%`
        query = query.or(`name.ilike.${searchTerm},phone.ilike.${searchTerm},email.ilike.${searchTerm}`)
    }

    // Get paginated results
    const { data: contacts, count, error } = await query
        .order('created_at', { ascending: false })
        .range(offset, offset + pageSize - 1)

    if (error) {
        console.error('Error fetching contacts:', error)
        return { contacts: [], totalCount: 0, activeCount: 0, page, pageSize, totalPages: 0 }
    }

    // Get active count - also filter by connected_phone
    const { count: activeCount } = await supabase
        .from('contacts')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', member.organization_id)
        .eq('connected_phone', connectedPhone)
        .eq('status', 'open')

    const totalCount = count || 0
    const totalPages = Math.ceil(totalCount / pageSize)

    return {
        contacts: contacts || [],
        totalCount,
        activeCount: activeCount || 0,
        page,
        pageSize,
        totalPages
    }
}

export async function importContacts(contacts: { name: string; phone: string; tags?: string[] }[]): Promise<ImportResult> {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return { success: false, errors: ['Usuário não autenticado'] }
    }

    // Get organization
    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!member) {
        return { success: false, errors: ['Organização não encontrada'] }
    }

    const errors: string[] = []
    const validContacts: any[] = []

    for (const contact of contacts) {
        // Basic validation
        if (!contact.name || !contact.phone) {
            errors.push(`Contato inválido (sem nome ou telefone): ${JSON.stringify(contact)}`)
            continue
        }

        // Clean phone number (remove non-digits)
        const cleanPhone = contact.phone.replace(/\D/g, '')

        if (cleanPhone.length < 10) {
            errors.push(`Telefone inválido para ${contact.name}: ${contact.phone}`)
            continue
        }

        validContacts.push({
            organization_id: member.organization_id,
            name: contact.name,
            phone: cleanPhone,
            tags: contact.tags || [],
            status: 'open',
            // Default values
            email: null,
            avatar_url: null
        })
    }

    if (validContacts.length === 0) {
        return { success: false, errors: ['Nenhum contato válido encontrado para importação', ...errors] }
    }

    try {
        // Insert in batches of 500 to avoid timeout
        const batchSize = 500
        let insertedCount = 0

        for (let i = 0; i < validContacts.length; i += batchSize) {
            const batch = validContacts.slice(i, i + batchSize)

            const { error } = await supabase
                .from('contacts')
                .upsert(batch, {
                    onConflict: 'organization_id,phone',
                    ignoreDuplicates: false
                })

            if (error) {
                console.error('Database error during import batch:', error)
                errors.push(`Erro no lote ${Math.floor(i / batchSize) + 1}: ${error.message}`)
            } else {
                insertedCount += batch.length
            }
        }

        revalidatePath('/dashboard/contacts')
        return {
            success: insertedCount > 0,
            count: insertedCount,
            errors: errors.length > 0 ? errors : undefined
        }

    } catch (err) {
        console.error('Unexpected error:', err)
        return { success: false, errors: ['Erro inesperado no servidor', ...errors] }
    }
}

