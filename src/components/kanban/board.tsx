'use client'

import { useState, useEffect } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core'
import { arrayMove, SortableContext } from '@dnd-kit/sortable'
import { Column } from './column'
import { DealCard } from './deal-card'
import { moveDeal } from '@/app/dashboard/kanban/actions'

interface KanbanBoardProps {
    initialStages: any[]
}

export function KanbanBoard({ initialStages }: KanbanBoardProps) {
    const [stages, setStages] = useState(initialStages || [])

    useEffect(() => {
        setStages(initialStages || [])
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
                    return { ...stage, deals: stage.deals.filter((d: any) => d.id !== activeDealId) }
                }
                if (stage.id === destStage.id) {
                    const movedDeal = { ...activeDeal, stage_id: destStage.id }
                    return { ...stage, deals: [...stage.deals, movedDeal] }
                }
                return stage
            })
            setStages(newStages)

            // Server Action
            moveDeal(activeDealId, destStage.id)
        }
    }

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex h-full gap-6 overflow-x-auto pb-4">
                {stages.map(stage => (
                    <Column key={stage.id} stage={stage} />
                ))}
            </div>

            <DragOverlay>
                {activeDeal ? <DealCard deal={activeDeal} isOverlay /> : null}
            </DragOverlay>
        </DndContext>
    )
}
