'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function createOrganization(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('orgName') as string
    const slug = name.toLowerCase().replace(/ /g, '-') + '-' + Math.floor(Math.random() * 1000)

    // 1. Get User
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // 2. Create Org
    const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({ name, slug, owner_id: user.id })
        .select()
        .single()

    if (orgError) throw new Error(orgError.message)

    // 3. Add User as Owner member
    const { error: memberError } = await supabase
        .from('organization_members')
        .insert({
            organization_id: org.id,
            user_id: user.id,
            role: 'owner'
        })

    if (memberError) throw new Error(memberError.message)

    redirect('/dashboard')
}
