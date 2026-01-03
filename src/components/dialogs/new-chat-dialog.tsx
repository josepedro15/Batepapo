'use client'

import { useState, useEffect } from 'react'
import { X, MessageSquarePlus, Loader2, Search, User } from 'lucide-react'
import { toast } from 'sonner'

interface WhatsAppContact {
    id: string
    name: string
    phone: string
    profilePicUrl?: string
}

interface NewChatDialogProps {
    open: boolean
    onClose: () => void
    onChatCreated: (contactId: string) => void
    orgId: string
}

export function NewChatDialog({ open, onClose, onChatCreated, orgId }: NewChatDialogProps) {
    const [mode, setMode] = useState<'select' | 'manual'>('select')
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [contacts, setContacts] = useState<WhatsAppContact[]>([])
    const [loadingContacts, setLoadingContacts] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Fetch WhatsApp contacts on open
    useEffect(() => {
        if (!open) return

        setLoadingContacts(true)
        fetch('/api/whatsapp/contacts')
            .then(res => res.json())
            .then(data => {
                if (data.contacts) {
                    setContacts(data.contacts)
                }
            })
            .catch(err => {
                console.error('Failed to load contacts:', err)
            })
            .finally(() => setLoadingContacts(false))
    }, [open])

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

    const handleSelectContact = async (contact: WhatsAppContact) => {
        setIsLoading(true)
        try {
            const formattedPhone = contact.phone.startsWith('+') ? contact.phone : `+${contact.phone}`

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: contact.name,
                    phone: formattedPhone,
                    organization_id: orgId
                })
            })

            const data = await response.json()
            if (!response.ok) throw new Error(data.error || 'Erro ao criar contato')

            toast.success('Conversa iniciada!')
            onChatCreated(data.id)
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar contato')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmitManual = async (e: React.FormEvent) => {
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

    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    )

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl p-6 w-full max-w-md max-h-[80vh] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-violet-500/20 rounded-xl flex items-center justify-center">
                            <MessageSquarePlus className="h-5 w-5 text-violet-400" />
                        </div>
                        <h2 className="text-xl font-bold text-white">Nova Conversa</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Mode Tabs */}
                <div className="flex gap-2 mb-4">
                    <button
                        onClick={() => setMode('select')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'select' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Contatos WhatsApp
                    </button>
                    <button
                        onClick={() => setMode('manual')}
                        className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${mode === 'manual' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        Novo Número
                    </button>
                </div>

                {/* Contact Selection Mode */}
                {mode === 'select' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* Search */}
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Buscar contato..."
                                className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                            />
                        </div>

                        {/* Contacts List */}
                        <div className="flex-1 overflow-y-auto">
                            {loadingContacts ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
                                </div>
                            ) : filteredContacts.length === 0 ? (
                                <div className="text-center py-8 text-slate-500 text-sm">
                                    {contacts.length === 0 ? 'Nenhum contato encontrado' : 'Nenhum resultado para a busca'}
                                </div>
                            ) : (
                                <div className="space-y-1">
                                    {filteredContacts.map((contact) => (
                                        <button
                                            key={contact.id}
                                            onClick={() => handleSelectContact(contact)}
                                            disabled={isLoading}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors disabled:opacity-50"
                                        >
                                            <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
                                                {contact.profilePicUrl ? (
                                                    <img src={contact.profilePicUrl} alt="" className="h-full w-full object-cover" />
                                                ) : (
                                                    contact.name.charAt(0).toUpperCase()
                                                )}
                                            </div>
                                            <div className="flex-1 text-left">
                                                <p className="font-medium text-white truncate">{contact.name}</p>
                                                <p className="text-xs text-slate-500">+{contact.phone}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Manual Entry Mode */}
                {mode === 'manual' && (
                    <form onSubmit={handleSubmitManual} className="space-y-4">
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
                )}
            </div>
        </div>
    )
}
