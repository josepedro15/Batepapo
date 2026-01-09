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

    // 4. Create Default Pipeline
    const { data: pipeline, error: pipelineError } = await supabase
        .from('pipelines')
        .insert({
            organization_id: org.id,
            name: 'Vendas Padrão'
        })
        .select()
        .single()

    if (pipelineError) throw new Error(pipelineError.message)

    // 5. Create Default Stages
    const defaultStages = [
        { pipeline_id: pipeline.id, name: 'Lead', color: 'bg-blue-500', position: 0 },
        { pipeline_id: pipeline.id, name: 'Contato', color: 'bg-yellow-500', position: 1 },
        { pipeline_id: pipeline.id, name: 'Qualificação', color: 'bg-purple-500', position: 2 },
        { pipeline_id: pipeline.id, name: 'Proposta', color: 'bg-green-500', position: 3 },
        { pipeline_id: pipeline.id, name: 'Fechado', color: 'bg-emerald-500', position: 4 },
    ]

    const { error: stagesError } = await supabase
        .from('stages')
        .insert(defaultStages)

    if (stagesError) throw new Error(stagesError.message)

    redirect('/onboarding/plan')
}
