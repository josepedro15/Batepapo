import { createClient } from '@/lib/supabase/server'
import { CreateContactDialog } from '@/components/dialogs/create-contact-dialog'
import { Users, Search, Phone, Mail, UserCheck, UserX, Filter } from 'lucide-react'

export default async function ContactsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user.id)
        .single()

    const { data: contacts } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', member?.organization_id)
        .order('created_at', { ascending: false })

    const activeCount = contacts?.filter(c => c.status === 'open').length || 0
    const totalCount = contacts?.length || 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-display text-foreground">Contatos</h1>
                    <p className="text-muted-foreground mt-1">Gerencie sua base de leads e clientes.</p>
                </div>
                <CreateContactDialog />
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="glass p-4 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{totalCount}</p>
                        <p className="text-sm text-muted-foreground">Total de Contatos</p>
                    </div>
                </div>
                <div className="glass p-4 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center">
                        <UserCheck className="h-6 w-6 text-success" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{activeCount}</p>
                        <p className="text-sm text-muted-foreground">Contatos Ativos</p>
                    </div>
                </div>
                <div className="glass p-4 rounded-xl flex items-center gap-4">
                    <div className="h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                        <UserX className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="text-2xl font-bold text-foreground">{totalCount - activeCount}</p>
                        <p className="text-sm text-muted-foreground">Inativos</p>
                    </div>
                </div>
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, telefone ou email..."
                        className="w-full bg-muted/50 border border-border rounded-xl py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    />
                </div>
                <button className="flex items-center gap-2 px-4 py-3 bg-muted/50 border border-border rounded-xl text-foreground hover:bg-muted transition-colors">
                    <Filter className="h-5 w-5" />
                    <span>Filtros</span>
                </button>
            </div>

            {/* Contacts Table */}
            <div className="glass rounded-2xl overflow-hidden">
                <table className="w-full">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Contato</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden md:table-cell">Telefone</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground hidden lg:table-cell">Email</th>
                            <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {contacts?.map((contact) => (
                            <tr key={contact.id} className="hover:bg-muted/30 transition-colors group">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                                            {contact.name?.charAt(0) || '?'}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{contact.name}</p>
                                            <p className="text-xs text-muted-foreground md:hidden">{contact.phone}</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Phone className="h-4 w-4" />
                                        <span>{contact.phone}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell">
                                    <div className="flex items-center gap-2 text-muted-foreground">
                                        <Mail className="h-4 w-4" />
                                        <span>{contact.email || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${contact.status === 'open'
                                            ? 'bg-success/10 text-success border border-success/20'
                                            : 'bg-muted text-muted-foreground border border-border'
                                        }`}>
                                        {contact.status === 'open' ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                        {contacts?.length === 0 && (
                            <tr>
                                <td colSpan={4} className="px-6 py-16 text-center">
                                    <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
                                    <p className="text-muted-foreground font-medium">Nenhum contato cadastrado</p>
                                    <p className="text-sm text-muted-foreground/70 mt-1">Adicione seu primeiro contato para começar</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
