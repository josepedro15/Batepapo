'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { createContact } from '@/app/dashboard/contacts/create-contact-action'
import { toast } from 'sonner'

export function CreateContactDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await createContact(formData)
            toast.success('Contato criado com sucesso!')
            setOpen(false)
        } catch (error) {
            toast.error('Erro ao criar contato')
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
                <Plus className="h-4 w-4" /> Novo Contato
            </button>
        )
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass p-6 rounded-2xl border border-white/5 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Criar Contato</h2>
                    <button onClick={() => setOpen(false)} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-slate-300">Nome *</label>
                        <input
                            name="name"
                            placeholder="Ex: João Silva"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Telefone (WhatsApp) *</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="5511999999999"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                            required
                        />
                        <p className="text-xs text-slate-500 mt-1">Formato: DDI + DDD + Número sem espaços</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="contato@example.com"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-slate-300">Tags</label>
                        <input
                            name="tags"
                            placeholder="lead, whatsapp, vip"
                            className="w-full mt-2 bg-slate-900/50 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-violet-500 outline-none"
                        />
                        <p className="text-xs text-slate-500 mt-1">Separe por vírgulas</p>
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
                            {loading ? 'Criando...' : 'Criar Contato'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
