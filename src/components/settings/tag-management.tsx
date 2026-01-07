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
        { name: 'Roxo', value: 'violet', bg: 'bg-violet-500', ring: 'ring-violet-500' },
        { name: 'Azul', value: 'blue', bg: 'bg-blue-500', ring: 'ring-blue-500' },
        { name: 'Verde', value: 'green', bg: 'bg-green-500', ring: 'ring-green-500' },
        { name: 'Amarelo', value: 'amber', bg: 'bg-amber-500', ring: 'ring-amber-500' },
        { name: 'Vermelho', value: 'red', bg: 'bg-red-500', ring: 'ring-red-500' },
        { name: 'Rosa', value: 'pink', bg: 'bg-pink-500', ring: 'ring-pink-500' },
        { name: 'Ciano', value: 'cyan', bg: 'bg-cyan-500', ring: 'ring-cyan-500' },
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

    const selectedColor = colors.find(c => c.value === newTagColor) || colors[0]

    return (
        <div className="glass p-6 rounded-2xl h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center border border-pink-500/20">
                        <Tag className="h-5 w-5 text-pink-500" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">Etiquetas</h3>
                        <p className="text-xs text-muted-foreground">{tags.length} etiqueta{tags.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                {!isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl transition-all duration-200"
                        title="Nova etiqueta"
                    >
                        <Plus className="h-5 w-5" />
                    </button>
                )}
            </div>

            {/* Inline Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="mb-4 p-4 bg-muted/30 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="flex items-center gap-2 mb-3">
                        <div className={cn("w-4 h-4 rounded-full shrink-0 transition-all duration-300", selectedColor.bg)} />
                        <input
                            value={newTagName}
                            onChange={e => setNewTagName(e.target.value)}
                            placeholder="Nome da etiqueta"
                            className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                            maxLength={20}
                            autoFocus
                        />
                        <button
                            type="submit"
                            disabled={loading || !newTagName.trim()}
                            className="p-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-primary/20"
                        >
                            <Check className="h-4 w-4" />
                        </button>
                        <button
                            type="button"
                            onClick={cancelEditing}
                            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                    <div className="flex gap-2">
                        {colors.map(c => (
                            <button
                                key={c.value}
                                type="button"
                                onClick={() => setNewTagColor(c.value)}
                                className={cn(
                                    "w-7 h-7 rounded-full transition-all duration-300",
                                    c.bg,
                                    newTagColor === c.value
                                        ? "ring-2 ring-white ring-offset-2 ring-offset-background scale-110 shadow-lg"
                                        : "opacity-50 hover:opacity-80 hover:scale-105"
                                )}
                                title={c.name}
                            />
                        ))}
                    </div>
                </form>
            )}

            {/* Tags List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-[280px] pr-1">
                {tags.length === 0 && !isFormOpen && (
                    <button
                        onClick={() => setIsFormOpen(true)}
                        className="w-full py-8 text-center text-muted-foreground hover:text-foreground hover:bg-muted/30 rounded-xl transition-all duration-300 border-2 border-dashed border-border/50 hover:border-primary/20"
                    >
                        <div className="h-12 w-12 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-3">
                            <Tag className="h-6 w-6 opacity-50" />
                        </div>
                        <p className="text-sm font-medium">Nenhuma etiqueta</p>
                        <p className="text-xs text-muted-foreground/70 mt-1">Clique para criar</p>
                    </button>
                )}

                {tags.map((tag, index) => {
                    const colorClass = colors.find(c => c.value === tag.color) || colors[0]
                    return (
                        <div
                            key={tag.id}
                            className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/30 transition-all duration-200 group"
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-3.5 h-3.5 rounded-full shadow-sm transition-transform duration-200 group-hover:scale-110",
                                    colorClass.bg
                                )} />
                                <span className="text-sm font-medium text-foreground">{tag.name}</span>
                            </div>

                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <button
                                    onClick={() => startEditing(tag)}
                                    className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-all duration-200"
                                    title="Editar"
                                >
                                    <Edit2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => handleDeleteTag(tag.id)}
                                    className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
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
