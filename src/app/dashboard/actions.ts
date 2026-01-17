'use server'

import { createClient } from '@/lib/supabase/server'

export async function getDashboardData() {
    const supabase = await createClient()

    // 1. Get user and organization
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const { data: member } = await supabase
        .from('organization_members')
        .select('organization_id, role')
        .eq('user_id', user.id)
        .single()

    if (!member) throw new Error('No organization found')
    const orgId = member.organization_id

    // 2. Get profile for greeting
    const { data: profile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user.id)
        .single()

    // Get connected WhatsApp instance
    const { data: whatsappInstance } = await supabase
        .from('whatsapp_instances')
        .select('status, phone_number')
        .eq('organization_id', orgId)
        .single()

    const connectedPhone = whatsappInstance?.status === 'connected' ? whatsappInstance?.phone_number : null

    // If no connected phone, return empty stats
    if (!connectedPhone) {
        return {
            userName: profile?.name || user.email?.split('@')[0] || 'Usuário',
            userRole: member.role,
            contactStats: { total: 0, active: 0, newThisWeek: 0 },
            dealStats: { totalValue: 0, count: 0, byStage: [] },
            messageStats: { today: 0, thisWeek: 0 },
            campaignStats: { total: 0, active: 0 },
            remindersToday: 0,
            whatsappStatus: whatsappInstance?.status || 'disconnected',
            whatsappPhone: null,
            teamMembers: 0
        }
    }

    // 3. Contact Stats - filter by connected_phone
    const { data: contacts } = await supabase
        .from('contacts')
        .select('id, status, created_at')
        .eq('organization_id', orgId)
        .eq('connected_phone', connectedPhone)

    const totalContacts = contacts?.length || 0
    const activeContacts = contacts?.filter(c => c.status === 'open').length || 0

    // New contacts this week (last 7 days)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const newContactsThisWeek = contacts?.filter(c =>
        new Date(c.created_at) >= weekAgo
    ).length || 0

    // 4. Deal Stats - filter by connected_phone
    const { data: deals } = await supabase
        .from('deals')
        .select('id, value, stage_id, created_at, stages(name, color, position)')
        .eq('organization_id', orgId)
        .eq('connected_phone', connectedPhone)

    const totalDealsValue = deals?.reduce((sum, d) => sum + (Number(d.value) || 0), 0) || 0
    const totalDeals = deals?.length || 0

    // Deals by stage
    const dealsByStage = deals?.reduce((acc: Record<string, { name: string, color: string, count: number, value: number, position: number }>, deal) => {
        const stage = deal.stages as unknown as { name: string, color: string, position: number } | null
        const stageName = stage?.name || 'Sem Estágio'
        const stageColor = stage?.color || 'gray'
        const stagePosition = stage?.position ?? 999

        if (!acc[stageName]) {
            acc[stageName] = { name: stageName, color: stageColor, count: 0, value: 0, position: stagePosition }
        }
        acc[stageName].count++
        acc[stageName].value += Number(deal.value) || 0
        return acc
    }, {}) || {}

    const dealsByStageArray = Object.values(dealsByStage).sort((a, b) => a.position - b.position)

    // 5. Message Stats - filter by connected_phone
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayISO = today.toISOString()

    const { count: messagesToday } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('connected_phone', connectedPhone)
        .gte('created_at', todayISO)

    const weekAgoISO = weekAgo.toISOString()
    const { count: messagesThisWeek } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('connected_phone', connectedPhone)
        .gte('created_at', weekAgoISO)

    // 6. Campaign Stats (campaigns don't have connected_phone, keep as is)
    const { data: campaigns } = await supabase
        .from('campaigns')
        .select('id, status')
        .eq('organization_id', orgId)

    const totalCampaigns = campaigns?.length || 0
    const activeCampaigns = campaigns?.filter(c => c.status === 'processing').length || 0

    // 7. Reminders due today
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)

    const { count: remindersToday } = await supabase
        .from('reminders')
        .select('*', { count: 'exact', head: true })
        .eq('completed', false)
        .gte('due_at', todayISO)
        .lt('due_at', tomorrow.toISOString())

    // 8. Team Members
    const { count: teamMembers } = await supabase
        .from('organization_members')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId)

    return {
        userName: profile?.name || user.email?.split('@')[0] || 'Usuário',
        userRole: member.role,
        contactStats: {
            total: totalContacts,
            active: activeContacts,
            newThisWeek: newContactsThisWeek
        },
        dealStats: {
            totalValue: totalDealsValue,
            count: totalDeals,
            byStage: dealsByStageArray
        },
        messageStats: {
            today: messagesToday || 0,
            thisWeek: messagesThisWeek || 0
        },
        campaignStats: {
            total: totalCampaigns,
            active: activeCampaigns
        },
        remindersToday: remindersToday || 0,
        whatsappStatus: whatsappInstance?.status || 'disconnected',
        whatsappPhone: whatsappInstance?.phone_number || null,
        teamMembers: teamMembers || 0
    }
}
