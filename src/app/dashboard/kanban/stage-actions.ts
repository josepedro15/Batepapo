'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createStage(pipelineId: string, name: string, color: string, compute_value: boolean = false) {
    const supabase = await createClient()

    // Get the highest position
    const { data: stages } = await supabase
        .from('stages')
        .select('position')
        .eq('pipeline_id', pipelineId)
        .order('position', { ascending: false })
        .limit(1)

    const newPosition = stages && stages.length > 0 ? stages[0].position + 1 : 0

    const { data, error } = await supabase
        .from('stages')
        .insert({
            pipeline_id: pipelineId,
            name,
            color,
            position: newPosition,
            compute_value
        })
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create stage: ${error.message}`)
    }

    revalidatePath('/dashboard/kanban')
    return data
}

export async function updateStage(stageId: string, name?: string, color?: string, compute_value?: boolean) {
    const supabase = await createClient()

    const updates: any = {}
    if (name !== undefined) updates.name = name
    if (color !== undefined) updates.color = color
    if (compute_value !== undefined) updates.compute_value = compute_value

    const { data, error } = await supabase
        .from('stages')
        .update(updates)
        .eq('id', stageId)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update stage: ${error.message}`)
    }

    revalidatePath('/dashboard/kanban')
    return data
}

export async function reorderStages(stageIds: string[]) {
    const supabase = await createClient()

    // Update positions based on array order
    const updates = stageIds.map((id, index) => ({
        id,
        position: index
    }))

    // Execute all updates
    for (const update of updates) {
        await supabase
            .from('stages')
            .update({ position: update.position })
            .eq('id', update.id)
    }

    revalidatePath('/dashboard/kanban')
}

export async function deleteStage(stageId: string) {
    const supabase = await createClient()

    // Get the stage to know its pipeline
    const { data: stage } = await supabase
        .from('stages')
        .select('pipeline_id, position')
        .eq('id', stageId)
        .single()

    if (!stage) {
        throw new Error('Estágio não encontrado')
    }

    // Check if this is the last stage in the pipeline
    const { data: allStages, error: countError } = await supabase
        .from('stages')
        .select('id')
        .eq('pipeline_id', stage.pipeline_id)

    if (countError) {
        throw new Error(`Failed to count stages: ${countError.message}`)
    }

    if (allStages && allStages.length <= 1) {
        throw new Error('Não é possível excluir o último estágio do pipeline. É obrigatório ter ao menos um estágio.')
    }

    // Check if stage has deals
    const { data: deals, error: dealsError } = await supabase
        .from('deals')
        .select('id')
        .eq('stage_id', stageId)
        .limit(1)

    if (dealsError) {
        throw new Error(`Failed to check deals: ${dealsError.message}`)
    }

    if (deals && deals.length > 0) {
        throw new Error('Não é possível excluir um estágio que contém negócios. Mova ou exclua os negócios primeiro.')
    }

    // Delete the stage
    const { error: deleteError } = await supabase
        .from('stages')
        .delete()
        .eq('id', stageId)

    if (deleteError) {
        throw new Error(`Failed to delete stage: ${deleteError.message}`)
    }

    // Reorder remaining stages
    if (stage) {
        const { data: remainingStages } = await supabase
            .from('stages')
            .select('id')
            .eq('pipeline_id', stage.pipeline_id)
            .order('position')

        if (remainingStages) {
            await reorderStages(remainingStages.map(s => s.id))
        }
    }

    revalidatePath('/dashboard/kanban')
}
