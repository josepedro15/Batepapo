'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { MoreHorizontal, Pencil, Trash2, MessageCircle, ChevronDown, Phone, DollarSign, TrendingUp } from 'lucide-react'
import { useState } from 'react'
import Link from 'next/link'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { EditDealDialog } from '@/components/dialogs/edit-deal-dialog'
import { deleteDeal } from '@/app/dashboard/kanban/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function DealCard({ deal, isOverlay }: { deal: any, isOverlay?: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: deal.id,
    })

    const style = {
        transform: CSS.Translate.toString(transform),
    }

    const [editOpen, setEditOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)

    async function handleDelete(e: React.MouseEvent) {
        e.stopPropagation()
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
                    "bg-card/90 backdrop-blur-sm",
                    "border border-border/50",
                    "shadow-sm hover:shadow-lg",
                    "hover:border-primary/30",
                    "transition-all duration-200 ease-out",
                    "cursor-grab active:cursor-grabbing",
                    isDragging && "opacity-50 scale-95",
                    isOverlay && "ring-2 ring-primary rotate-2 scale-105 shadow-2xl z-50 bg-card"
                )}
            >
                <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-foreground line-clamp-2 pr-6 text-sm">{deal.title}</h4>

                    {/* More Options Dropdown */}
                    {!isOverlay && (
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-all duration-200 flex gap-1" onPointerDown={e => e.stopPropagation()}>
                             <Link 
                                href={`/dashboard/chat?chatId=${deal.contact_id || deal.contacts?.id}`}
                                className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-primary/20 text-muted-foreground hover:text-primary outline-none transition-colors"
                                title="Ir para conversa"
                            >
                                <MessageCircle className="h-4 w-4" />
                            </Link>

                            <DropdownMenu.Root>
                                <DropdownMenu.Trigger asChild>
                                    <button className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground outline-none transition-colors">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </button>
                                </DropdownMenu.Trigger>
                                <DropdownMenu.Portal>
                                    <DropdownMenu.Content align="end" className="w-36 glass-heavy border border-border/50 rounded-xl p-1.5 shadow-xl z-50 animate-in fade-in-0 zoom-in-95">
                                        <DropdownMenu.Item onClick={() => setEditOpen(true)} className="text-foreground hover:bg-primary/10 hover:text-primary p-2.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer outline-none transition-colors">
                                            <Pencil className="h-3.5 w-3.5" /> Editar
                                        </DropdownMenu.Item>
                                        <DropdownMenu.Item onClick={handleDelete} className="text-destructive hover:bg-destructive/10 p-2.5 rounded-lg text-xs flex items-center gap-2 cursor-pointer outline-none transition-colors">
                                            <Trash2 className="h-3.5 w-3.5" /> Excluir
                                        </DropdownMenu.Item>
                                    </DropdownMenu.Content>
                                </DropdownMenu.Portal>
                            </DropdownMenu.Root>
                        </div>
                    )}
                </div>

                {deal.value > 0 && (
                    <span className="text-xs font-bold text-success bg-success/10 px-2.5 py-1 rounded-lg inline-block mb-3 border border-success/20">
                        R$ {deal.value.toLocaleString('pt-BR')}
                    </span>
                )}

                <div className="border-t border-border/50 pt-3">
                    <div 
                        className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
                        onPointerDown={e => e.stopPropagation()}
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0 shadow-sm">
                            {deal.contacts?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span className="truncate max-w-[120px] font-medium">{deal.contacts?.name}</span>
                        <ChevronDown 
                            className={cn(
                                "h-4 w-4 ml-auto transition-transform duration-200",
                                isExpanded && "rotate-180"
                            )} 
                        />
                    </div>
                    
                    {/* Expandable Details */}
                    <div className={cn(
                        "overflow-hidden transition-all duration-200 ease-out",
                        isExpanded ? "max-h-40 opacity-100 mt-3" : "max-h-0 opacity-0"
                    )}>
                        <div className="space-y-2 pl-8 text-xs">
                            {/* Phone */}
                            {deal.contacts?.phone && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <Phone className="h-3.5 w-3.5" />
                                    <span>{deal.contacts.phone}</span>
                                </div>
                            )}
                            
                            {/* Status */}
                            {deal.status && (
                                <div className="flex items-center gap-2 text-muted-foreground">
                                    <TrendingUp className="h-3.5 w-3.5" />
                                    <span className={cn(
                                        "px-2 py-0.5 rounded-md text-[10px] font-medium",
                                        deal.status === 'open' && "bg-blue-500/10 text-blue-500",
                                        deal.status === 'won' && "bg-green-500/10 text-green-500",
                                        deal.status === 'lost' && "bg-red-500/10 text-red-500"
                                    )}>
                                        {deal.status === 'open' ? 'Em aberto' : deal.status === 'won' ? 'Ganho' : deal.status === 'lost' ? 'Perdido' : deal.status}
                                    </span>
                                </div>
                            )}
                            
                            {/* Deal Value */}
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <DollarSign className="h-3.5 w-3.5" />
                                <span className="font-medium text-foreground">
                                    R$ {(deal.value || 0).toLocaleString('pt-BR')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <EditDealDialog deal={deal} open={editOpen} onOpenChange={setEditOpen} />
        </>
    )
}
