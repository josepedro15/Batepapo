'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function getAutomaticMessageRules(organizationId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('automatic_message_rules')
        .select('*')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })

    if (error) throw error
    return data
}

export async function createAutomaticMessageRule(data: {
    organization_id: string
    name: string
    message: string
    start_time: string
    end_time: string
    is_active: boolean
}) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .insert(data)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}

export async function updateAutomaticMessageRule(id: string, data: {
    name?: string
    message?: string
    start_time?: string
    end_time?: string
    is_active?: boolean
}) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .update(data)
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}

export async function deleteAutomaticMessageRule(id: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .delete()
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}

export async function toggleAutomaticMessageRule(id: string, is_active: boolean) {
    const supabase = createClient()
    const { error } = await supabase
        .from('automatic_message_rules')
        .update({ is_active })
        .eq('id', id)

    if (error) throw error
    revalidatePath('/dashboard/automatic-messages')
}
