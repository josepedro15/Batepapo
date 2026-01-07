import { createClient } from "@/lib/supabase/server"
import { SidebarClient } from "./sidebar-client"

export async function Sidebar() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Fetch super admin status
    const { data: profile } = await supabase
        .from('profiles')
        .select('is_super_admin')
        .eq('id', user?.id || '')
        .single()

    const isSuperAdmin = profile?.is_super_admin || false

    // Fetch user's organizations
    const { data: organizations } = await supabase
        .from('organization_members')
        .select('organization_id, role, organizations(name)')
        .eq('user_id', user?.id || '')

    // Get current org (from localStorage will be handled client-side, default to first)
    const currentOrgId = organizations?.[0]?.organization_id || ''

    return (
        <SidebarClient
            organizations={organizations || []}
            currentOrgId={currentOrgId}
            isSuperAdmin={isSuperAdmin}
        />
    )
}
