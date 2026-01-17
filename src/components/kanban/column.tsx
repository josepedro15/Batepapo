'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DealCard } from './deal-card'
import { cn } from '@/lib/utils'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

interface ColumnProps {
    stage: any
    onLoadMore: (stageId: string) => Promise<void>
}

export function Column({ stage, onLoadMore }: ColumnProps) {
    const { setNodeRef, isOver } = useDroppable({
        id: stage.id,
    })

    const [isLoadingMore, setIsLoadingMore] = useState(false)
    const deals = stage.deals || []
    const hasMore = stage.hasMore
    const totalDeals = stage.totalDeals || deals.length

    const handleLoadMore = async () => {
        if (isLoadingMore || !hasMore) return
        setIsLoadingMore(true)
        try {
            await onLoadMore(stage.id)
        } catch (error) {
            console.error('Failed to load more deals:', error)
        } finally {
            setIsLoadingMore(false)
        }
    }

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
                    {totalDeals}
                </span>
            </div>

            <div ref={setNodeRef} className={cn(
                "flex-1 p-3 space-y-3 overflow-y-auto min-h-[200px] transition-colors duration-200",
                isOver && "bg-primary/5"
            )}>
                <SortableContext items={deals.map((d: any) => d.id)} strategy={verticalListSortingStrategy}>
                    {deals.map((deal: any, index: number) => (
                        <div key={deal.id} style={{ animationDelay: `${index * 30}ms` }} className="animate-fade-in">
                            <DealCard deal={deal} />
                        </div>
                    ))}
                </SortableContext>

                {(!deals || deals.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50">
                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                            <span className="text-lg">📋</span>
                        </div>
                        <p className="text-xs">Arraste cards aqui</p>
                    </div>
                )}

                {hasMore && (
                    <button
                        onClick={handleLoadMore}
                        disabled={isLoadingMore}
                        className="w-full py-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoadingMore ? (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin" />
                                Carregando...
                            </>
                        ) : (
                            'Carregar mais'
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}
