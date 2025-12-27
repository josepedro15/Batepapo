'use client'

import { useState, useEffect } from 'react'
import { Tag, Plus, Trash2, Edit2, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { getTags, createTag, deleteTag, updateTag } from '@/app/dashboard/settings/actions'
import { cn } from '@/lib/utils'

export function TagManagement() {
    const [tags, setTags] = useState<any[]>([])
    const [loading, setLoading] = useState(false)
    const [newTagName, setNewTagName] = useState('')
    const [newTagColor, setNewTagColor] = useState('violet')
    const [editingTagId, setEditingTagId] = useState<string | null>(null)
    const [isFormOpen, setIsFormOpen] = useState(false)

    const colors = [
        { name: 'Roxo', value: 'violet', bg: 'bg-violet-500' },
        { name: 'Azul', value: 'blue', bg: 'bg-blue-500' },
        { name: 'Verde', value: 'green', bg: 'bg-green-500' },
        { name: 'Amarelo', value: 'amber', bg: 'bg-amber-500' },
        { name: 'Vermelho', value: 'red', bg: 'bg-red-500' },
        { name: 'Rosa', value: 'pink', bg: 'bg-pink-500' },
        { name: 'Ciano', value: 'cyan', bg: 'bg-cyan-500' },
    ]

    useEffect(() => {
        loadTags()
    }, [])

    async function loadTags() {
        const data = await getTags()
        setTags(data)
    }

    function startEditing(tag: any) {
        setEditingTagId(tag.id)
        setNewTagName(tag.name)
        setNewTagColor(tag.color)
        setIsFormOpen(true)
    }

    function cancelEditing() {
        setEditingTagId(null)
        setNewTagName('')
        setNewTagColor('violet')
        setIsFormOpen(false)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!newTagName.trim()) return

        setLoading(true)

        let result
        if (editingTagId) {
            result = await updateTag(editingTagId, newTagName, newTagColor)
        } else {
            result = await createTag(newTagName, newTagColor)
        }

        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success(editingTagId ? 'Etiqueta atualizada!' : 'Etiqueta criada!')
            cancelEditing()
            loadTags()
        }
    }

    async function handleDeleteTag(id: string) {
        if (!confirm('Tem certeza? Isso removerá a etiqueta.')) return

        const result = await deleteTag(id)
        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Etiqueta removida.')
            loadTags()
        }
    }

    return (
        <div className="glass p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Tag className="h-5 w-5 text-pink-400" />
                    <h3 className="font-bold text-foreground">Etiquetas</h3>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        {tags.length}
                    </span>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Nova etiqueta"
                    >
                        <Plus className="h-4 w-4" />
                    </button>
                )}
            </div>

            {/* Inline Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="mb-4 p-3 bg-muted/30 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                        <input
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            placeholder="Nome da etiqueta"
                            className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:ring-1 focus:ring-primary outline-none"
                            maxLength={20}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !newTagName.trim()}
                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={cancelEditing}
                            className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex gap-1.5">
                        {colors.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setNewTagColor(c.value)}
                                className={cn(
                                    "w-6 h-6 rounded-full transition-all",
                                    c.bg,
                                    newTagColor === c.value
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110"
                                        : "opacity-50 hover:opacity-100"
                                )}
                                title={c.name}
                            />
                        ))}
                    </div>
                </form>
            )}

            {/* Tags List */}
            <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
                {tags.length === 0 && !isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full py-6 text-center text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-colors"
                    >
                        <Tag className="h-8 w-8 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">Nenhuma etiqueta</p>
                        <p className="text-xs">Clique para criar</p>
                    </button>
                )}

                {tags.map(tag => {
                    const colorClass = colors.find(c => c.value === tag.color) || colors[0]
                    return (
                        <div
                            key={tag.id}
                            className="flex items-center justify-between p-2.5 rounded-lg hover:bg-muted/30 transition-colors group"
                        >
                            <div className="flex items-center gap-2.5">
                                <div className={cn("w-3 h-3 rounded-full", colorClass.bg)} />
                                <span className="text-sm font-medium text-foreground">{tag.name}</span>
                            </div>

                            <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                    onClick={() => startEditing(tag)}
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded transition-colors"
                                    title="Editar"
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteTag(tag.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded transition-colors"
                                    title="Excluir"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
