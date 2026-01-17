import { getChatData } from './actions'
import { ChatInterface } from '@/components/chat/chat-interface'
import { createClient } from '@/lib/supabase/server'

export default async function ChatPage() {
    const { myChats, awaitingChats, allChats, finishedChats, currentUserId, orgId, userRole } = await getChatData()

    // Fetch org members for transfer dialog
    const supabase = await createClient()
    const { data: members } = await supabase
        .from('organization_members')
        .select('user_id, role, profiles(name)')
        .eq('organization_id', orgId)
        .neq('user_id', currentUserId)

    // Fetch current user's profile name
    const { data: userProfile } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', currentUserId)
        .single()

    // Fetch org settings for show_attendant_name
    const { data: orgSettings } = await supabase
        .from('organizations')
        .select('show_attendant_name')
        .eq('id', orgId)
        .single()

    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 overflow-hidden">
                <ChatInterface
                    initialMyChats={myChats || []}
                    initialAwaitingChats={awaitingChats || []}
                    initialAllChats={allChats || []}
                    initialFinishedChats={finishedChats || []}
                    currentUserId={currentUserId}
                    orgId={orgId}
                    userRole={userRole || 'attendant'}
                    members={members || []}
                    attendantName={userProfile?.name || 'Atendente'}
                    showAttendantName={orgSettings?.show_attendant_name || false}
                />
            </div>
        </div>
    )
}
