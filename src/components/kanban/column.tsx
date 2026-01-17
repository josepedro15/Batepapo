'use client'

import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { DealCard } from './deal-card'
import { cn } from '@/lib/utils'
import { MoreHorizontal, Loader2, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDebouncedCallback } from 'use-debounce'
import { useState } from 'react'

interface ColumnProps {
    stage: any
    onLoadMore?: (stageId: string) => Promise<void>
    onSearch?: (stageId: string, term: string) => void
}

export function Column({ stage, onLoadMore, onSearch }: ColumnProps) {
    const { setNodeRef } = useDroppable({
        id: stage.id,
    })

    const [searchTerm, setSearchTerm] = useState('')
    const [isLoadingMore, setIsLoadingMore] = useState(false)

    const handleSearch = useDebouncedCallback((term: string) => {
        if (onSearch) {
            onSearch(stage.id, term)
        }
    }, 500)

    const onInputChange = (val: string) => {
        setSearchTerm(val)
        handleSearch(val)
    }

    const handleLoadMoreClick = async () => {
        if (isLoadingMore || !stage.hasMore || !onLoadMore) return
        setIsLoadingMore(true)
        try {
            await onLoadMore(stage.id)
        } finally {
            setIsLoadingMore(false)
        }
    }

    const deals = stage.deals || []

    return (
        <div className="flex h-full w-[350px] min-w-[350px] flex-col rounded-xl bg-muted/50 border border-border/50">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/50 bg-background/50 rounded-t-xl backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: stage.color || '#3b82f6' }} />
                    <h3 className="font-semibold text-sm">{stage.name}</h3>
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {stage.totalDeals || 0}
                    </span>
                    {stage.compute_value && (
                        <span className="ml-2 rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2 py-0.5 text-xs font-medium">
                            R$ {(stage.totalValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    )}
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-background/80">
                    <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                </Button>
            </div>

            {/* Search Input */}
            <div className="px-3 pt-3 pb-1">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <input
                        className="flex h-8 w-full rounded-lg border border-input bg-background px-3 py-1 pl-8 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        placeholder="Buscar contato..."
                        value={searchTerm}
                        onChange={(e) => onInputChange(e.target.value)}
                    />
                </div>
            </div>

            {/* Content */}
            <div ref={setNodeRef} className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-muted-foreground/20 hover:scrollbar-thumb-muted-foreground/40">
                <SortableContext items={deals.map((d: any) => d.id)} strategy={verticalListSortingStrategy}>
                    <div className="flex flex-col gap-3">
                        {deals.map((deal: any) => (
                            <DealCard key={deal.id} deal={deal} />
                        ))}
                    </div>
                </SortableContext>

                {(!deals || deals.length === 0) && (
                    <div className="flex flex-col items-center justify-center h-32 text-muted-foreground/50">
                        <div className="h-10 w-10 rounded-xl bg-muted/50 flex items-center justify-center mb-2">
                            <span className="text-lg">📋</span>
                        </div>
                        <p className="text-xs">Arraste cards aqui</p>
                    </div>
                )}

                {stage.hasMore && (
                    <div className="py-4 flex justify-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleLoadMoreClick}
                            disabled={isLoadingMore}
                            className="text-xs text-muted-foreground hover:text-foreground w-full"
                        >
                            {isLoadingMore ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : null}
                            {isLoadingMore ? 'Carregando...' : 'Carregar mais'}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
