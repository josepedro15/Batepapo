import { createClient } from '@/lib/supabase/server'
import { CreateContactDialog } from '@/components/dialogs/create-contact-dialog'
import { Users } from 'lucide-react'
import { ContactsView } from '@/components/contacts/contacts-view'

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

            <ContactsView initialContacts={contacts || []} />
        </div>
    )
}
