'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import crypto from 'crypto'

export async function generateApiKey(formData: FormData) {
    const supabase = await createClient()
    const label = formData.get('label') as string

    // 1. Get current user's org
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    if (!membership) return { error: 'No organization found' }

    // 2. Generate Key
    // Format: sk_live_UUID
    const rawKey = `sk_live_${crypto.randomUUID().replace(/-/g, '')}`

    // 3. Hash Key for storage
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex')

    // 4. Save to DB
    const { error } = await supabase.from('api_keys').insert({
        organization_id: membership.organization_id,
        label,
        key_hash: keyHash
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true, key: rawKey } // Return raw key ONLY ONCE
}

export async function revokeApiKey(keyId: string) {
    const supabase = await createClient()
    await supabase.from('api_keys').delete().eq('id', keyId)
    revalidatePath('/dashboard/settings')
}

export async function addTeamMember(formData: FormData) {
    const supabase = await createClient()
    const email = formData.get('email') as string

    if (!email) return { error: 'Email is required' }

    const { data, error } = await supabase.rpc('add_team_member', {
        email_input: email
    })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

import { createAdminClient } from '@/lib/supabase/admin'

export async function createUserAccount(formData: FormData) {
    const supabase = await createClient()

    const name = formData.get('name') as string
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const role = formData.get('role') as string

    if (!email || !password || !name) return { error: 'Preencha todos os campos obrigatórios.' }

    // 1. Verify permissions (Owner/Manager only)
    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) return { error: 'Unauthorized' }

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', requester.id)
        .single()

    if (!membership || !['owner', 'manager'].includes(membership.role)) {
        return { error: 'Apenas gestores podem criar usuários.' }
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return { error: 'Configuração do servidor incompleta. Contate o administrador.' }
    }

    // 2. Create User via Admin API
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
            full_name: name
        }
    })

    if (createError) {
        // Fallback: If user already exists, try to add them to the team using valid existing email
        if (createError.message?.includes('already been registered') || createError.message?.includes('already registered')) {
            console.log('User already exists, fetching ID to link to team...')

            // RPC failed because it relies on public.profiles. We will use admin API to find the user in auth.users directly.
            const { data: userList, error: listError } = await adminClient.auth.admin.listUsers({
                page: 1,
                perPage: 1000
            })

            if (listError || !userList?.users) {
                console.error('List Users Error:', listError)
                return { error: 'Usuário já existe, mas erro ao buscar detalhes da conta.' }
            }

            const existingUser = userList.users.find(u => u.email?.toLowerCase() === email.toLowerCase())

            if (!existingUser) {
                return { error: 'Email consta como registrado, mas usuário não foi encontrado na lista.' }
            }

            console.log('Found existing user:', existingUser.id)

            // Check if user is already in this org
            const { data: existingMember } = await adminClient
                .from('organization_members')
                .select('id')
                .eq('organization_id', membership.organization_id)
                .eq('user_id', existingUser.id)
                .single()

            if (existingMember) {
                return { error: 'Este usuário já faz parte da equipe.' }
            }

            // Check if profile exists (to avoid FK violation)
            const { data: profile } = await adminClient
                .from('profiles')
                .select('id')
                .eq('id', existingUser.id)
                .single()

            if (!profile) {
                console.log('Profile missing for existing user, creating now...')
                const { error: profileError } = await adminClient
                    .from('profiles')
                    .insert({
                        id: existingUser.id,
                        email: existingUser.email,
                        name: existingUser.user_metadata?.full_name || name || 'Usuário sem nome'
                    })

                if (profileError) {
                    console.error('Failed to create missing profile:', profileError)
                    return { error: 'Erro ao restaurar perfil do usuário.' }
                }
            }

            // Proceed to insert member
            const { error: linkError } = await adminClient
                .from('organization_members')
                .insert({
                    organization_id: membership.organization_id,
                    user_id: existingUser.id,
                    role: role || 'attendant',
                    joined_at: new Date().toISOString()
                })

            if (linkError) {
                return { error: `Usuário encontrado, mas erro ao vincular: ${linkError.message}` }
            }

            revalidatePath('/dashboard/settings')
            return { success: true }
        }

        console.error('Create User Error:', createError)
        return { error: `Erro ao criar usuário: ${createError.message}` }
    }

    if (!newUser.user) return { error: 'Erro desconhecido ao criar usuário.' }

    // 3. Add to Organization (using the Service Role client to bypass RLS if needed, or the standard one if policy allows)
    // Since we are adding TO the organization we are part of, and we are managers, we "should" have permission 
    // BUT the standard 'insert' policy might only allow inserting "raw" rows if we are owners/managers.
    // Let's use the Admin Client for the insert to be 100% sure we can add the member row.

    // We need to insert into public.organization_members
    // The adminClient by default points to 'auth' schema for auth methods, 
    // but the `from` method works on public schema with service role.

    const { error: memberError } = await adminClient
        .from('organization_members')
        .insert({
            organization_id: membership.organization_id,
            user_id: newUser.user.id,
            role: role || 'attendant',
            joined_at: new Date().toISOString() // NOW()
        })

    if (memberError) {
        console.error('Add Member Error:', memberError)
        // Cleanup: verify if we should delete the user if org add fails? 
        // For now, let's just return error. The user exists but has no org.
        return { error: `Usuário criado, mas falha ao vincular à equipe: ${memberError.message}` }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function updateUserAccount(formData: FormData) {
    const supabase = await createClient()

    const userId = formData.get('userId') as string
    const name = formData.get('name') as string
    const role = formData.get('role') as string
    const password = formData.get('password') as string

    if (!userId || !name || !role) return { error: 'Dados incompletos.' }

    // 1. Verify permissions (Owner/Manager only)
    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) return { error: 'Unauthorized' }

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', requester.id)
        .single()

    if (!membership || !['owner', 'manager'].includes(membership.role)) {
        return { error: 'Apenas gestores podem editar usuários.' }
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return { error: 'Configuração do servidor incompleta. Contate o administrador.' }
    }

    // 2. Update Auth Metadata (Name & Password) via Admin API
    const updateData: { user_metadata: { full_name: string }; password?: string } = {
        user_metadata: { full_name: name }
    }
    if (password && password.trim().length >= 6) {
        updateData.password = password
    }

    const { error: updateAuthError } = await adminClient.auth.admin.updateUserById(
        userId,
        updateData
    )

    if (updateAuthError) {
        console.error('Update User Auth Error:', updateAuthError)
        return { error: `Erro ao atualizar dados de login: ${updateAuthError.message}` }
    }

    // 3. Update Profile (Name) in public table
    const { error: updateProfileError } = await adminClient
        .from('profiles')
        .update({ name: name })
        .eq('id', userId)

    if (updateProfileError) {
        console.error('Update Profile Error:', updateProfileError)
        // Non-critical
    }

    // 4. Update Organization Role
    // Check if target user is in the org
    const { data: targetMember } = await adminClient
        .from('organization_members')
        .select('id, role')
        .eq('organization_id', membership.organization_id)
        .eq('user_id', userId)
        .single()

    if (!targetMember) {
        return { error: 'Usuário não encontrado nesta equipe.' }
    }

    // If role changed
    if (targetMember.role !== role) {
        const { error: roleError } = await adminClient
            .from('organization_members')
            .update({ role: role })
            .eq('id', targetMember.id)

        if (roleError) {
            return { error: `Erro ao atualizar permissões: ${roleError.message}` }
        }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function removeTeamMember(userId: string) {
    const supabase = await createClient()

    // 1. Verify permissions (Owner/Manager only)
    const { data: { user: requester } } = await supabase.auth.getUser()
    if (!requester) return { error: 'Unauthorized' }

    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', requester.id)
        .single()

    if (!membership || !['owner', 'manager'].includes(membership.role)) {
        return { error: 'Apenas gestores podem remover usuários.' }
    }

    // 2. Prevent self-removal
    if (userId === requester.id) {
        return { error: 'Você não pode remover a si mesmo.' }
    }

    const adminClient = createAdminClient()
    if (!adminClient) {
        return { error: 'Configuração do servidor incompleta. Contate o administrador.' }
    }

    // 3. Verify target user is in the same org
    const { data: targetMember } = await adminClient
        .from('organization_members')
        .select('id, role')
        .eq('organization_id', membership.organization_id)
        .eq('user_id', userId)
        .single()

    if (!targetMember) {
        return { error: 'Usuário não encontrado nesta equipe.' }
    }

    // 4. Prevent removing owners (only another owner can demote first)
    if (targetMember.role === 'owner') {
        return { error: 'Não é possível remover um gestor. Altere a função primeiro.' }
    }

    // 5. Remove from organization
    const { error: removeError } = await adminClient
        .from('organization_members')
        .delete()
        .eq('id', targetMember.id)

    if (removeError) {
        console.error('Remove Member Error:', removeError)
        return { error: `Erro ao remover membro: ${removeError.message}` }
    }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

// --- Tag Management Actions ---

export async function getTags() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!membership) return []

    const { data: tags } = await supabase
        .from('tags')
        .select('*')
        .eq('organization_id', membership.organization_id)
        .order('name', { ascending: true })

    return tags || []
}

export async function createTag(name: string, color: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!membership) return { error: 'No org' }

    const { error } = await supabase.from('tags').insert({
        organization_id: membership.organization_id,
        name: name.trim(),
        color
    })

    if (error) {
        if (error.code === '23505') return { error: 'Etiqueta já existe.' }
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/chat') // Update chat suggestions too
    return { success: true }
}

export async function deleteTag(tagId: string) {
    const supabase = await createClient()
    const { error } = await supabase.from('tags').delete().eq('id', tagId)
    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/chat')
    return { success: true }
}

export async function updateTag(tagId: string, name: string, color: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check ownership/membership (optional strict check, but RLS might handle it if set correctly, 
    // but for safety we check org match)
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!membership) return { error: 'No org' }

    const { error } = await supabase
        .from('tags')
        .update({ name: name.trim(), color })
        .eq('id', tagId)
        .eq('organization_id', membership.organization_id) // Safety check

    if (error) {
        if (error.code === '23505') return { error: 'Etiqueta já existe.' }
        return { error: error.message }
    }

    revalidatePath('/dashboard/settings')
    revalidatePath('/dashboard/chat')
    return { success: true }
}

// --- AI Settings Actions ---

export async function updateAISettings(data: { prompt: string; model: string; temperature: number }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!membership) return { error: 'No org' }

    // Upsert settings
    const { error } = await supabase.from('ai_settings').upsert({
        organization_id: membership.organization_id,
        system_prompt: data.prompt,
        model: data.model,
        temperature: data.temperature,
        updated_at: new Date().toISOString()
    })

    if (error) return { error: error.message }

    revalidatePath('/dashboard/settings')
    return { success: true }
}

export async function getAISettings() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!membership) return null

    const { data } = await supabase.from('ai_settings').select('*').eq('organization_id', membership.organization_id).single()
    return data
}
