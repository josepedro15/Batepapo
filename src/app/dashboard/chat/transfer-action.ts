'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function transferChat(contactId: string, targetUserId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await supabase
        .from('contacts')
        .update({ owner_id: targetUserId })
        .eq('id', contactId)

    revalidatePath('/dashboard/chat')
    return { success: true }
}
