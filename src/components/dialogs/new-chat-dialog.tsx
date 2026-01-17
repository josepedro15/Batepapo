'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { X, MessageSquarePlus, Loader2, Search, User, Phone } from 'lucide-react'
import { toast } from 'sonner'
import { useInView } from 'react-intersection-observer'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { debounce } from 'lodash'

interface NewChatDialogProps {
    open: boolean
    onClose: () => void
    onChatCreated: (contactId: string) => void
    orgId: string
}

interface WhatsAppContact {
    id: string
    name: string
    phone: string
    profilePicUrl?: string
    avatar_url?: string // Add avatar_url to match API response
}

export function NewChatDialog({ open, onClose, onChatCreated, orgId }: NewChatDialogProps) {
    const [name, setName] = useState('')
    const [phone, setPhone] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [contacts, setContacts] = useState<WhatsAppContact[]>([])
    const [isLoadingContacts, setIsLoadingContacts] = useState(false)
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const [hasMore, setHasMore] = useState(true)
    const { ref, inView } = useInView()
    const contactsRef = useRef<WhatsAppContact[]>([]) // Ref to access current contacts in async function
    const isLoadingContactsRef = useRef(false)
    const hasMoreRef = useRef(true)

    // Keep refs in sync with state
    useEffect(() => {
        contactsRef.current = contacts
    }, [contacts])

    useEffect(() => {
        hasMoreRef.current = hasMore
    }, [hasMore])

    const fetchContacts = useCallback(async (pageNum: number, searchTerm: string, reset: boolean = false) => {
        // Prevent duplicate requests for the same page/search combo
        if (!reset && (isLoadingContactsRef.current || !hasMoreRef.current)) return

        try {
            isLoadingContactsRef.current = true
            setIsLoadingContacts(true)

            // Calculate query params
            const params = new URLSearchParams({
                organization_id: orgId,
                page: pageNum.toString(),
                pageSize: '20',
                search: searchTerm
            })

            const response = await fetch(`/api/contacts?${params.toString()}`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            })

            const data = await response.json()

            if (response.ok) {
                if (reset) {
                    setContacts(data.contacts)
                    const hasMoreData = data.contacts.length >= 20
                    setHasMore(hasMoreData)
                    hasMoreRef.current = hasMoreData
                } else {
                    setContacts(prev => {
                        // Create a map of existing IDs for faster lookup
                        const existingIds = new Set(prev.map(c => c.id))
                        const newContacts = data.contacts.filter((c: WhatsAppContact) => !existingIds.has(c.id))

                        return [...prev, ...newContacts]
                    })

                    // Only stop if we got fewer results than requested
                    const hasMoreData = data.contacts.length >= 20
                    setHasMore(hasMoreData)
                    hasMoreRef.current = hasMoreData
                }
            } else {
                const errorData = await response.json().catch(() => ({}))
                console.error('Contact fetch error:', errorData)

                if (pageNum === 1) {
                    setContacts([])
                    if (errorData.error) {
                        toast.error(`Erro ao carregar contatos: ${errorData.error}`)
                    }
                }
                setHasMore(false)
                hasMoreRef.current = false
            }
        } catch (error) {
            console.error('Error fetching contacts:', error)
            setHasMore(false)
            hasMoreRef.current = false
        } finally {
            setIsLoadingContacts(false)
            isLoadingContactsRef.current = false
        }
    }, [orgId])

    // Debounced search
    const debouncedSearch = useCallback(
        debounce((term: string) => {
            setPage(1)
            fetchContacts(1, term, true)
        }, 500),
        [fetchContacts]
    )

    useEffect(() => {
        if (open) {
            // Reset state when opening
            setPage(1)
            setSearch('')
            setName('')
            setPhone('')
            setContacts([])
            setHasMore(true)
            hasMoreRef.current = true
            isLoadingContactsRef.current = false
            // Initial fetch
            fetchContacts(1, '', true)
        }
    }, [open, fetchContacts])

    useEffect(() => {
        if (inView && hasMore && !isLoadingContacts) {
            const nextPage = page + 1
            setPage(nextPage)
            fetchContacts(nextPage, search)
        }
    }, [inView, hasMore, isLoadingContacts, search, fetchContacts])

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value
        setSearch(value)
        debouncedSearch(value)
    }

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

    const createContactAndChat = async (contactName: string, contactPhone: string) => {
        setIsLoading(true)
        try {
            const phoneDigits = contactPhone.replace(/\D/g, '')
            const formattedPhone = phoneDigits.startsWith('55') ? `+${phoneDigits}` : `+55${phoneDigits}`

            const response = await fetch('/api/contacts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: contactName.trim(),
                    phone: formattedPhone,
                    organization_id: orgId
                })
            })

            const data = await response.json()
            if (!response.ok) {
                // If contact already exists, it returns the ID, so we can proceed
                if (data.id && data.message === 'Contato já existe') {
                    onChatCreated(data.id)
                    onClose()
                    return
                }
                throw new Error(data.error || 'Erro ao criar contato')
            }

            toast.success('Conversa iniciada!')
            onChatCreated(data.id)
            onClose()
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao criar contato')
        } finally {
            setIsLoading(false)
        }
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

        await createContactAndChat(name, phoneDigits)
    }

    const handleContactSelect = async (contact: WhatsAppContact) => {
        await createContactAndChat(contact.name, contact.phone)
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-white/10 rounded-2xl w-full max-w-2xl flex max-h-[85vh] overflow-hidden">
                {/* Left Side: Contact List */}
                <div className="w-1/2 border-r border-white/10 flex flex-col bg-slate-950/50">
                    <div className="p-4 border-b border-white/10">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3">Meus Contatos</h3>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <input
                                type="text"
                                placeholder="Buscar contato..."
                                value={search}
                                onChange={handleSearchChange}
                                className="w-full bg-slate-900 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                            />
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        {isLoadingContacts ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
                            </div>
                        ) : contacts.length > 0 ? (
                            <>
                                {contacts.map((contact) => (
                                    <button
                                        type="button"
                                        key={contact.id}
                                        onClick={() => handleContactSelect(contact)}
                                        disabled={isLoading}
                                        className="w-full flex items-center gap-3 p-3 hover:bg-white/5 rounded-lg transition-colors text-left group"
                                    >
                                        <Avatar className="h-10 w-10 border border-white/10">
                                            <AvatarImage src={contact.avatar_url || contact.profilePicUrl} />
                                            <AvatarFallback className="bg-slate-800 text-slate-400">
                                                <User className="h-5 w-5" />
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-medium text-slate-200 truncate group-hover:text-white transition-colors">
                                                {contact.name}
                                            </p>
                                            <p className="text-xs text-slate-500 truncate">
                                                {contact.phone}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                                {/* Infinite scroll trigger */}
                                {hasMore && <div ref={ref} className="h-4" />}
                            </>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                                <Search className="h-8 w-8 mb-2 opacity-50" />
                                <p className="text-sm">Nenhum contato encontrado</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Manual Entry */}
                <div className="w-1/2 p-6 flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-xl font-bold text-white">Nova Conversa</h2>
                            <p className="text-xs text-slate-400">Ou digite um número manualmente</p>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-4 flex-1">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nome do Contato
                            </label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="João Silva"
                                    className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Telefone (WhatsApp)
                            </label>
                            <div className="flex gap-2">
                                <div className="bg-slate-800 border border-white/10 rounded-xl px-4 py-3 text-white flex items-center justify-center min-w-[3.5rem]">
                                    +55
                                </div>
                                <div className="relative flex-1">
                                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                                    <input
                                        type="tel"
                                        value={phone}
                                        onChange={handlePhoneChange}
                                        placeholder="(11) 99999-9999"
                                        className="w-full bg-slate-800 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-4">
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
                        </div>
                    </form>

                    <p className="text-center text-xs text-slate-500 mt-auto pt-4">
                        💡 Contatos importados aparecem na lista à esquerda
                    </p>
                </div>
            </div>
        </div>
    )
}

