'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DealCard } from './deal-card'
import { cn } from '@/lib/utils'

export function Column({ stage }: { stage: any }) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
    })

    return (
        <div className={cn(
            "flex w-80 shrink-0 flex-col rounded-2xl overflow-hidden transition-all duration-300",
            "glass",
            isOver && "ring-2 ring-primary/50 scale-[1.01]"
        )}>
            <div className="p-4 border-b border-border/30 flex items-center justify-between bg-muted/30">
                <div className="flex items-center gap-2.5">
                    <div className={cn(
                        "h-3 w-3 rounded-full shadow-sm",
                        stage.color || 'bg-muted-foreground'
                    )} />
                    <span className="font-bold text-foreground">{stage.name}</span>
                </div>
                <span className="text-xs font-bold text-muted-foreground bg-muted/80 px-2.5 py-1 rounded-lg border border-border/50">
                    {stage.deals?.length || 0}
                </span>
            </div>

            <div ref={setNodeRef} className={cn(
                "flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] transition-colors duration-200",
                isOver && "bg-primary/5"
            )}>
                <SortableContext items={(stage.deals || []).map((d: any) => d.id)} strategy={verticalListSortingStrategy}>
                    {(stage.deals || []).map((deal: any, index: number) => (
                        <div key={deal.id} style={{ animationDelay: `${index * 30}ms` }} className="animate-fade-in">
                            <DealCard deal={deal} />
                        </div>
                    ))}
                </SortableContext>
                
                {(!stage.deals || stage.deals.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50">
                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                            <span className="text-lg">📋</span>
                        </div>
                        <p className="text-xs">Arraste cards aqui</p>
                    </div>
                )}
            </div>
        </div>
    )
}
