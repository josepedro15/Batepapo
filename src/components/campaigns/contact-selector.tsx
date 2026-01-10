'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Search, Users, Check, ChevronDown, X, Loader2, Tag, Layers, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Contact {
    id: string
    name: string
    phone: string
    avatar_url?: string | null
    tags?: string[] | null
    stage_id?: string | null
    stage_name?: string | null
}

export interface Tag {
    id: string
    name: string
    color: string
}

export interface Stage {
    id: string
    name: string
    color?: string | null
}

interface ContactSelectorProps {
    contacts: Contact[]
    selectedIds: string[]
    onChange: (ids: string[]) => void
    loading?: boolean
    onLoadMore?: () => void
    hasMore?: boolean
    tags?: Tag[]
    stages?: Stage[]
    onFilterChange?: (filters: { tagName?: string; stageId?: string }) => void
}

// Tag color mapping
const tagColors: Record<string, string> = {
    violet: 'bg-violet-500/20 text-violet-400 border-violet-500/30',
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    pink: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
    orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
}

export function ContactSelector({
    contacts,
    selectedIds,
    onChange,
    loading = false,
    onLoadMore,
    hasMore = false,
    tags = [],
    stages = [],
    onFilterChange
}: ContactSelectorProps) {
    const [search, setSearch] = useState('')
    const [isOpen, setIsOpen] = useState(false)
    const [showFilters, setShowFilters] = useState(false)
    const [selectedTag, setSelectedTag] = useState<string>('')
    const [selectedStage, setSelectedStage] = useState<string>('')
    const containerRef = useRef<HTMLDivElement>(null)

    // Apply filters when changed
    useEffect(() => {
        if (onFilterChange) {
            onFilterChange({
                tagName: selectedTag || undefined,
                stageId: selectedStage || undefined
            })
        }
    }, [selectedTag, selectedStage, onFilterChange])

    // Filter contacts by search (local filtering)
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

    // Clear filters
    const clearFilters = () => {
        setSelectedTag('')
        setSelectedStage('')
    }

    // Get selected contacts for display
    const selectedContacts = contacts.filter(c => selectedIds.includes(c.id))

    // Check if filters are active
    const hasActiveFilters = selectedTag || selectedStage

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

            {/* Filter Buttons */}
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setShowFilters(!showFilters)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all",
                        showFilters || hasActiveFilters
                            ? "bg-primary/10 text-primary border border-primary/20"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent"
                    )}
                >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {hasActiveFilters && (
                        <span className="h-5 w-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
                            {(selectedTag ? 1 : 0) + (selectedStage ? 1 : 0)}
                        </span>
                    )}
                </button>

                {hasActiveFilters && (
                    <button
                        type="button"
                        onClick={clearFilters}
                        className="text-xs text-muted-foreground hover:text-destructive"
                    >
                        Limpar filtros
                    </button>
                )}
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="glass p-4 rounded-xl border border-border space-y-4">
                    {/* Tag Filter */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Tag className="h-4 w-4 text-primary" />
                            Filtrar por Etiqueta
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedTag('')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                    !selectedTag
                                        ? "bg-primary text-primary-foreground border-primary"
                                        : "bg-muted/50 text-muted-foreground border-border hover:border-primary/50"
                                )}
                            >
                                Todas
                            </button>
                            {tags.map((tag) => (
                                <button
                                    key={tag.id}
                                    type="button"
                                    onClick={() => setSelectedTag(selectedTag === tag.name ? '' : tag.name)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                        selectedTag === tag.name
                                            ? "ring-2 ring-primary ring-offset-2 ring-offset-background"
                                            : "",
                                        tagColors[tag.color] || tagColors.violet
                                    )}
                                >
                                    {tag.name}
                                </button>
                            ))}
                            {tags.length === 0 && (
                                <span className="text-xs text-muted-foreground">Nenhuma etiqueta cadastrada</span>
                            )}
                        </div>
                    </div>

                    {/* Stage Filter */}
                    <div>
                        <label className="flex items-center gap-2 text-sm font-medium text-foreground mb-2">
                            <Layers className="h-4 w-4 text-accent" />
                            Filtrar por Estágio no CRM
                        </label>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSelectedStage('')}
                                className={cn(
                                    "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                    !selectedStage
                                        ? "bg-accent text-accent-foreground border-accent"
                                        : "bg-muted/50 text-muted-foreground border-border hover:border-accent/50"
                                )}
                            >
                                Todos
                            </button>
                            {stages.map((stage) => (
                                <button
                                    key={stage.id}
                                    type="button"
                                    onClick={() => setSelectedStage(selectedStage === stage.id ? '' : stage.id)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-medium transition-all border",
                                        selectedStage === stage.id
                                            ? "bg-accent text-accent-foreground border-accent"
                                            : "bg-muted/50 text-muted-foreground border-border hover:border-accent/50"
                                    )}
                                    style={stage.color ? {
                                        backgroundColor: `${stage.color}20`,
                                        borderColor: `${stage.color}50`,
                                        color: stage.color
                                    } : undefined}
                                >
                                    {stage.name}
                                </button>
                            ))}
                            {stages.length === 0 && (
                                <span className="text-xs text-muted-foreground">Nenhum estágio cadastrado</span>
                            )}
                        </div>
                    </div>
                </div>
            )}

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
                                    {search || hasActiveFilters ? 'Nenhum contato encontrado' : 'Nenhum contato disponível'}
                                </p>
                                {hasActiveFilters && (
                                    <button
                                        type="button"
                                        onClick={clearFilters}
                                        className="mt-2 text-xs text-primary hover:underline"
                                    >
                                        Limpar filtros
                                    </button>
                                )}
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
                                                <div className="flex items-center gap-2">
                                                    <p className="font-medium text-foreground truncate">{contact.name}</p>
                                                    {contact.stage_name && (
                                                        <span className="px-1.5 py-0.5 text-xs bg-accent/10 text-accent rounded">
                                                            {contact.stage_name}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm text-muted-foreground">{formatPhone(contact.phone)}</p>
                                                    {contact.tags && contact.tags.length > 0 && (
                                                        <div className="flex items-center gap-1">
                                                            {contact.tags.slice(0, 2).map((tag, idx) => (
                                                                <span
                                                                    key={idx}
                                                                    className="px-1.5 py-0.5 text-xs bg-primary/10 text-primary rounded"
                                                                >
                                                                    {tag}
                                                                </span>
                                                            ))}
                                                            {contact.tags.length > 2 && (
                                                                <span className="text-xs text-muted-foreground">
                                                                    +{contact.tags.length - 2}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
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
                            {hasActiveFilters && ' (filtrado)'}
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
