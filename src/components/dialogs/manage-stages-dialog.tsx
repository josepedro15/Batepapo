'use client'

import { useState } from 'react'
import { Settings, X, Plus, GripVertical, Pencil, Trash2, Check, Layers, DollarSign } from 'lucide-react'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createStage, updateStage, reorderStages, deleteStage } from '@/app/dashboard/kanban/stage-actions'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

interface Stage {
    id: string
    name: string
    color: string
    position: number
    compute_value: boolean
    deals?: any[]
}

const AVAILABLE_COLORS = [
    { value: 'bg-blue-500', label: 'Azul' },
    { value: 'bg-yellow-500', label: 'Amarelo' },
    { value: 'bg-purple-500', label: 'Roxo' },
    { value: 'bg-green-500', label: 'Verde' },
    { value: 'bg-red-500', label: 'Vermelho' },
    { value: 'bg-orange-500', label: 'Laranja' },
    { value: 'bg-pink-500', label: 'Rosa' },
    { value: 'bg-indigo-500', label: 'Índigo' },
    { value: 'bg-teal-500', label: 'Teal' },
    { value: 'bg-cyan-500', label: 'Ciano' },
    { value: 'bg-lime-500', label: 'Lima' },
    { value: 'bg-emerald-500', label: 'Esmeralda' },
]

