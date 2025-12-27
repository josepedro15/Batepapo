import { createClient } from "@/lib/supabase/server"
import { SidebarClient } from "./sidebar-client"

export async function Sidebar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch user's organizations
    const { data: organizations } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(name)')
        .eq('user_id', user?.id || '')

    // Get current org (from localStorage will be handled client-side, default to first)
    const currentOrgId = organizations?.[0]?.organization_id || ''

    return (
        <SidebarClient organizations={organizations || []} currentOrgId={currentOrgId} />
    )
}
