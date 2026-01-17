'use client'

import { useState, useEffect, useCallback } from 'react'
import { Users, Search, Phone, Mail, UserCheck, UserX, Filter, Download, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { syncProfilePictures } from '@/app/dashboard/chat/actions'
import { getContactsPaginated, ContactsResult } from '@/app/dashboard/contacts/actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ImportContactsDialog } from '@/components/contacts/import-contacts-dialog'
import { cn } from '@/lib/utils'

type Contact = {
    id: string
    name: string
    phone: string
    email: string | null
    status: string | null
    avatar_url: string | null
    tags?: string[] | null
}

const PAGE_SIZE = 50

export function ContactsView({ initialData }: { initialData: ContactsResult }) {
    const [contacts, setContacts] = useState<Contact[]>(initialData.contacts)
    const [totalCount, setTotalCount] = useState(initialData.totalCount)
    const [activeCount, setActiveCount] = useState(initialData.activeCount)
    const [totalPages, setTotalPages] = useState(initialData.totalPages)
    const [currentPage, setCurrentPage] = useState(1)
    const [searchTerm, setSearchTerm] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

    const supabase = createClient()

    // Fetch contacts with pagination
    const fetchContacts = useCallback(async (page: number, search?: string) => {
        setIsLoading(true)
        try {
            const result = await getContactsPaginated(page, PAGE_SIZE, search)
            setContacts(result.contacts)
            setTotalCount(result.totalCount)
            setActiveCount(result.activeCount)
            setTotalPages(result.totalPages)
            setCurrentPage(result.page)
        } catch (error) {
            console.error('Error fetching contacts:', error)
            toast.error('Erro ao carregar contatos')
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Handle search with debounce
    const handleSearch = (value: string) => {
        setSearchTerm(value)

        if (searchTimeout) {
            clearTimeout(searchTimeout)
        }

        const timeout = setTimeout(() => {
            setCurrentPage(1)
            fetchContacts(1, value)
        }, 500)

        setSearchTimeout(timeout)
    }

    // Handle page change
    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages || isLoading) return
        fetchContacts(page, searchTerm)
    }

    // Realtime Updates
    useEffect(() => {
        const channel = supabase
            .channel('contacts_view_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'contacts'
            }, (payload) => {
                // Refresh current page on any change
                fetchContacts(currentPage, searchTerm)
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [currentPage, searchTerm])

    // Automatic Sync on Mount
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                console.log('🔄 Starting auto-sync of profile pictures for Contacts page...')
                await syncProfilePictures()
            } catch (err) {
                console.error('❌ Error calling syncProfilePictures:', err)
            }
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeout) {
                clearTimeout(searchTimeout)
            }
        }
    }, [searchTimeout])

    // Export Logic - exports all contacts (may need adjustment for large datasets)
    const handleExport = async () => {
        toast.info('Preparando exportação...')

        try {
            // Fetch all contacts for export
            let allContacts: Contact[] = []
            let page = 1
            let hasMore = true

            while (hasMore) {
                const result = await getContactsPaginated(page, 1000, searchTerm)
                allContacts = [...allContacts, ...result.contacts]
                hasMore = result.contacts.length === 1000
                page++
            }

            if (allContacts.length === 0) {
                toast.error('Nenhum contato para exportar')
                return
            }

            const headers = ['nome', 'numero', 'etiqueta', 'email', 'status']
            const csvRows = [headers.join(',')]

            for (const contact of allContacts) {
                const tags = contact.tags ? contact.tags.join(';') : ''
                const row = [
                    `"${contact.name || ''}"`,
                    `"${contact.phone || ''}"`,
                    `"${tags}"`,
                    `"${contact.email || ''}"`,
                    `"${contact.status || ''}"`
                ]
                csvRows.push(row.join(','))
            }

            const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n')
            const encodedUri = encodeURI(csvContent)
            const link = document.createElement("a")
            link.setAttribute("href", encodedUri)
            link.setAttribute("download", `contatos_export_${new Date().toISOString().split('T')[0]}.csv`)
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            toast.success(`${allContacts.length} contatos exportados!`)
        } catch (error) {
            console.error('Export error:', error)
            toast.error('Erro ao exportar contatos')
        }
    }

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | string)[] = []
        const maxVisible = 5

        if (totalPages <= maxVisible + 2) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)

            if (currentPage > 3) {
                pages.push('...')
            }

            const start = Math.max(2, currentPage - 1)
            const end = Math.min(totalPages - 1, currentPage + 1)

            for (let i = start; i <= end; i++) {
                pages.push(i)
            }

            if (currentPage < totalPages - 2) {
                pages.push('...')
            }

            pages.push(totalPages)
        }

        return pages
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Stats Cards */}
            <section>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-primary/20 transition-all duration-300">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                            <Users className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{totalCount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Total de Contatos</p>
                        </div>
                    </div>
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-success/20 transition-all duration-300">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20">
                            <UserCheck className="h-7 w-7 text-success" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{activeCount.toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Contatos Ativos</p>
                        </div>
                    </div>
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-border transition-all duration-300">
                        <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center border border-border">
                            <UserX className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{(totalCount - activeCount).toLocaleString()}</p>
                            <p className="text-sm text-muted-foreground">Inativos</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Actions & Filters */}
            <section>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 w-full md:w-auto">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, telefone ou email..."
                            value={searchTerm}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl py-2.5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 hover:bg-muted/50"
                        />
                    </div>

                    <div className="flex items-center gap-2 w-full md:w-auto">
                        <ImportContactsDialog />

                        <button
                            onClick={handleExport}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground hover:bg-muted/50 transition-all duration-200"
                        >
                            <Download className="h-4 w-4" />
                            <span>Exportar</span>
                        </button>

                        <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-muted/30 border border-border rounded-lg text-foreground hover:bg-muted/50 transition-all duration-200">
                            <Filter className="h-4 w-4" />
                            <span>Filtros</span>
                        </button>
                    </div>
                </div>
            </section>

            {/* Contacts Table */}
            <section>
                <div className="glass rounded-2xl overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-muted/30 border-b border-border">
                            <tr>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Contato</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden md:table-cell">Telefone</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden lg:table-cell">Email</th>
                                <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                                        <p className="text-muted-foreground mt-2">Carregando contatos...</p>
                                    </td>
                                </tr>
                            ) : contacts.length > 0 ? (
                                contacts.map((contact) => (
                                    <tr
                                        key={contact.id}
                                        className="hover:bg-muted/20 transition-all duration-200 group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent/60 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 overflow-hidden">
                                                    {contact.avatar_url ? (
                                                        <img src={contact.avatar_url} alt={contact.name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        contact.name?.charAt(0)?.toUpperCase() || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-medium text-foreground group-hover:text-primary transition-colors duration-200">{contact.name}</p>
                                                    <p className="text-xs text-muted-foreground md:hidden">{contact.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden md:table-cell">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Phone className="h-4 w-4" />
                                                <span className="font-mono text-sm">{contact.phone}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 hidden lg:table-cell">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Mail className="h-4 w-4" />
                                                <span>{contact.email || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${contact.status === 'open'
                                                ? 'bg-success/10 text-success border border-success/20'
                                                : 'bg-muted text-muted-foreground border border-border'
                                                }`}>
                                                {contact.status === 'open' ? 'Ativo' : 'Inativo'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Users className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-muted-foreground font-medium text-lg">
                                            {searchTerm ? 'Nenhum contato encontrado' : 'Nenhum contato cadastrado'}
                                        </p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">
                                            {searchTerm ? 'Tente buscar com outros termos' : 'Adicione seu primeiro contato para começar'}
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-between px-6 py-4 border-t border-border bg-muted/20">
                            <div className="text-sm text-muted-foreground">
                                Mostrando <span className="font-medium text-foreground">{((currentPage - 1) * PAGE_SIZE) + 1}</span> a{' '}
                                <span className="font-medium text-foreground">{Math.min(currentPage * PAGE_SIZE, totalCount)}</span> de{' '}
                                <span className="font-medium text-foreground">{totalCount.toLocaleString()}</span> contatos
                            </div>

                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => goToPage(currentPage - 1)}
                                    disabled={currentPage === 1 || isLoading}
                                    className={cn(
                                        "p-2 rounded-lg transition-all duration-200",
                                        currentPage === 1 || isLoading
                                            ? "text-muted-foreground/50 cursor-not-allowed"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                {getPageNumbers().map((page, index) => (
                                    typeof page === 'number' ? (
                                        <button
                                            key={index}
                                            onClick={() => goToPage(page)}
                                            disabled={isLoading}
                                            className={cn(
                                                "min-w-[40px] h-10 rounded-lg text-sm font-medium transition-all duration-200",
                                                page === currentPage
                                                    ? "bg-primary text-primary-foreground"
                                                    : "text-foreground hover:bg-muted"
                                            )}
                                        >
                                            {page}
                                        </button>
                                    ) : (
                                        <span key={index} className="px-2 text-muted-foreground">
                                            {page}
                                        </span>
                                    )
                                ))}

                                <button
                                    onClick={() => goToPage(currentPage + 1)}
                                    disabled={currentPage === totalPages || isLoading}
                                    className={cn(
                                        "p-2 rounded-lg transition-all duration-200",
                                        currentPage === totalPages || isLoading
                                            ? "text-muted-foreground/50 cursor-not-allowed"
                                            : "text-foreground hover:bg-muted"
                                    )}
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </div>
    )
}
