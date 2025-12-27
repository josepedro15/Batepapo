import { useState, useEffect } from 'react'
import { X, Tag, Plus, Clock, StickyNote, Calendar, CheckCircle2, Circle, AlertCircle } from 'lucide-react'
import { addTag, removeTag, addNote, getNotes, getReminders, createReminder, toggleReminder, getPipelines, updateContactStage, getContactDeal } from '@/app/dashboard/chat/actions'
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
        await addTag(contact.id, tagToCreate) // Note: Case sensitive? Best to use the formatted name causing issues?
        // Let's rely on the user input for now or match the created tag name.

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

    return (
        <div className="w-80 border-l border-white/5 bg-slate-900/50 flex flex-col h-full animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="font-bold text-white">Detalhes</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                </button>
            </div>

            {/* Content Tabs Switcher */}
            <div className="flex border-b border-white/5">
                <button onClick={() => setActiveTab('info')} className={cn("flex-1 py-3 text-xs font-bold uppercase", activeTab === 'info' ? "text-violet-400 border-b-2 border-violet-500 bg-white/5" : "text-slate-500")}>Geral</button>
                <button onClick={() => setActiveTab('notes')} className={cn("flex-1 py-3 text-xs font-bold uppercase", activeTab === 'notes' ? "text-violet-400 border-b-2 border-violet-500 bg-white/5" : "text-slate-500")}>Notas</button>
                <button onClick={() => setActiveTab('reminders')} className={cn("flex-1 py-3 text-xs font-bold uppercase", activeTab === 'reminders' ? "text-violet-400 border-b-2 border-violet-500 bg-white/5" : "text-slate-500")}>Tarefas</button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">

                {/* --- TAB: INFO (Tags & CRM) --- */}
                {activeTab === 'info' && (
                    <>
                        {/* Tags Info */}
                        <div className="mb-6">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                <Tag className="h-3 w-3" /> Etiquetas
                            </label>

                            {/* Tags List */}
                            <div className="flex flex-wrap gap-2 mb-3">
                                {contact.tags?.map((tagName: string) => {
                                    // Find standard tag color if exists
                                    const standardTag = availableTags.find(t => t.name === tagName)
                                    const colorMap: any = {
                                        violet: 'bg-violet-500/20 text-violet-300',
                                        blue: 'bg-blue-500/20 text-blue-300',
                                        green: 'bg-green-500/20 text-green-300',
                                        amber: 'bg-amber-500/20 text-amber-300',
                                        red: 'bg-red-500/20 text-red-300',
                                        pink: 'bg-pink-500/20 text-pink-300',
                                        cyan: 'bg-cyan-500/20 text-cyan-300',
                                    }
                                    const colorClass = standardTag ? colorMap[standardTag.color] : 'bg-slate-700 text-slate-300'

                                    return (
                                        <span key={tagName} className={cn("px-2 py-1 rounded text-xs flex items-center gap-1 group transition-colors", colorClass)}>
                                            {tagName}
                                            <button onClick={() => handleRemoveTag(tagName)} className="hover:text-white opacity-0 group-hover:opacity-100 transition-opacity">
                                                <X className="h-3 w-3" />
                                            </button>
                                        </span>
                                    )
                                })}
                                {(!contact.tags || contact.tags.length === 0) && <span className="text-slate-600 text-xs italic">Sem etiquetas</span>}
                            </div>

                            {/* Tag Input with Suggestions */}
                            <div className="relative">
                                <form onSubmit={handleAddTag} className="flex gap-2 relative z-20">
                                    <input
                                        value={newTag}
                                        onChange={e => setNewTag(e.target.value)}
                                        onFocus={() => setShowTagSuggestions(true)}
                                        // onBlur={() => setTimeout(() => setShowTagSuggestions(false), 200)} // Delay for click to register
                                        placeholder="Adicionar etiqueta..."
                                        className="flex-1 bg-slate-800 border-none rounded-lg px-3 py-2 text-xs text-white placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500 outline-none"
                                    />
                                    <button type="submit" className="bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-white">
                                        <Plus className="h-4 w-4" />
                                    </button>
                                </form>

                                {/* Suggestions Popover */}
                                {showTagSuggestions && newTag && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/10 rounded-lg shadow-xl overflow-hidden z-30 max-h-40 overflow-y-auto">
                                        {availableTags
                                            .filter(t => t.name.toLowerCase().includes(newTag.toLowerCase()) && !contact.tags?.includes(t.name))
                                            .map(tag => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => {
                                                        addTag(contact.id, tag.name)
                                                        setNewTag('')
                                                        setShowTagSuggestions(false)
                                                    }}
                                                    className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-white flex items-center gap-2"
                                                >
                                                    <div className={cn("w-2 h-2 rounded-full", `bg-${tag.color}-500`)} />
                                                    {tag.name}
                                                </button>
                                            ))
                                        }
                                        {/* Allow creating new tag on the fly? Probably yes for UX */}
                                        {!availableTags.some(t => t.name.toLowerCase() === newTag.toLowerCase()) && (
                                            <button
                                                onClick={handleAddTag} // Just adds string tag for now, or could create standard tag
                                                className="w-full text-left px-3 py-2 text-xs text-slate-400 hover:bg-white/5 hover:text-white italic border-t border-white/5"
                                            >
                                                Criar "{newTag}"
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
                        <div className="pt-4 border-t border-white/5">
                            <label className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1">
                                <AlertCircle className="h-3 w-3" /> Funil de Vendas
                            </label>

                            {/* Pipeline Selector (Optional, hardcoded select for now if multiple pipelines) */}
                            {/* Stage Selector */}
                            <select
                                className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
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
                        </div>
                    </>
                )}


                {/* --- TAB: NOTES --- */}
                {activeTab === 'notes' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddNote} className="space-y-2">
                            <textarea
                                value={newNote}
                                onChange={e => setNewNote(e.target.value)}
                                placeholder="Escreva uma observação interna..."
                                className="w-full bg-slate-800 border-none rounded-lg px-3 py-2 text-sm text-white placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500 outline-none min-h-[80px]"
                            />
                            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 py-2 rounded-lg text-xs font-bold text-white shadow-lg transition-colors">
                                Salvar Nota
                            </button>
                        </form>

                        <div className="space-y-3">
                            {notes.map(note => (
                                <div key={note.id} className="bg-slate-800/50 p-3 rounded-lg border border-white/5 text-sm">
                                    <p className="text-slate-300 whitespace-pre-wrap">{note.content}</p>
                                    <div className="mt-2 flex justify-between items-center text-[10px] text-slate-500">
                                        <span>{note.author?.name || 'Desconhecido'}</span>
                                        <span>{format(new Date(note.created_at), "dd/MM HH:mm", { locale: ptBR })}</span>
                                    </div>
                                </div>
                            ))}
                            {notes.length === 0 && <p className="text-center text-slate-600 text-xs py-4">Nenhuma nota registrada.</p>}
                        </div>
                    </div>
                )}


                {/* --- TAB: REMINDERS --- */}
                {activeTab === 'reminders' && (
                    <div className="space-y-4">
                        <form onSubmit={handleAddReminder} className="space-y-2 bg-slate-800/30 p-3 rounded-lg border border-white/5">
                            <input
                                value={newReminderTitle}
                                onChange={e => setNewReminderTitle(e.target.value)}
                                placeholder="O que lembrar?"
                                className="w-full bg-slate-900 border-none rounded px-3 py-2 text-sm text-white focus:ring-1 focus:ring-violet-500 outline-none"
                            />
                            <input
                                type="datetime-local"
                                value={newReminderDate}
                                onChange={e => setNewReminderDate(e.target.value)}
                                className="w-full bg-slate-900 border-none rounded px-3 py-2 text-sm text-slate-300 focus:ring-1 focus:ring-violet-500 outline-none"
                            />
                            <button type="submit" className="w-full bg-amber-600 hover:bg-amber-700 py-1.5 rounded text-xs font-bold text-black shadow transition-colors">
                                Agendar
                            </button>
                        </form>

                        <div className="space-y-2">
                            {reminders.map(rem => (
                                <div key={rem.id} className={cn("flex items-start gap-3 p-3 rounded-lg border transition-all", rem.completed ? "bg-green-900/10 border-green-500/20 opacity-60" : "bg-slate-800/50 border-white/5")}>
                                    <button onClick={() => handleToggleReminder(rem.id, rem.completed)} className="mt-0.5 text-slate-400 hover:text-green-500">
                                        {rem.completed ? <CheckCircle2 className="h-4 w-4 text-green-500" /> : <Circle className="h-4 w-4" />}
                                    </button>
                                    <div className="flex-1">
                                        <p className={cn("text-sm font-medium", rem.completed ? "text-slate-500 line-through" : "text-white")}>{rem.title}</p>
                                        <p className="text-[10px] text-amber-500/80 flex items-center gap-1 mt-1">
                                            <Clock className="h-3 w-3" /> {format(new Date(rem.due_at), "dd/MM/yy HH:mm", { locale: ptBR })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                            {reminders.length === 0 && <p className="text-center text-slate-600 text-xs py-4">Sem lembretes pendentes.</p>}
                        </div>
                    </div>
                )}

            </div>
        </div>
    )
}
