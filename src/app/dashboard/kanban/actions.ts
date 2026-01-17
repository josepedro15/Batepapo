'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const DEALS_PER_PAGE = 20

// New action to fetch more deals for a specific stage
export async function getMoreDeals(stageId: string, page: number) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const offset = (page - 1) * DEALS_PER_PAGE

    const { data: deals, error } = await supabase
        .from('deals')
        .select('*, contacts(name, phone)')
        .eq('stage_id', stageId)
        .order('created_at', { ascending: false })
        .range(offset, offset + DEALS_PER_PAGE - 1)

    if (error) {
        console.error('Error fetching more deals:', error)
        return { deals: [], hasMore: false }
    }

    return {
        deals: deals || [],
        hasMore: (deals?.length || 0) === DEALS_PER_PAGE
    }
}

// Initial Kanban load - fetches stages and first page of deals for each stage
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
    }

    // Fetch stages (without deals)
    const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .eq('pipeline_id', pipeline.id)
        .order('position')

    if (stagesError) {
        console.error('Error fetching stages:', stagesError)
    }

    // Fetch first page of deals for EACH stage and total counts
    const processedStages = await Promise.all((stages || []).map(async (stage) => {
        // Fetch first page of deals
        const { data: deals } = await supabase
            .from('deals')
            .select('*, contacts(name, phone)')
            .eq('stage_id', stage.id)
            .order('created_at', { ascending: false })
            .limit(DEALS_PER_PAGE)

        // Get total count (for the header badge)
        const { count } = await supabase
            .from('deals')
            .select('*', { count: 'exact', head: true })
            .eq('stage_id', stage.id)

        return {
            ...stage,
            deals: deals || [],
            totalDeals: count || 0,
            hasMore: (deals?.length || 0) === DEALS_PER_PAGE
        }
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
