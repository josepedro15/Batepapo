'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createDeal } from '@/app/dashboard/kanban/create-deal-action'
import { toast } from 'sonner'

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

    if (!open) {
        return (
            <button
                onClick={() => setOpen(true)}
                className="bg-violet-600 hover:bg-violet-700 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-violet-500/20 transition-all flex items-center gap-2"
            >
                <Plus className="h-4 w-4" /> Novo Negócio
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass p-6 rounded-2xl border border-white/5 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Criar Negócio</h2>
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300">Título *</label>
                        <input
                            name="title"
                            placeholder="Ex: Venda de CRM Premium"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Valor (R$)</label>
                        <input
                            name="value"
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Contato *</label>
                        <select
                            name="contactId"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            required
                        >
                            <option value="">Selecione um contato</option>
                            {contacts?.map(c => (
                                <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Etapa *</label>
                        <select
                            name="stageId"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
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
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            {loading ? 'Criando...' : 'Criar Negócio'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
