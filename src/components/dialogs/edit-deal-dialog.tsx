'use client'

import { useState } from 'react'
import { X, Loader2 } from 'lucide-react'
import { updateDeal } from '@/app/dashboard/kanban/actions'
import { toast } from 'sonner'

interface EditDealDialogProps {
    deal: any
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function EditDealDialog({ deal, open, onOpenChange }: EditDealDialogProps) {
    const [loading, setLoading] = useState(false)
    const [title, setTitle] = useState(deal.title)
    const [value, setValue] = useState(deal.value?.toString() || '0')
    const [status, setStatus] = useState(deal.status || 'open')

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        setLoading(true)

        const result = await updateDeal(deal.id, {
            title,
            value: parseFloat(value),
            status
        })

        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Negócio atualizado')
            onOpenChange(false)
        }
    }

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass p-6 rounded-2xl border border-white/5 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-white">Editar Negócio</h2>
                    <button onClick={() => onOpenChange(false)} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300">Título</label>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            placeholder="Nome do negócio"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Valor (R$)</label>
                        <input
                            type="number"
                            step="0.01"
                            value={value}
                            onChange={e => setValue(e.target.value)}
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            placeholder="0.00"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        >
                            <option value="open">Em Aberto</option>
                            <option value="won">Ganho</option>
                            <option value="lost">Perdido</option>
                        </select>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => onOpenChange(false)}
                            className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                            Salvar
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