function SortableStageItem({ stage, onEdit, onDelete, isLastStage }: { stage: Stage, onEdit: () => void, onDelete: () => void, isLastStage: boolean }) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: stage.id })

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    }

    const dealCount = stage.deals?.length || 0

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-3 bg-muted/50 border border-border rounded-xl p-3 hover:bg-muted/70 transition-colors"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            <div className={`h-4 w-4 rounded-full ${stage.color} shadow-sm`} />

            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <span className="font-medium text-foreground">{stage.name}</span>
                    {stage.compute_value && (
                        <div title="Soma ao valor total do pipeline" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 p-0.5 rounded-full">
                            <DollarSign className="h-3 w-3" />
                        </div>
                    )}
                </div>
                <div className="text-xs text-muted-foreground">{dealCount} {dealCount === 1 ? 'negócio' : 'negócios'}</div>
            </div>

            <div className="flex gap-1">
                <button
                    onClick={onEdit}
                    className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={onDelete}
                    disabled={isLastStage}
                    className={cn(
                        "p-2 rounded-lg transition-colors",
                        isLastStage
                            ? "text-muted-foreground/50 cursor-not-allowed"
                            : "text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    )}
                    title={isLastStage ? "É obrigatório ter ao menos um estágio" : "Excluir estágio"}
                >
                    <Trash2 className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}

function ColorPicker({ value, onChange }: { value: string, onChange: (color: string) => void }) {
    return (
        <div className="grid grid-cols-6 gap-2">
            {AVAILABLE_COLORS.map(color => (
                <button
                    key={color.value}
                    type="button"
                    onClick={() => onChange(color.value)}
                    className={cn(
                        `h-8 w-8 rounded-full ${color.value} transition-all`,
                        value === color.value
                            ? 'ring-2 ring-primary ring-offset-2 ring-offset-card scale-110'
                            : 'hover:scale-110'
                    )}
                    title={color.label}
                />
            ))}
        </div>
    )
}

export function ManageStagesDialog({ initialStages, pipelineId }: { initialStages: Stage[], pipelineId: string }) {
    const [open, setOpen] = useState(false)
    const [stages, setStages] = useState(initialStages)
    const [editingStage, setEditingStage] = useState<Stage | null>(null)
    const [deletingStage, setDeletingStage] = useState<Stage | null>(null)
    const [isCreating, setIsCreating] = useState(false)
    const [loading, setLoading] = useState(false)

    // New stage form
    const [newStageName, setNewStageName] = useState('')
    const [newStageColor, setNewStageColor] = useState('bg-blue-500')
    const [newStageComputeValue, setNewStageComputeValue] = useState(false)

    // Edit form
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('')
    const [editComputeValue, setEditComputeValue] = useState(false)

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        })
    )

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event

        if (!over || active.id === over.id) return

        const oldIndex = stages.findIndex(s => s.id === active.id)
        const newIndex = stages.findIndex(s => s.id === over.id)

        const reorderedStages = [...stages]
        const [movedStage] = reorderedStages.splice(oldIndex, 1)
        reorderedStages.splice(newIndex, 0, movedStage)

        setStages(reorderedStages)

        // Call server action
        reorderStages(reorderedStages.map(s => s.id)).catch(error => {
            toast.error('Erro ao reordenar estágios')
            setStages(stages) // Revert on error
        })
    }

    async function handleCreateStage() {
        if (!newStageName.trim()) {
            toast.error('Digite um nome para o estágio')
            return
        }

        setLoading(true)
        try {
            const newStage = await createStage(pipelineId, newStageName, newStageColor, newStageComputeValue)
            setStages([...stages, { ...newStage, deals: [] }])
            setIsCreating(false)
            setNewStageName('')
            setNewStageColor('bg-blue-500')
            setNewStageComputeValue(false)
            toast.success('Estágio criado com sucesso!')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao criar estágio')
        } finally {
            setLoading(false)
        }
    }

    async function handleUpdateStage() {
        if (!editingStage || !editName.trim()) return

        setLoading(true)
        try {
            await updateStage(editingStage.id, editName, editColor, editComputeValue)
            setStages(stages.map(s => s.id === editingStage.id ? {
                ...s,
                name: editName,
                color: editColor,
                compute_value: editComputeValue
            } : s))
            setEditingStage(null)
            toast.success('Estágio atualizado com sucesso!')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao atualizar estágio')
        } finally {
            setLoading(false)
        }
    }

    async function handleDeleteStage() {
        if (!deletingStage) return

        setLoading(true)
        try {
            await deleteStage(deletingStage.id)
            setStages(stages.filter(s => s.id !== deletingStage.id))
            setDeletingStage(null)
            toast.success('Estágio excluído com sucesso!')
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir estágio')
        } finally {
            setLoading(false)
        }
    }

    function openEditDialog(stage: Stage) {
        setEditingStage(stage)
        setEditName(stage.name)
        setEditColor(stage.color)
        setEditComputeValue(stage.compute_value)
    }

    const modalContent = open ? (
        <>
            {/* Main Dialog */}
            <div
                className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
                onClick={() => setOpen(false)}
            >
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                <div
                    className="relative bg-card border border-border/50 p-6 rounded-2xl w-full max-w-2xl max-h-[80vh] overflow-y-auto shadow-2xl animate-in zoom-in-95 duration-200 scrollbar-thin"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                                <Layers className="h-5 w-5 text-primary-foreground" />
                            </div>
                            <h2 className="text-xl font-bold text-foreground">Gerenciar Estágios</h2>
                        </div>
                        <button
                            onClick={() => setOpen(false)}
                            className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-2 mb-6">
                                {stages.map(stage => (
                                    <SortableStageItem
                                        key={stage.id}
                                        stage={stage}
                                        onEdit={() => openEditDialog(stage)}
                                        onDelete={() => setDeletingStage(stage)}
                                        isLastStage={stages.length <= 1}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Create New Stage */}
                    {isCreating ? (
                        <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                            <input
                                type="text"
                                placeholder="Nome do estágio"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                autoFocus
                            />

                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                                <input
                                    type="checkbox"
                                    id="newStageComputeValue"
                                    checked={newStageComputeValue}
                                    onChange={(e) => setNewStageComputeValue(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="newStageComputeValue" className="text-sm font-medium text-foreground cursor-pointer select-none">
                                    Somar valor deste estágio no total do Pipeline
                                </label>
                            </div>

                            <ColorPicker value={newStageColor} onChange={setNewStageColor} />

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-2.5 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateStage}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-primary-foreground font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="h-4 w-4" /> {loading ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full bg-muted/30 border border-dashed border-border hover:border-primary hover:bg-muted/50 text-muted-foreground hover:text-foreground font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" /> Novo Estágio
                        </button>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            {editingStage && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setEditingStage(null)}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <div
                        className="relative bg-card border border-border/50 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">Editar Estágio</h3>
                            <button
                                onClick={() => setEditingStage(null)}
                                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">Nome</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-muted/50 border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-border">
                                <input
                                    type="checkbox"
                                    id="editComputeValue"
                                    checked={editComputeValue}
                                    onChange={(e) => setEditComputeValue(e.target.checked)}
                                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                                />
                                <label htmlFor="editComputeValue" className="text-sm font-medium text-foreground cursor-pointer select-none">
                                    Somar valor deste estágio no total do Pipeline
                                </label>
                            </div>

                            <div>
                                <label className="text-sm font-medium text-muted-foreground mb-2 block">Cor</label>
                                <ColorPicker value={editColor} onChange={setEditColor} />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingStage(null)}
                                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateStage}
                                    disabled={loading}
                                    className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-primary-foreground font-bold py-3 rounded-xl transition-all"
                                >
                                    {loading ? 'Salvando...' : 'Salvar'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Dialog */}
            {deletingStage && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setDeletingStage(null)}
                >
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

                    <div
                        className="relative bg-card border border-border/50 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-foreground">Confirmar Exclusão</h3>
                            <button
                                onClick={() => setDeletingStage(null)}
                                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-muted-foreground mb-6">
                            Tem certeza que deseja excluir o estágio <strong className="text-foreground">"{deletingStage.name}"</strong>?
                            {deletingStage.deals && deletingStage.deals.length > 0 && (
                                <span className="block mt-2 text-destructive">
                                    ⚠️ Este estágio contém {deletingStage.deals.length} negócio(s). Não é possível excluir.
                                </span>
                            )}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingStage(null)}
                                className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteStage}
                                disabled={loading || (deletingStage.deals && deletingStage.deals.length > 0)}
                                className="flex-1 bg-destructive hover:bg-destructive/90 disabled:opacity-50 text-destructive-foreground font-bold py-3 rounded-xl transition-all"
                            >
                                {loading ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    ) : null

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2"
            >
                <Settings className="h-4 w-4" /> Gerenciar Estágios
            </button>

            {typeof window !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
        </>
    )
}
