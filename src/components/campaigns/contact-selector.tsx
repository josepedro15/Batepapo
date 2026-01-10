'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Users, Check, ChevronDown, X, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Contact {
    id: string
    name: string
    phone: string
    avatar_url?: string | null
}

interface ContactSelectorProps {
    contacts: Contact[]
    selectedIds: string[]
    onChange: (ids: string[]) => void
    loading?: boolean
    onLoadMore?: () => void
    hasMore?: boolean
}

export function ContactSelector({
    contacts,
    selectedIds,
    onChange,
    loading = false,
    onLoadMore,
    hasMore = false
}: ContactSelectorProps) {
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Filter contacts by search
    const filteredContacts = contacts.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.phone.includes(search)
    )

    // Toggle contact selection
    const toggleContact = (id: string) => {
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(i => i !== id))
        } else {
            onChange([...selectedIds, id])
        }
    }

    // Select all visible contacts
    const selectAll = () => {
        const allIds = filteredContacts.map(c => c.id)
        const newSelection = new Set([...selectedIds, ...allIds])
        onChange(Array.from(newSelection))
    }

    // Deselect all
    const deselectAll = () => {
        onChange([])
    }

    // Get selected contacts for display
    const selectedContacts = contacts.filter(c => selectedIds.includes(c.id))

    // Handle scroll for infinite loading
    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const target = e.target as HTMLDivElement
        const bottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 100
        if (bottom && hasMore && !loading && onLoadMore) {
            onLoadMore()
        }
    }, [hasMore, loading, onLoadMore])

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    return (
        <div ref={containerRef} className="space-y-4">
            {/* Header with count */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                        <Users className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-foreground">Destinatários</h3>
                        <p className="text-sm text-muted-foreground">
                            {selectedIds.length === 0
                                ? 'Nenhum selecionado'
                                : `${selectedIds.length} contato${selectedIds.length > 1 ? 's' : ''} selecionado${selectedIds.length > 1 ? 's' : ''}`
                            }
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={selectAll}
                        className="text-xs text-primary hover:underline"
                    >
                        Selecionar todos
                    </button>
                    {selectedIds.length > 0 && (
                        <>
                            <span className="text-muted-foreground">•</span>
                            <button
                                type="button"
                                onClick={deselectAll}
                                className="text-xs text-destructive hover:underline"
                            >
                                Limpar
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* Dropdown trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-3 p-4 rounded-xl border transition-all",
                    isOpen
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/50 hover:border-primary/50"
                )}
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    {selectedIds.length === 0 ? (
                        <span className="text-muted-foreground">Clique para selecionar contatos...</span>
                    ) : (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                            {selectedContacts.slice(0, 5).map((contact) => (
                                <div
                                    key={contact.id}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-lg shrink-0"
                                >
                                    <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center text-xs font-medium text-primary">
                                        {contact.name.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-sm font-medium text-foreground">{contact.name}</span>
                                </div>
                            ))}
                            {selectedIds.length > 5 && (
                                <div className="px-3 py-1.5 bg-muted rounded-lg shrink-0">
                                    <span className="text-sm text-muted-foreground">+{selectedIds.length - 5} mais</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <ChevronDown className={cn(
                    "h-5 w-5 text-muted-foreground transition-transform shrink-0",
                    isOpen && "rotate-180"
                )} />
            </button>

            {/* Dropdown content */}
            {isOpen && (
                <div className="glass rounded-xl border border-border shadow-xl overflow-hidden">
                    {/* Search */}
                    <div className="p-3 border-b border-border">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Buscar contatos..."
                                className="w-full pl-10 pr-4 py-2.5 bg-muted/50 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Contacts list */}
                    <div
                        className="max-h-64 overflow-y-auto"
                        onScroll={handleScroll}
                    >
                        {filteredContacts.length === 0 ? (
                            <div className="p-6 text-center">
                                <p className="text-muted-foreground">
                                    {search ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-border/50">
                                {filteredContacts.map((contact) => {
                                    const isSelected = selectedIds.includes(contact.id)
                                    return (
                                        <button
                                            key={contact.id}
                                            type="button"
                                            onClick={() => toggleContact(contact.id)}
                                            className={cn(
                                                "w-full flex items-center gap-3 p-3 text-left transition-colors",
                                                isSelected
                                                    ? "bg-primary/5"
                                                    : "hover:bg-muted/50"
                                            )}
                                        >
                                            <div className={cn(
                                                "h-5 w-5 rounded border-2 flex items-center justify-center transition-colors",
                                                isSelected
                                                    ? "bg-primary border-primary"
                                                    : "border-border"
                                            )}>
                                                {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
                                            </div>

                                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                                                {contact.avatar_url ? (
                                                    <img
                                                        src={contact.avatar_url}
                                                        alt={contact.name}
                                                        className="h-10 w-10 rounded-full object-cover"
                                                    />
                                                ) : (
                                                    <span className="text-sm font-medium text-primary">
                                                        {contact.name.charAt(0).toUpperCase()}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-foreground truncate">{contact.name}</p>
                                                <p className="text-sm text-muted-foreground">{formatPhone(contact.phone)}</p>
                                            </div>
                                        </button>
                                    )
                                })}
                            </div>
                        )}

                        {/* Loading indicator */}
                        {loading && (
                            <div className="p-4 flex items-center justify-center">
                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-3 border-t border-border bg-muted/30">
                        <p className="text-xs text-muted-foreground text-center">
                            {filteredContacts.length} contato{filteredContacts.length !== 1 ? 's' : ''} encontrado{filteredContacts.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
            )}

            {/* Selected contacts chips (when dropdown is closed) */}
            {!isOpen && selectedIds.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedContacts.slice(0, 10).map((contact) => (
                        <div
                            key={contact.id}
                            className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-lg border border-border"
                        >
                            <span className="text-sm text-foreground">{contact.name}</span>
                            <button
                                type="button"
                                onClick={() => toggleContact(contact.id)}
                                className="text-muted-foreground hover:text-destructive"
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </div>
                    ))}
                    {selectedIds.length > 10 && (
                        <div className="px-3 py-1.5 bg-primary/10 rounded-lg">
                            <span className="text-sm text-primary font-medium">+{selectedIds.length - 10} mais</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// Helper to format phone number
function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 13) {
        return `+${cleaned.slice(0, 2)} (${cleaned.slice(2, 4)}) ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`
    }
    if (cleaned.length === 11) {
        return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`
    }
    return phone
}
