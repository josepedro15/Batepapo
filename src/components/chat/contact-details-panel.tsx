import { useState, useEffect } from 'react'
import { X, Tag, Plus, Clock, StickyNote, Calendar, CheckCircle2, Circle, AlertCircle, ListTodo, FileText } from 'lucide-react'
import { addTag, removeTag, addNote, getNotes, getReminders, createReminder, toggleReminder, getPipelines, updateContactStage, getContactDeal, updateDealValue } from '@/app/dashboard/chat/actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { getTags, createTag } from '@/app/dashboard/settings/actions'

export function ContactDetailsPanel({ contact, onClose }: { contact: any, onClose: () => void }) {
    const [activeTab, setActiveTab] = useState<'info' | 'notes' | 'reminders'>('info')
    const [loading, setLoading] = useState(false)
    const [notes, setNotes] = useState<any[]>([])
    const [reminders, setReminders] = useState<any[]>([])
    const [pipelines, setPipelines] = useState<any[]>([])
    const [availableTags, setAvailableTags] = useState<any[]>([]) // Store standard tags

    const [newTag, setNewTag] = useState('')
    const [showTagSuggestions, setShowTagSuggestions] = useState(false) // New state for dropdown
    const [newNote, setNewNote] = useState('')
    const [newReminderTitle, setNewReminderTitle] = useState('')
    const [newReminderDate, setNewReminderDate] = useState('')

    const [selectedPipelineId, setSelectedPipelineId] = useState('')
    const [selectedStageId, setSelectedStageId] = useState('')
    const [dealValue, setDealValue] = useState<string>('')
    const [isSavingValue, setIsSavingValue] = useState(false)

    // Fetch Initial Data
    useEffect(() => {
        loadData()
    }, [contact.id])

    async function loadData() {
        setLoading(true)
        const [n, r, p, t, dealState] = await Promise.all([
            getNotes(contact.id),
            getReminders(contact.id),
            getPipelines(),
            getTags(),
            getContactDeal(contact.id)
        ])
        setNotes(n || [])
        setReminders(r || [])
        setPipelines(p || [])
        setAvailableTags(t || [])

        if (dealState) {
            setSelectedStageId(dealState.stage_id)
            setSelectedPipelineId(dealState.pipeline_id)
            setDealValue(dealState.value?.toString() || '')
        }

        setLoading(false)
    }

    // --- Actions ---

    async function handleAddTag(e?: React.FormEvent) {
        if (e) e.preventDefault()
        const tagToCreate = newTag.trim()
        if (!tagToCreate) return

        // 1. Check if tag exists globally
        const existingGlobalTag = availableTags.find(t => t.name.toLowerCase() === tagToCreate.toLowerCase())

        if (!existingGlobalTag) {
            // Create global tag first
            const result = await createTag(tagToCreate, 'violet') // Default color
            if (result.error) {
                toast.error(result.error)
                return
            }
            // Refresh available tags
            const updatedTags = await getTags()
            setAvailableTags(updatedTags)
        }

        // 2. Add to contact
        await addTag(contact.id, tagToCreate)

        setNewTag('')
        setShowTagSuggestions(false)
        toast.success('Etiqueta adicionada')
    }

    async function handleRemoveTag(tag: string) {
        await removeTag(contact.id, tag)
        toast.success('Etiqueta removida')
    }

    async function handleAddNote(e: React.FormEvent) {
        e.preventDefault()
        if (!newNote.trim()) return
        await addNote(contact.id, newNote)
        setNewNote('')
        loadData() // Refresh notes
        toast.success('Nota salva')
    }

    async function handleAddReminder(e: React.FormEvent) {
        e.preventDefault()
        if (!newReminderTitle.trim() || !newReminderDate) return
        await createReminder(contact.id, newReminderTitle, new Date(newReminderDate).toISOString())
        setNewReminderTitle('')
        setNewReminderDate('')
        loadData()
        toast.success('Lembrete agendado')
    }

    async function handleToggleReminder(id: string, currentStatus: boolean) {
        await toggleReminder(id, !currentStatus)
        loadData()
    }

    async function handleStageChange(stageId: string) {
        console.log('Changing stage to:', stageId)
        setSelectedStageId(stageId)
        // Find pipeline for this stage (simplified logic)
        const pipeline = pipelines.find(p => p.stages.some((s: any) => s.id === stageId))
        console.log('Found pipeline:', pipeline)

        if (pipeline) {
            try {
                const result = await updateContactStage(contact.id, pipeline.id, stageId)
                if (result.error) {
                    console.error('Server returned error:', result.error)
                    toast.error(`Erro: ${result.error}`)
                } else {
                    console.log('Stage update successful')
                    toast.success('Estágio atualizado')
                }
            } catch (error) {
                console.error('Error updating stage:', error)
                toast.error('Erro ao atualizar estágio')
            }
        } else {
            console.warn('No pipeline found for stage:', stageId)
        }
    }

    async function handleSaveValue() {
        const numValue = parseFloat(dealValue.replace(/[^\d.,]/g, '').replace(',', '.')) || 0
        setIsSavingValue(true)
        try {
            const result = await updateDealValue(contact.id, numValue)
            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Valor atualizado')
            }
        } catch (error) {
            toast.error('Erro ao salvar valor')
        } finally {
            setIsSavingValue(false)
        }
    }

    const tabs = [
        { id: 'info' as const, label: 'Geral', icon: Tag },
        { id: 'notes' as const, label: 'Notas', icon: FileText },
        { id: 'reminders' as const, label: 'Tarefas', icon: ListTodo },
    ]

    return (
        <div className="w-80 border-l border-border/50 bg-card/50 flex flex-col h-full animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-border/50 flex items-center justify-between bg-muted/30">
                <h3 className="font-bold text-foreground">Detalhes</h3>
                <button onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-lg transition-colors">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Content Tabs Switcher */}
            <div className="flex border-b border-border/50">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "flex-1 py-3 text-xs font-bold uppercase flex items-center justify-center gap-1.5 transition-all duration-200 border-b-2 border-transparent",
                            activeTab === tab.id
                                ? "text-primary border-primary bg-primary/5"
                                : "text-muted-foreground hover:text-primary/80"
                        )}
                    >
                        <tab.icon className="h-3.5 w-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* --- TAB: INFO (Tags & CRM) --- */}
                {activeTab === 'info' && (
                    <>
                        {/* Tags Info */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1.5 block">
                                <Tag className="h-3.5 w-3.5" /> Etiquetas
                            </label>

                            {/* Tags List */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {contact.tags?.map((tagName: string) => {
                                    // Find standard tag color if exists
                                    const standardTag = availableTags.find(t => t.name === tagName)
                                    const colorMap: any = {
                                        violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
                                        blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                                        green: 'bg-green-500/20 text-green-400 border-green-500/30',
                                        amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                                        red: 'bg-red-500/20 text-red-400 border-red-500/30',
                                        pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
                                        cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
                                    }
                                    const colorClass = standardTag ? colorMap[standardTag.color] : 'bg-muted text-muted-foreground border-border'

                                    return (
                                        <span key={tagName} className={cn("px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 group transition-all duration-200 border", colorClass)}>
                                            {tagName}
                                            <button onClick={() => handleRemoveTag(tagName)} className="hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )
                                })}
                                {(!contact.tags || contact.tags.length === 0) && <span className="text-muted-foreground text-xs italic">Sem etiquetas</span>}
                            </div>

                            {/* Tag Input with Suggestions */}
                            <div className="relative">
                                <form onSubmit={handleAddTag} className="flex gap-2 relative z-20">
                                    <input
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onFocus={() => setShowTagSuggestions(true)}
                                        placeholder="Adicionar etiqueta..."
                                        className="flex-1 bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                                    />
                                    <button type="submit" className="bg-primary hover:bg-primary/90 p-2.5 rounded-xl text-primary-foreground transition-colors">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </form>

                                {/* Suggestions Popover */}
                                {showTagSuggestions && (
                                    <div className="absolute top-full left-0 right-0 mt-1 glass-heavy border border-border/50 rounded-xl shadow-xl overflow-hidden z-30 max-h-[180px] overflow-y-auto scrollbar-thin">
                                        {/* Available Tags Header */}
                                        {!newTag && availableTags.filter(t => !contact.tags?.includes(t.name)).length > 0 && (
                                            <div className="px-3 py-2 text-[10px] font-bold text-muted-foreground uppercase bg-muted/30 border-b border-border/30">
                                                Etiquetas disponíveis
                                            </div>
                                        )}
                                        
                                        {availableTags
                                            .filter(t => {
                                                // Filter out tags already on contact
                                                if (contact.tags?.includes(t.name)) return false
                                                // If user typed something, filter by search
                                                if (newTag) return t.name.toLowerCase().includes(newTag.toLowerCase())
                                                return true
                                            })
                                            .map(tag => {
                                                const colorMap: any = {
                                                    violet: 'bg-violet-500',
                                                    blue: 'bg-blue-500',
                                                    green: 'bg-green-500',
                                                    amber: 'bg-amber-500',
                                                    red: 'bg-red-500',
                                                    pink: 'bg-pink-500',
                                                    cyan: 'bg-cyan-500',
                                                }
                                                return (
                                                    <button
                                                        key={tag.id}
                                                        onClick={() => {
                                                            addTag(contact.id, tag.name)
                                                            setNewTag('')
                                                            setShowTagSuggestions(false)
                                                            toast.success('Etiqueta adicionada')
                                                        }}
                                                        className="w-full text-left px-3 py-2.5 text-xs text-foreground hover:bg-primary/10 hover:text-primary flex items-center gap-2.5 transition-colors"
                                                    >
                                                        <div className={cn("w-3 h-3 rounded-full shadow-sm", colorMap[tag.color] || 'bg-muted')} />
                                                        <span className="flex-1">{tag.name}</span>
                                                    </button>
                                                )
                                            })
                                        }
                                        
                                        {/* Empty state when no tags match */}
                                        {availableTags.filter(t => !contact.tags?.includes(t.name) && (!newTag || t.name.toLowerCase().includes(newTag.toLowerCase()))).length === 0 && !newTag && (
                                            <div className="px-3 py-4 text-xs text-muted-foreground text-center">
                                                Todas as etiquetas já estão aplicadas
                                            </div>
                                        )}
                                        
                                        {/* Allow creating new tag on the fly */}
                                        {newTag && !availableTags.some(t => t.name.toLowerCase() === newTag.toLowerCase()) && (
                                            <button
                                                onClick={handleAddTag}
                                                className="w-full text-left px-3 py-2.5 text-xs text-primary hover:bg-primary/10 font-medium border-t border-border/50 transition-colors flex items-center gap-2"
                                            >
                                                <Plus className="h-3.5 w-3.5" />
                                                Criar nova etiqueta "{newTag}"
                                            </button>
                                        )}
                                    </div>
                                )}
                                {/* Backdrop to close suggestions */}
                                {showTagSuggestions && (
                                    <div className="fixed inset-0 z-10" onClick={() => setShowTagSuggestions(false)} />
                                )}
                            </div>
                        </div>

                        {/* CRM Info */}
                        <div className="pt-4 border-t border-border/50">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1.5 block">
                                <AlertCircle className="h-3.5 w-3.5" /> Funil de Vendas
                            </label>

                            {/* Stage Selector */}
                            <select
                                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                                onChange={(e) => handleStageChange(e.target.value)}
                                value={selectedStageId}
                            >
                                <option value="" disabled>Selecione um Estágio</option>
                                {pipelines.map(pipeline => (
                                    <optgroup key={pipeline.id} label={pipeline.name}>
                                        {pipeline.stages.sort((a: any, b: any) => a.position - b.position).map((stage: any) => (
                                            <option key={stage.id} value={stage.id}>{stage.name}</option>
                                        ))}
                                    </optgroup>
                                ))}
                            </select>

                            {/* Deal Value */}
                            <div className="mt-4">
                                <label className="text-xs font-bold text-muted-foreground uppercase mb-2 flex items-center gap-1.5 block">
                                    Valor da Negociação
                                </label>
                                <div className="flex gap-2">
                                    <div className="relative flex-1">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                        <input
                                            type="text"
                                            value={dealValue}
                                            onChange={(e) => setDealValue(e.target.value)}
                                            placeholder="0,00"
                                            className="w-full bg-muted/50 border border-border rounded-xl pl-10 pr-3 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                                        />
                                    </div>
                                    <button
                                        onClick={handleSaveValue}
                                        disabled={isSavingValue}
                                        className="px-4 bg-primary hover:bg-primary/90 rounded-xl text-primary-foreground text-sm font-medium transition-colors disabled:opacity-50"
                                    >
                                        {isSavingValue ? '...' : 'Salvar'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Recent Notes Preview */}
                        <div className="pt-4 border-t border-border/50">
                            <label className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-1.5 block">
                                <FileText className="h-3.5 w-3.5" /> Últimas Notas
                            </label>

                            {notes.length > 0 ? (
                                <div className="space-y-2">
                                    {notes.slice(0, 3).map((note, index) => (
                                        <div 
                                            key={note.id} 
                                            className="bg-muted/20 p-3 rounded-lg border border-border/30 text-xs animate-fade-in"
                                            style={{ animationDelay: `${index * 50}ms` }}
                                        >
                                            <p className="text-foreground line-clamp-2 leading-relaxed">{note.content}</p>
                                            <p className="text-[10px] text-muted-foreground mt-2">
                                                {format(new Date(note.created_at), "dd/MM HH:mm", { locale: ptBR })}
                                            </p>
                                        </div>
                                    ))}
                                    
                                    {notes.length > 3 && (
                                        <button
                                            onClick={() => setActiveTab('notes')}
                                            className="w-full text-xs text-primary hover:text-primary/80 font-medium py-2 hover:bg-primary/5 rounded-lg transition-colors flex items-center justify-center gap-1.5"
                                        >
                                            Ver mais ({notes.length - 3} notas)
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-4">
                                    <p className="text-xs text-muted-foreground italic">Nenhuma nota registrada</p>
                                    <button
                                        onClick={() => setActiveTab('notes')}
                                        className="text-xs text-primary hover:text-primary/80 font-medium mt-2 transition-colors"
                                    >
                                        Adicionar nota
                                    </button>
                                </div>
                            )}
                        </div>
                    </>
                )}


                {/* --- TAB: NOTES --- */}
                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddNote} className="space-y-3">
                            <textarea
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                placeholder="Escreva uma observação interna..."
                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none min-h-[100px] transition-all duration-200 resize-none"
                            />
                            <button type="submit" className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 py-2.5 rounded-xl text-sm font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-200">
                                Salvar Nota
                            </button>
                        </form>

                        <div className="space-y-3">
                            {notes.map((note, index) => (
                                <div 
                                    key={note.id} 
                                    className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm animate-fade-in hover:border-primary/20 transition-all duration-200"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
                                    <div className="mt-3 flex justify-between items-center text-[10px] text-muted-foreground pt-2 border-t border-border/30">
                                        <span className="font-medium">{note.author?.name || 'Desconhecido'}</span>
                                        <span>{format(new Date(note.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                        <FileText className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground text-xs">Nenhuma nota registrada.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}


                {/* --- TAB: REMINDERS --- */}
                {activeTab === 'reminders' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddReminder} className="space-y-3 bg-muted/30 p-4 rounded-xl border border-border/50">
                            <input
                                value={newReminderTitle}
                                onChange={e => setNewReminderTitle(e.target.value)}
                                placeholder="O que lembrar?"
                                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                            />
                            <input
                                type="datetime-local"
                                value={newReminderDate}
                                onChange={e => setNewReminderDate(e.target.value)}
                                className="w-full bg-muted/50 border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                            />
                            <button type="submit" className="w-full bg-warning hover:bg-warning/90 py-2.5 rounded-xl text-sm font-bold text-warning-foreground shadow-lg shadow-warning/20 transition-all duration-200">
                                Agendar
                            </button>
                        </form>

                        <div className="space-y-2">
                            {reminders.map((rem, index) => (
                                <div 
                                    key={rem.id} 
                                    className={cn(
                                        "flex items-start gap-3 p-4 rounded-xl border transition-all duration-200 animate-fade-in",
                                        rem.completed 
                                            ? "bg-success/5 border-success/20 opacity-60" 
                                            : "bg-muted/30 border-border/50 hover:border-warning/30"
                                    )}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <button onClick={() => handleToggleReminder(rem.id, rem.completed)} className="mt-0.5 text-muted-foreground hover:text-success transition-colors">
                                        {rem.completed ? <CheckCircle2 className="h-5 w-5 text-success" /> : <Circle className="h-5 w-5" />}
                                    </button>
                                    <div className="flex-1">
                                        <p className={cn("text-sm font-medium", rem.completed ? "text-muted-foreground line-through" : "text-foreground")}>{rem.title}</p>
                                        <p className="text-[11px] text-warning flex items-center gap-1.5 mt-1.5">
                                            <Clock className="h-3 w-3" /> {format(new Date(rem.due_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {reminders.length === 0 && (
                                <div className="text-center py-8">
                                    <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center mx-auto mb-3">
                                        <ListTodo className="h-6 w-6 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground text-xs">Sem lembretes pendentes.</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
