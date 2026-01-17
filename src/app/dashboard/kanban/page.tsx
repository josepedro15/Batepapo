import { getKanbanData } from './actions'
import { KanbanBoard } from '@/components/kanban/board'
import { CreateDealDialog } from '@/components/dialogs/create-deal-dialog'
import { ManageStagesDialog } from '@/components/dialogs/manage-stages-dialog'
import { PipelineSelector } from '@/components/kanban/pipeline-selector'
import { createClient } from '@/lib/supabase/server'
import { KanbanSearch } from '@/components/kanban/kanban-search'
import { LayoutDashboard, DollarSign, Kanban } from 'lucide-react'

export default async function KanbanPage({ searchParams }: { searchParams: Promise<{ pipelineId?: string, search?: string }> }) {
    const resolvedSearchParams = await searchParams
    const search = resolvedSearchParams?.search || undefined
    const { stages, pipeline, pipelines } = await getKanbanData(resolvedSearchParams.pipelineId, search)

    // Fetch contacts for the dialog
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user!.id).single()
    const { data: contacts } = await supabase.from('contacts').select('id, name, phone').eq('organization_id', member?.organization_id)

    // Calculate stats
    const totalDeals = stages?.reduce((acc, s) => acc + (s.totalDeals || 0), 0) || 0
    // Note: Total value is still an approximation based on loaded deals, or we could fetch a sum aggregation if critical.
    // For now, let's keep it as sum of LOADED deals to avoid another query, or accept acceptable inaccuracy for perf.
    // Ideally we should return totalValue from the backend too. Let's do that in a follow up if needed.
    const totalValue = stages?.reduce((acc, s) =>
        acc + (s.deals?.reduce((sum: number, d: any) => sum + (d.value || 0), 0) || 0), 0) || 0

    return (
        <div className="flex flex-col h-full space-y-6">
            {/* Header com gradiente decorativo */}
            <div className="relative overflow-hidden rounded-2xl glass-heavy p-6">
                <div className="relative flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Kanban className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-display text-foreground">Funil de Vendas</h1>
                                <PipelineSelector pipelines={pipelines || []} currentPipelineId={pipeline?.id} />
                            </div>
                            <p className="text-muted-foreground mt-1">Gerencie leads e negociações visualmente.</p>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <KanbanSearch />
                        {/* Quick Stats */}
                        <div className="flex items-center gap-3">
                            <div className="glass px-4 py-3 rounded-xl flex items-center gap-3 hover:border-primary/20 transition-all duration-200">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                    <LayoutDashboard className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">{totalDeals}</p>
                                    <p className="text-xs text-muted-foreground">Negócios</p>
                                </div>
                            </div>
                            <div className="glass px-4 py-3 rounded-xl flex items-center gap-3 hover:border-success/20 transition-all duration-200">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20">
                                    <DollarSign className="h-5 w-5 text-success" />
                                </div>
                                <div>
                                    <p className="text-2xl font-bold text-foreground">
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
                </div>
            </div>

            {/* Kanban Board */}
            <div className="flex-1 overflow-hidden -mx-8 px-8">
                <KanbanBoard initialStages={stages || []} searchQuery={search} />
            </div>
        </div>
    )
}
