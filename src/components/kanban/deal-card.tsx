'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useState } from 'react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { EditDealDialog } from '@/components/dialogs/edit-deal-dialog'
import { deleteDeal } from '@/app/dashboard/kanban/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function DealCard({ deal, isOverlay }: { deal: any, isOverlay?: boolean }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
        id: deal.id,
    })

    const style = {
        transform: CSS.Translate.toString(transform),
    }

    const [editOpen, setEditOpen] = useState(false)

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation() // Prevent drag start or card click
        if (!confirm('Excluir este negócio?')) return

        const result = await deleteDeal(deal.id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Negócio excluído')
        }
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                className={cn(
                    "p-4 rounded-xl relative group",
                    "bg-card/80 backdrop-blur-sm",
                    "border border-border/50",
                    "shadow-sm hover:shadow-lg",
                    "hover:border-primary/30 hover:scale-[1.02]",
                    "transition-all duration-200 ease-out",
                    "cursor-grab active:cursor-grabbing",
                    isOverlay && "ring-2 ring-primary rotate-2 scale-105 shadow-2xl z-50"
                )}
            >
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground line-clamp-2 pr-6 text-sm">{deal.title}</h4>

                    {/* More Options Dropdown */}
                    {!isOverlay && (
                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity" onPointerDown={e => e.stopPropagation()}>
                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button className="h-6 w-6 flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground outline-none">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content align="end" className="w-32 bg-popover border border-border rounded-lg p-1 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                                        <DropdownMenu.Item onClick={() => setEditOpen(true)} className="text-foreground hover:bg-muted p-2 rounded text-xs flex items-center gap-2 cursor-pointer outline-none">
                                            <Pencil className="h-3 w-3" /> Editar
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item onClick={handleDelete} className="text-destructive hover:bg-destructive/10 p-2 rounded text-xs flex items-center gap-2 cursor-pointer outline-none">
                                            <Trash2 className="h-3 w-3" /> Excluir
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        </div>
                    )}
                </div>

                {deal.value > 0 && (
                    <span className="text-xs font-bold text-success bg-success/10 px-2 py-1 rounded inline-block mb-3">
                        R$ {deal.value}
                    </span>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground border-t border-border/50 pt-3">
                    <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-foreground shrink-0">
                        {deal.contacts?.name?.charAt(0) || '?'}
                    </div>
                    <span className="truncate max-w-[120px]">{deal.contacts?.name}</span>
                </div>
            </div>

            <EditDealDialog deal={deal} open={editOpen} onOpenChange={setEditOpen} />
        </>
    )
}

