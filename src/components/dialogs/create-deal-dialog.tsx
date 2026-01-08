'use client'

import { useState } from 'react'
import { Plus, X, Briefcase } from 'lucide-react'
import { createDeal } from '@/app/dashboard/kanban/create-deal-action'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'

export function CreateDealDialog({ stages, contacts }: { stages: any[], contacts: any[] }) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await createDeal(formData)
            toast.success('Negócio criado com sucesso!')
            setOpen(false)
        } catch (error) {
            toast.error('Erro ao criar negociação')
        } finally {
            setLoading(false)
        }
    }

    const modalContent = open ? (
        <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={() => setOpen(false)}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            
            {/* Modal */}
            <div 
                className="relative bg-card border border-border/50 p-6 rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center">
                            <Briefcase className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Criar Negócio</h2>
                    </div>
                    <button 
                        onClick={() => setOpen(false)} 
                        className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Título *</label>
                        <input
                            name="title"
                            placeholder="Ex: Venda de CRM Premium"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Valor (R$)</label>
                        <input
                            name="value"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Contato *</label>
                        <select
                            name="contactId"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            required
                        >
                            <option value="">Selecione um contato</option>
                            {contacts?.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-muted-foreground">Etapa *</label>
                        <select
                            name="stageId"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            required
                        >
                            {stages?.map(s => (
                                <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-bold py-3 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-primary-foreground font-bold py-3 rounded-xl transition-all shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Criando...' : 'Criar Negócio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    ) : null

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-4 py-2 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center gap-2"
            >
                <Plus className="h-4 w-4" /> Novo Negócio
            </button>
            
            {typeof window !== 'undefined' && modalContent && createPortal(modalContent, document.body)}
        </>
    )
}
