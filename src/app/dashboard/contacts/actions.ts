'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ImportResult = {
    success: boolean
    count?: number
    errors?: string[]
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
            avatar_url: null,
            unread_count: 0
        })
    }

    if (validContacts.length === 0) {
        return { success: false, errors: ['Nenhum contato válido encontrado para importação', ...errors] }
    }

    try {
        // Upsert based on phone number and organization_id to avoid duplicates
        // Note: This requires a unique constraint on (organization_id, phone) in the database
        // for 'upsert' to work seamlessly as intended (updating existing).
        // If not present, we rely on the implementation. 
        // Assuming typical setup, we'll try to insert. If conflict, we update valid fields.

        const { error } = await supabase
            .from('contacts')
            .upsert(validContacts, {
                onConflict: 'organization_id,phone',
                ignoreDuplicates: false
            })

        if (error) {
            console.error('Database error during import:', error)
            return { success: false, errors: ['Erro ao salvar no banco de dados', error.message, ...errors] }
        }

        revalidatePath('/dashboard/contacts')
        return { success: true, count: validContacts.length, errors: errors.length > 0 ? errors : undefined }

    } catch (err) {
        console.error('Unexpected error:', err)
        return { success: false, errors: ['Erro inesperado no servidor', ...errors] }
    }
}
