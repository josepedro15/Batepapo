'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createContact(formData: FormData) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const name = formData.get('name') as string
    const phone = formData.get('phone') as string
    const email = formData.get('email') as string
    const tags = formData.get('tags') as string

    // Get Org
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    const orgId = member?.organization_id

    // Parse tags (comma separated)
    const tagsArray = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : []

    // Insert Contact
    const { error } = await supabase.from('contacts').insert({
        organization_id: orgId,
        name,
        phone,
        email: email || null,
        tags: tagsArray,
        status: 'open'
    })

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/contacts')
    return { success: true }
}
