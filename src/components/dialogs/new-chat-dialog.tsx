'use client'

import { useState } from 'react'
import { X, MessageSquarePlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface NewChatDialogProps {
    open: boolean
    onClose: () => void
    onChatCreated: (contactId: string) => void
    orgId: string
}

export function NewChatDialog({ open, onClose, onChatCreated, orgId }: NewChatDialogProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    if (!open) return null

    const formatPhone = (value: string) => {
        const digits = value.replace(/\D/g, '')
        if (digits.length <= 2) return digits
        if (digits.length <= 4) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
        if (digits.length <= 9) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
        return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
    }

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setPhone(formatPhone(e.target.value))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        const phoneDigits = phone.replace(/\D/g, '')
        if (phoneDigits.length < 10) {
            toast.error('Telefone inválido')
            return
        }
        if (!name.trim()) {
            toast.error('Nome é obrigatório')
            return
        }

        setIsLoading(true)
        try {
            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: name.trim(),
                    phone: `+55${phoneDigits}`,
                    organization_id: orgId
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Erro ao criar contato')

            toast.success('Conversa iniciada!')
            onChatCreated(data.id)
            onClose()
            setName('')
            setPhone('')
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar contato')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                            <MessageSquarePlus className="h-5 w-5 text-violet-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Nova Conversa</h2>
                            <p className="text-xs text-slate-400">Digite o número do WhatsApp</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Nome do Contato
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="João Silva"
                            className="w-full bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                            Telefone (WhatsApp)
                        </label>
                        <div className="flex gap-2">
                            <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white">
                                +55
                            </div>
                            <input
                                type="tel"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder="(11) 99999-9999"
                                className="flex-1 bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white py-3 rounded-xl font-bold transition-colors flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <>
                                <MessageSquarePlus className="h-5 w-5" />
                                Iniciar Conversa
                            </>
                        )}
                    </button>
                </form>

                <p className="text-center text-xs text-slate-500 mt-4">
                    💡 Conversas recebidas aparecem automaticamente na lista
                </p>
            </div>
        </div>
    )
}
