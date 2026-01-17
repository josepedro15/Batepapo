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

    // Get connected WhatsApp instance
    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('phone_number')
        .eq('organization_id', orgId)
        .eq('status', 'connected')
        .single()

    const connectedPhone = instance?.phone_number || null

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

    // Fetch first page of deals for EACH stage
    const processedStages = await Promise.all((stages || []).map(async (stage) => {
        // We won't use RPC stats anymore since they don't filter by connected_phone
        const computeValue = stage.compute_value || false

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
            .select('value', { count: 'exact' })
            .eq('stage_id', stage.id)

        // Filter by connected phone if available
        if (connectedPhone) {
            dealsQuery = dealsQuery.eq('connected_phone', connectedPhone)
            countQuery = countQuery.eq('connected_phone', connectedPhone)
        } else {
            // No connected phone means no deals to show
            dealsQuery = dealsQuery.eq('connected_phone', '__NO_CONNECTED_PHONE__')
            countQuery = countQuery.eq('connected_phone', '__NO_CONNECTED_PHONE__')
        }

        if (search) {
            dealsQuery = dealsQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'contacts' })
            countQuery = countQuery.or(`name.ilike.%${search}%,phone.ilike.%${search}%`, { foreignTable: 'contacts' })
        }

        const [{ data: deals }, { count, data: allDeals }] = await Promise.all([
            dealsQuery,
            countQuery
        ])

        // Calculate total value from the filtered deals
        const totalValue = (allDeals || []).reduce((sum: number, d: any) => sum + (parseFloat(d.value) || 0), 0)

        return {
            ...stage,
            compute_value: computeValue,
            deals: deals || [],
            totalDeals: count || 0,
            totalValue,
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
