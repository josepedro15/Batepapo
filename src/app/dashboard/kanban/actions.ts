'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// Modified getKanbanData to accept optional pipelineId
export async function getKanbanData(selectedPipelineId?: string) {
    const supabase = await createClient()

    // 1. Get Org using the user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized - Please log in')

    // 1. Get Org using the user
    const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .maybeSingle()

    if (memberError || !member || !member.organization_id) {
        throw new Error(`Você não está vinculado a uma organização. Vá para /onboarding. Error: ${memberError?.message || 'member is null'}`)
    }

    const orgId = member.organization_id

    // 2. Fetch Pipelines
    const { data: pipelines } = await supabase.from('pipelines').select('id, name').eq('organization_id', orgId)

    // Determine which pipeline to use
    let pipeline = null
    if (selectedPipelineId) {
        pipeline = pipelines?.find(p => p.id === selectedPipelineId) || null
    }

    // If no selected pipeline or not found, use the first one
    if (!pipeline) {
        pipeline = pipelines && pipelines.length > 0 ? pipelines[0] : null
    }

    // Create default pipeline if none exists
    if (!pipeline) {
        const { data: newPipeline, error } = await supabase.from('pipelines').insert({ organization_id: orgId, name: 'Vendas Padrão' }).select().single()

        if (error || !newPipeline) {
            console.error('Pipeline creation failed:', error)
            throw new Error(`Failed to create pipeline: ${error?.message || 'Unknown error'}`)
        }
        pipeline = newPipeline
        // Optimistically add to pipelines list if it was empty
    }

    // Fetch stages for the selected pipeline
    const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('*, deals(*, contacts(name, phone))')
        .eq('pipeline_id', pipeline.id)
        .order('position')

    // Sort deals within stages (optional, but good)
    const processedStages = stages?.map(stage => ({
        ...stage,
        deals: stage.deals?.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) // Newest first
    }))

    return { stages: processedStages, pipeline, pipelines }
}

export async function moveDeal(dealId: string, newStageId: string) {
    const supabase = await createClient()

    await supabase
        .from('deals')
        .update({ stage_id: newStageId })
        .eq('id', dealId)

    revalidatePath('/dashboard/kanban')
}

export async function updateDeal(dealId: string, data: { title: string, value: number, status: string }) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // Check membership (optional but good practice)
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!membership) return { error: 'No org' }

    const { error } = await supabase
        .from('deals')
        .update({
            title: data.title,
            value: data.value,
            status: data.status,
            updated_at: new Date().toISOString()
        })
        .eq('id', dealId)
        .eq('organization_id', membership.organization_id) // Safety check

    if (error) return { error: error.message }

    revalidatePath('/dashboard/kanban')
    return { success: true }
}

export async function deleteDeal(dealId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    if (!membership) return { error: 'No org' }

    const { error } = await supabase
        .from('deals')
        .delete()
        .eq('id', dealId)
        .eq('organization_id', membership.organization_id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard/kanban')
    return { success: true }
}
