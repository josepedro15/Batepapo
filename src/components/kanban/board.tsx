'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import { Column } from './column'
import { DealCard } from './deal-card'
import { moveDeal, getMoreDeals } from '@/app/dashboard/kanban/actions'

interface KanbanBoardProps {
    initialStages: any[]
}

export function KanbanBoard({ initialStages }: KanbanBoardProps) {
    // Initialize stages with a default page property if valid, or empty array
    // Also init searchQuery for each stage
    const [stages, setStages] = useState((initialStages || []).map(s => ({ ...s, page: 1, searchQuery: '' })))

    useEffect(() => {
        setStages((initialStages || []).map(s => ({ ...s, page: 1, searchQuery: '' })))
    }, [initialStages])

    const [activeDeal, setActiveDeal] = useState<any>(null)

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(TouchSensor)
    )

    function handleDragStart(event: DragStartEvent) {
        const { active } = event
        const deal = stages.flatMap(s => s.deals).find(d => d.id === active.id)
        setActiveDeal(deal)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveDeal(null)

        if (!over) return

        const activeDealId = active.id as string
        const overId = over.id as string

        // Find source and destination stages
        const sourceStage = stages.find(s => s.deals.find((d: any) => d.id === activeDealId))
        const destStage = stages.find(s => s.id === overId) || stages.find(s => s.deals.find((d: any) => d.id === overId))

        if (!sourceStage || !destStage) return

        // Optimistic Update
        if (sourceStage.id !== destStage.id) {
            const newStages = stages.map(stage => {
                if (stage.id === sourceStage.id) {
                    return { ...stage, deals: stage.deals.filter((d: any) => d.id !== activeDealId), totalDeals: (stage.totalDeals || 0) - 1 }
                }
                if (stage.id === destStage.id) {
                    const movedDeal = { ...activeDeal, stage_id: destStage.id }
                    return { ...stage, deals: [movedDeal, ...stage.deals], totalDeals: (stage.totalDeals || 0) + 1 }
                }
                return stage
            })
            setStages(newStages)

            // Server Action
            moveDeal(activeDealId, destStage.id)
        }
    }

    const handleLoadMore = async (stageId: string) => {
        const stage = stages.find(s => s.id === stageId)
        if (!stage) return

        const nextPage = (stage.page || 1) + 1
        // Use the stage's specific search query
        const result = await getMoreDeals(stageId, nextPage, stage.searchQuery)

        setStages(prev => prev.map(s => {
            if (s.id === stageId) {
                return {
                    ...s,
                    deals: [...s.deals, ...result.deals],
                    hasMore: result.hasMore,
                    page: nextPage
                }
            }
            return s
        }))
    }

    const handleColumnSearch = async (stageId: string, term: string) => {
        // Reset to page 1 and fetch with new term
        const result = await getMoreDeals(stageId, 1, term)

        setStages(prev => prev.map(s => {
            if (s.id === stageId) {
                return {
                    ...s,
                    deals: result.deals,
                    hasMore: result.hasMore,
                    page: 1,
                    searchQuery: term
                }
            }
            return s
        }))
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-4">
                {stages.map(stage => (
                    <Column key={stage.id} stage={stage} onLoadMore={handleLoadMore} onSearch={handleColumnSearch} />
                ))}
            </div>

            <DragOverlay>
                {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    )
}
