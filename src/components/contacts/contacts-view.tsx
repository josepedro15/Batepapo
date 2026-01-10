import { useState, useEffect } from 'react'
import { Users, Search, Phone, Mail, UserCheck, UserX, Filter, Download } from 'lucide-react'
import { syncProfilePictures } from '@/app/dashboard/chat/actions'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ImportContactsDialog } from '@/components/contacts/import-contacts-dialog'

type Contact = {
    id: string
    name: string
    phone: string
    email: string | null
    status: string | null
    avatar_url: string | null
    tags?: string[] | null
    // Add other fields if necessary
}

export function ContactsView({ initialContacts }: { initialContacts: Contact[] }) {
    const [contacts, setContacts] = useState<Contact[]>(initialContacts)
    const [searchTerm, setSearchTerm] = useState('')

    const supabase = createClient()

    // Realtime Updates
    useEffect(() => {
        const channel = supabase
            .channel('contacts_view_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'contacts'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setContacts(prev => [payload.new as Contact, ...prev])
                } else if (payload.eventType === 'UPDATE') {
                    setContacts(prev => prev.map(c => c.id === payload.new.id ? payload.new as Contact : c))
                } else if (payload.eventType === 'DELETE') {
                    setContacts(prev => prev.filter(c => c.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Automatic Sync on Mount (similar to ChatInterface)
    useEffect(() => {
        const timer = setTimeout(async () => {
            try {
                // We don't want to spam toast here, just do it silently or with debug logs
                console.log('🔄 Starting auto-sync of profile pictures for Contacts page...')
                await syncProfilePictures()
            } catch (err) {
                console.error('❌ Error calling syncProfilePictures:', err)
            }
        }, 1000)
        return () => clearTimeout(timer)
    }, [])

    // Export Logic
    const handleExport = () => {
        if (contacts.length === 0) {
            toast.error('Nenhum contato para exportar')
            return
        }

        const headers = ['nome', 'numero', 'etiqueta', 'email', 'status']
        const csvRows = [headers.join(',')]

        for (const contact of contacts) {
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
        toast.success('Download iniciado!')
    }

    // Filter Logic
    const filteredContacts = contacts.filter(contact => {
        const lowerSearch = searchTerm.toLowerCase()
        return (
            contact.name?.toLowerCase().includes(lowerSearch) ||
            contact.phone?.toLowerCase().includes(lowerSearch) ||
            contact.email?.toLowerCase().includes(lowerSearch)
        )
    })

    const activeCount = contacts.filter(c => c.status === 'open').length
    const totalCount = contacts.length

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
                            <p className="text-3xl font-bold text-foreground">{totalCount}</p>
                            <p className="text-sm text-muted-foreground">Total de Contatos</p>
                        </div>
                    </div>
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-success/20 transition-all duration-300">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20">
                            <UserCheck className="h-7 w-7 text-success" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{activeCount}</p>
                            <p className="text-sm text-muted-foreground">Contatos Ativos</p>
                        </div>
                    </div>
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-border transition-all duration-300">
                        <div className="h-14 w-14 rounded-xl bg-muted/50 flex items-center justify-center border border-border">
                            <UserX className="h-7 w-7 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{totalCount - activeCount}</p>
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
                            onChange={(e) => setSearchTerm(e.target.value)}
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
                            {filteredContacts.map((contact, index) => (
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
                            ))}
                            {filteredContacts.length === 0 && (
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
                </div>
            </section>
        </div>
    )
}
