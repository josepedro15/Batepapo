'use server'

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function getQuickMessages(orgId: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('quick_responses')
        .select('*')
        .eq('organization_id', orgId)
        .order('title', { ascending: true })

    if (error) {
        console.error('Error fetching quick messages:', error)
        return []
    }

    return data
}

export async function createQuickMessage(orgId: string, title: string, content: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('quick_responses')
        .insert({
            organization_id: orgId,
            title: title.toLowerCase().replace(/\s+/g, '-'), // Normalize triggers
            content
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating quick message:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/quick-messages')
    return { success: true, data }
}

export async function updateQuickMessage(id: string, title: string, content: string) {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from('quick_responses')
        .update({
            title: title.toLowerCase().replace(/\s+/g, '-'),
            content
        })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('Error updating quick message:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/quick-messages')
    return { success: true, data }
}

export async function deleteQuickMessage(id: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('quick_responses')
        .delete()
        .eq('id', id)

    if (error) {
        console.error('Error deleting quick message:', error)
        return { success: false, error: error.message }
    }

    revalidatePath('/dashboard/quick-messages')
    return { success: true }
}
