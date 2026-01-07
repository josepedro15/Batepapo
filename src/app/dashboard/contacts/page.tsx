import { createClient } from '@/lib/supabase/server'
import { CreateContactDialog } from '@/components/dialogs/create-contact-dialog'
import { Users, Search, Phone, Mail, UserCheck, UserX, Filter, Sparkles } from 'lucide-react'

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
        <div className="min-h-[calc(100vh-6rem)] space-y-8">
            {/* Header com gradiente decorativo */}
            <div className="relative overflow-hidden rounded-2xl glass-heavy p-8">
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Users className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-display text-foreground">Contatos</h1>
                            <p className="text-muted-foreground mt-1">Gerencie sua base de leads e clientes.</p>
                        </div>
                    </div>
                    <CreateContactDialog />
                </div>
            </div>

            {/* Stats Cards */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-primary/20 transition-all duration-300 animate-slide-up" style={{ animationDelay: '150ms' }}>
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                            <Users className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{totalCount}</p>
                            <p className="text-sm text-muted-foreground">Total de Contatos</p>
                        </div>
                    </div>
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-success/20 transition-all duration-300 animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20">
                            <UserCheck className="h-7 w-7 text-success" />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-foreground">{activeCount}</p>
                            <p className="text-sm text-muted-foreground">Contatos Ativos</p>
                        </div>
                    </div>
                    <div className="glass p-5 rounded-2xl flex items-center gap-4 hover:border-border transition-all duration-300 animate-slide-up" style={{ animationDelay: '250ms' }}>
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

            {/* Search & Filters */}
            <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nome, telefone ou email..."
                            className="w-full bg-muted/30 border border-border rounded-xl py-3.5 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 hover:bg-muted/50"
                        />
                    </div>
                    <button className="flex items-center justify-center gap-2 px-5 py-3.5 bg-muted/30 border border-border rounded-xl text-foreground hover:bg-muted/50 transition-all duration-200">
                        <Filter className="h-5 w-5" />
                        <span className="font-medium">Filtros</span>
                    </button>
                </div>
            </section>

            {/* Contacts Table */}
            <section className="animate-fade-in" style={{ animationDelay: '350ms' }}>
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
                            {contacts?.map((contact, index) => (
                                <tr 
                                    key={contact.id} 
                                    className="hover:bg-muted/20 transition-all duration-200 group"
                                    style={{ animationDelay: `${400 + index * 30}ms` }}
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent/60 flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20">
                                                {contact.name?.charAt(0)?.toUpperCase() || '?'}
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
                            {contacts?.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-20 text-center">
                                        <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                            <Users className="h-8 w-8 text-muted-foreground/50" />
                                        </div>
                                        <p className="text-muted-foreground font-medium text-lg">Nenhum contato cadastrado</p>
                                        <p className="text-sm text-muted-foreground/70 mt-1">Adicione seu primeiro contato para começar</p>
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
