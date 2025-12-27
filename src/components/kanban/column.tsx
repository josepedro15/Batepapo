'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DealCard } from './deal-card'
import { cn } from '@/lib/utils'

export function Column({ stage }: { stage: any }) {
    const { setNodeRef } = useDroppable({
        id: stage.id,
    })

    return (
        <div className={cn(
            "flex w-80 shrink-0 flex-col rounded-2xl overflow-hidden",
            "bg-card/30 backdrop-blur-sm",
            "border border-border/30",
            "shadow-lg"
        )}>
            <div className="p-4 border-b border-border/30 flex items-center justify-between bg-card/50">
                <div className="flex items-center gap-2">
                    <div className={`h-3 w-3 rounded-full ${stage.color || 'bg-muted-foreground'}`} />
                    <span className="font-bold text-foreground">{stage.name}</span>
                </div>
                <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded-md">
                    {stage.deals?.length || 0}
                </span>
            </div>

            <div ref={setNodeRef} className="flex-1 p-3 space-y-3 overflow-y-auto min-h-[150px]">
                <SortableContext items={(stage.deals || []).map((d: any) => d.id)} strategy={verticalListSortingStrategy}>
                    {(stage.deals || []).map((deal: any) => (
                        <DealCard key={deal.id} deal={deal} />
                    ))}
                </SortableContext>
            </div>
        </div>
    )
}

