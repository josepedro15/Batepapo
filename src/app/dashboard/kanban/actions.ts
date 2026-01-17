'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const DEALS_PER_PAGE = 20

// New action to fetch more deals for a specific stage
export async function getMoreDeals(stageId: string, page: number, search?: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const offset = (page - 1) * DEALS_PER_PAGE

    let query = supabase
        .from('deals')
        .select('*, contacts!inner(name, phone)')
        .eq('stage_id', stageId)
        .order('created_at', { ascending: false })
        .range(offset, offset + DEALS_PER_PAGE - 1)

    if (search) {
        // Filter by contact name or phone
        // Using !inner join above ensures we only get deals with matching contacts
        // But we need to apply the filter logic
        // Supabase syntax for OR on foreign table columns can be tricky.
        // Simplified approach: use the text search syntax or explicit OR

        // This syntax `contacts.name.ilike.%query%,contacts.phone.ilike.%query%` works if using the foreign table alias in the select
        // But with `!inner` join, we can filter using the embedded resource syntax or simplified `or`

        // Let's try the standard PostgREST syntax for filtering related resources
        query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'contacts' })
    }

    const { data: deals, error } = await query

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
export async function getKanbanData(selectedPipelineId?: string, search?: string) {
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

    // Fetch stages details (without deals)
    const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('*, deals(count)')
        .eq('pipeline_id', pipeline.id)
        .order('position')

    if (stagesError) {
        console.error('Error fetching stages:', stagesError)
    }

    // NEW: Fetch optimized stats (count, sum value, compute_value) using DB function
    // This assumes the user has run the migration script
    const { data: stageStats, error: statsError } = await supabase
        .rpc('get_kanban_stats', { pipeline_uuid: pipeline.id })

    if (statsError) {
        console.warn('Could not fetch optimized stats (rpc get_kanban_stats). User might not have run migration.', statsError)
    }

    // Map stats for easy lookup
    const statsMap = new Map()
    if (stageStats) {
        stageStats.forEach((stat: any) => {
            statsMap.set(stat.stage_id, stat)
        })
    }

    // Fetch first page of deals for EACH stage
    const processedStages = await Promise.all((stages || []).map(async (stage) => {
        // Fallback or use RPC data
        const stat = statsMap.get(stage.id)
        const totalDeals = stat ? stat.total_count : 0
        const totalValue = stat ? stat.total_value : 0

        // Note: stage object from simplified select above might not have compute_value if schema not updated yet in types, 
        // but `select('*')` gets it. The RPC also returns it.
        // Let's ensure we use the compute_value from RPC if available, or fall back to stage row (if column exists)
        const computeValue = stat ? stat.compute_value : (stage.compute_value || false)

        // Prepare base queries for deals
        let selectString = '*, contacts(name, phone)'
        if (search) {
            selectString = '*, contacts!inner(name, phone)'
        }

        let dealsQuery = supabase
            .from('deals')
            .select(selectString)
            .eq('stage_id', stage.id)
            .order('created_at', { ascending: false })
            .limit(DEALS_PER_PAGE)

        let countQuery = supabase
            .from('deals')
            .select(selectString, { count: 'exact', head: true })
            .eq('stage_id', stage.id)

        if (search) {
            dealsQuery = dealsQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'contacts' })
            countQuery = countQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'contacts' })
        }

        const { data: deals } = await dealsQuery

        // If searching, we need to get the count from the query because the RPC stats are global for the stage (unfiltered)
        let finalTotalDeals = totalDeals
        let finalTotalValue = totalValue

        if (search) {
            const { count } = await countQuery
            finalTotalDeals = count || 0
            // When searching, we don't easily get the sum of values for filtered items without another query
            // For now, let's just leave sum as is (global) or set to 0? 
            // Better to leave global sum or implement filtered sum?
            // User requested sum of stage. Usually pipeline value is global.
            // If filtering, maybe we just show the filtered deals and keep the global stage value? 
            // Or maybe Recalculate? For MVP performance, keeping global value is safer/faster.
            // But let's check current implementation: previously we calculated sum in JS.
            // If we want exact sum of filtered items we need a query `sum(value)`.
            // Let's stick to RPC global stats when NOT searching.
            // When searching, let's keep the global value in headers for now as the prompt didn't specify 'search filters value sum'
            // and the user specifically asked for "Optionally include stage in global pipeline value".
        }

        return {
            ...stage,
            compute_value: computeValue,
            deals: deals || [],
            totalDeals: finalTotalDeals,
            totalValue: finalTotalValue,
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
