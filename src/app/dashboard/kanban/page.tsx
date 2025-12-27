import { getKanbanData } from './actions'
import { KanbanBoard } from '@/components/kanban/board'
import { CreateDealDialog } from '@/components/dialogs/create-deal-dialog'
import { ManageStagesDialog } from '@/components/dialogs/manage-stages-dialog'
import { PipelineSelector } from '@/components/kanban/pipeline-selector'
import { createClient } from '@/lib/supabase/server'
import { LayoutDashboard, DollarSign, TrendingUp } from 'lucide-react'

export default async function KanbanPage({ searchParams }: { searchParams: Promise<{ pipelineId?: string }> }) {
    const resolvedSearchParams = await searchParams
    const { stages, pipeline, pipelines } = await getKanbanData(resolvedSearchParams.pipelineId)

    // Fetch contacts for the dialog
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user!.id).single()
    const { data: contacts } = await supabase.from('contacts').select('id, name, phone').eq('organization_id', member?.organization_id)

    // Calculate stats
    const totalDeals = stages?.reduce((acc, s) => acc + (s.deals?.length || 0), 0) || 0
    const totalValue = stages?.reduce((acc, s) =>
        acc + (s.deals?.reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0), 0) || 0

    return (
        <div className="flex flex-col h-full space-y-4">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div className="flex-1">
                    <div className="flex items-center gap-3">
                        <h1 className="text-display text-foreground">Funil de Vendas</h1>
                        <PipelineSelector pipelines={pipelines || []} currentPipelineId={pipeline?.id} />
                    </div>
                    <p className="text-muted-foreground mt-1">Gerencie leads e negociações visualmente.</p>
                </div>

                {/* Quick Stats */}
                <div className="flex items-center gap-3">
                    <div className="glass px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                            <LayoutDashboard className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">{totalDeals}</p>
                            <p className="text-xs text-muted-foreground">Negócios</p>
                        </div>
                    </div>
                    <div className="glass px-4 py-2 rounded-xl flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-success/10 flex items-center justify-center">
                            <DollarSign className="h-4 w-4 text-success" />
                        </div>
                        <div>
                            <p className="text-lg font-bold text-foreground">
                                R$ {totalValue.toLocaleString('pt-BR')}
                            </p>
                            <p className="text-xs text-muted-foreground">Pipeline</p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    <ManageStagesDialog initialStages={stages || []} pipelineId={pipeline?.id || ''} />
                    <CreateDealDialog stages={stages || []} contacts={contacts || []} />
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden -mx-8 px-8">
                <KanbanBoard initialStages={stages || []} />
            </div>
        </div>
    )
}
