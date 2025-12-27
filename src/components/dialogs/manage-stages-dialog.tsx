'use client'

import { useState } from 'react'
import { Settings, X, Plus, GripVertical, Pencil, Trash2, Check } from 'lucide-react'
import { DndContext, DragEndEvent, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { createStage, updateStage, reorderStages, deleteStage } from '@/app/dashboard/kanban/stage-actions'
import { toast } from 'sonner'

interface Stage {
    id: string
    name: string
    color: string
    position: number
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

function SortableStageItem({ stage, onEdit, onDelete }: { stage: Stage, onEdit: () => void, onDelete: () => void }) {
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
            className="flex items-center gap-3 bg-slate-900/50 border border-slate-700 rounded-lg p-3 hover:bg-slate-900/70 transition-colors"
        >
            <button
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300"
            >
                <GripVertical className="h-5 w-5" />
            </button>

            <div className={`h-4 w-4 rounded-full ${stage.color}`} />

            <div className="flex-1">
                <div className="font-medium text-white">{stage.name}</div>
                <div className="text-xs text-slate-500">{dealCount} {dealCount === 1 ? 'negócio' : 'negócios'}</div>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onEdit}
                    className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                >
                    <Pencil className="h-4 w-4" />
                </button>
                <button
                    onClick={onDelete}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
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
                    className={`h-8 w-8 rounded-full ${color.value} ${value === color.value ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'hover:scale-110'
                        } transition-all`}
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

    // Edit form
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('')

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
            const newStage = await createStage(pipelineId, newStageName, newStageColor)
            setStages([...stages, { ...newStage, deals: [] }])
            setIsCreating(false)
            setNewStageName('')
            setNewStageColor('bg-blue-500')
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
            await updateStage(editingStage.id, editName, editColor)
            setStages(stages.map(s => s.id === editingStage.id ? { ...s, name: editName, color: editColor } : s))
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
    }

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg transition-all flex items-center gap-2"
            >
                <Settings className="h-4 w-4" /> Gerenciar Estágios
            </button>
        )
    }

    return (
        <>
            {/* Main Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="glass p-6 rounded-2xl border border-white/5 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-white">Gerenciar Estágios</h2>
                        <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                        <SortableContext items={stages.map(s => s.id)} strategy={verticalListSortingStrategy}>
                            <div className="space-y-3 mb-6">
                                {stages.map(stage => (
                                    <SortableStageItem
                                        key={stage.id}
                                        stage={stage}
                                        onEdit={() => openEditDialog(stage)}
                                        onDelete={() => setDeletingStage(stage)}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>

                    {/* Create New Stage */}
                    {isCreating ? (
                        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 space-y-3">
                            <input
                                type="text"
                                placeholder="Nome do estágio"
                                value={newStageName}
                                onChange={(e) => setNewStageName(e.target.value)}
                                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            />
                            <ColorPicker value={newStageColor} onChange={setNewStageColor} />
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setIsCreating(false)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-lg transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleCreateStage}
                                    disabled={loading}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    <Check className="h-4 w-4" /> {loading ? 'Criando...' : 'Criar'}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="w-full bg-slate-900/50 border border-dashed border-slate-700 hover:border-violet-500 hover:bg-slate-900/70 text-slate-400 hover:text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                            <Plus className="h-5 w-5" /> Novo Estágio
                        </button>
                    )}
                </div>
            </div>

            {/* Edit Dialog */}
            {editingStage && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="glass p-6 rounded-2xl border border-white/5 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Editar Estágio</h3>
                            <button onClick={() => setEditingStage(null)} className="text-slate-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Nome</label>
                                <input
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-slate-300 mb-2 block">Cor</label>
                                <ColorPicker value={editColor} onChange={setEditColor} />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => setEditingStage(null)}
                                    className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleUpdateStage}
                                    disabled={loading}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
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
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
                    <div className="glass p-6 rounded-2xl border border-white/5 w-full max-w-md">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-white">Confirmar Exclusão</h3>
                            <button onClick={() => setDeletingStage(null)} className="text-slate-400 hover:text-white">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <p className="text-slate-300 mb-6">
                            Tem certeza que deseja excluir o estágio <strong className="text-white">"{deletingStage.name}"</strong>?
                            {deletingStage.deals && deletingStage.deals.length > 0 && (
                                <span className="block mt-2 text-red-400">
                                    ⚠️ Este estágio contém {deletingStage.deals.length} negócio(s). Não é possível excluir.
                                </span>
                            )}
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingStage(null)}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteStage}
                                disabled={loading || (deletingStage.deals && deletingStage.deals.length > 0)}
                                className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                            >
                                {loading ? 'Excluindo...' : 'Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}
