import { createClient } from "@/lib/supabase/server"
import QuickMessagesPage from "./quick-messages-client"
import { getQuickMessages } from "./actions"

export default async function Page() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Get organization for the current user
    // This logic assumes we can get the org from the session or first org
    // For now reusing the common pattern of getting the first org they are member of if not in params
    // But since this is a dashboard page, we probably look at cookies or session context. 
    // In this codebase, usually orgId is passed or inferred.

    // To match other pages, we'll fetch the user's primary org
    const { data: membership } = await supabase
        .from('organization_members')
        .select('organization_id')
        .eq('user_id', user?.id)
        .single()

    const orgId = membership?.organization_id

    if (!orgId) {
        return <div>Organização não encontrada</div>
    }

    const messages = await getQuickMessages(orgId)

    return <QuickMessagesPage initialMessages={messages || []} orgId={orgId} />
}
