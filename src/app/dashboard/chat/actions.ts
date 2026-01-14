'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'

export async function getChatData() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized - Please log in')

    // Get Org ID
    const { data: member } = await supabase.from('organization_members').select('organization_id, role').eq('user_id', user.id).single()
    const orgId = member?.organization_id
    const userRole = member?.role

    // 1. Fetch "My Chats" (Assigned to me)
    const { data: myChats } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId)
        .eq('owner_id', user.id)
        .neq('status', 'closed')
        .order('created_at', { ascending: false })

    // 2. Fetch "Awaiting" (Unassigned)
    const { data: awaitingChats } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId)
        .is('owner_id', null)
        .neq('status', 'closed')
        .order('created_at', { ascending: false })

    // 3. Fetch "All" (Only for managers/owners)
    let allChats: any[] = []
    if (userRole === 'owner' || userRole === 'manager') {
        const { data } = await supabase
            .from('contacts')
            .select('*')
            .eq('organization_id', orgId)
            .neq('status', 'closed')
            .order('created_at', { ascending: false })
        allChats = data || []
    }

    // 4. Fetch "Finished" (Closed chats)
    const { data: finishedChats } = await supabase
        .from('contacts')
        .select('*')
        .eq('organization_id', orgId)
        .eq('status', 'closed')
        .order('updated_at', { ascending: false })
        .limit(50) // Limit to avoid performance issues

    // Helper to add last_message, unread_count and sort by last message time
    const addLastMessagesAndUnread = async (contacts: any[] | null) => {
        if (!contacts || contacts.length === 0) return contacts

        const contactIds = contacts.map(c => c.id)

        // Fetch recent messages for these contacts (limited per contact for performance)
        // We fetch last 5 messages per contact to determine last_message and unread_count
        // This is more efficient than fetching ALL messages
        const { data: messages } = await supabase
            .from('messages')
            .select('contact_id, body, sender_type, media_type, created_at')
            .in('contact_id', contactIds)
            .order('created_at', { ascending: false })
            .limit(contactIds.length * 5) // Limit to ~5 messages per contact

        // Build maps for last message and unread count
        const lastMessageMap = new Map<string, {
            body: string | null,
            sender_type: string,
            media_type: string | null,
            created_at: string
        }>()
        const unreadCountMap = new Map<string, number>()

        messages?.forEach(msg => {
            // Track last message (only first occurrence per contact since sorted desc)
            if (!lastMessageMap.has(msg.contact_id)) {
                lastMessageMap.set(msg.contact_id, {
                    body: msg.body,
                    sender_type: msg.sender_type,
                    media_type: msg.media_type,
                    created_at: msg.created_at
                })
            }

            // Count unread messages from contacts (sender_type = 'contact')
            // We consider a message "unread" if it's from contact and not from user
            if (msg.sender_type === 'contact') {
                // Check if this message was sent after last user message to this contact
                const currentCount = unreadCountMap.get(msg.contact_id) || 0
                // For simplicity, count all contact messages after last user message
                // But to keep it simple, we'll count contact messages that are newer than the first user message we find
                const lastMsg = lastMessageMap.get(msg.contact_id)
                if (lastMsg && lastMsg.sender_type === 'contact') {
                    // Last message is from contact, so there are unread messages
                    unreadCountMap.set(msg.contact_id, currentCount + 1)
                }
            } else if (msg.sender_type === 'user') {
                // Once we hit a user message, stop counting for this contact
                // (messages are sorted desc, so user message = they've seen up to this point)
                if (!unreadCountMap.has(msg.contact_id)) {
                    unreadCountMap.set(msg.contact_id, 0)
                }
            }
        })

        // Recalculate unread: count contact messages until we find a user message
        const unreadCalculated = new Map<string, number>()
        const seenUserMessage = new Set<string>()

        messages?.forEach(msg => {
            if (seenUserMessage.has(msg.contact_id)) return

            if (msg.sender_type === 'user') {
                seenUserMessage.add(msg.contact_id)
                if (!unreadCalculated.has(msg.contact_id)) {
                    unreadCalculated.set(msg.contact_id, 0)
                }
            } else if (msg.sender_type === 'contact') {
                const current = unreadCalculated.get(msg.contact_id) || 0
                unreadCalculated.set(msg.contact_id, current + 1)
            }
        })

        // Merge into contacts
        const enrichedContacts = contacts.map(contact => {
            const lastMsg = lastMessageMap.get(contact.id)
            return {
                ...contact,
                last_message: lastMsg ? {
                    body: lastMsg.body,
                    sender_type: lastMsg.sender_type,
                    media_type: lastMsg.media_type
                } : null,
                last_message_at: lastMsg?.created_at || contact.created_at,
                unread_count: unreadCalculated.get(contact.id) || 0
            }
        })

        // Sort by last message time (most recent first)
        return enrichedContacts.sort((a, b) => {
            const timeA = new Date(a.last_message_at).getTime()
            const timeB = new Date(b.last_message_at).getTime()
            return timeB - timeA
        })
    }

    // Add last messages and unread counts to all contact lists
    const [myChatsWithMsg, awaitingChatsWithMsg, allChatsWithMsg, finishedChatsWithMsg] = await Promise.all([
        addLastMessagesAndUnread(myChats),
        addLastMessagesAndUnread(awaitingChats),
        addLastMessagesAndUnread(allChats),
        addLastMessagesAndUnread(finishedChats)
    ])

    return {
        myChats: myChatsWithMsg,
        awaitingChats: awaitingChatsWithMsg,
        allChats: allChatsWithMsg,
        finishedChats: finishedChatsWithMsg,
        currentUserId: user.id,
        orgId,
        userRole
    }
}

export async function getMessages(contactId: string, page: number = 0, limit: number = 25) {
    const supabase = await createClient()

    // Calculate range
    const from = page * limit
    const to = from + limit - 1

    const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false }) // Get newest first
        .range(from, to)

    // Return in chronological order (oldest first)
    return data?.reverse() || []
}

// New optimized function for polling - fetches only messages after a given timestamp
export async function getNewMessages(contactId: string, afterTimestamp: string) {
    const supabase = await createClient()

    const { data } = await supabase
        .from('messages')
        .select('*')
        .eq('contact_id', contactId)
        .gt('created_at', afterTimestamp) // Only get messages after this timestamp
        .order('created_at', { ascending: true }) // Already in chronological order
        .limit(50) // Safety limit

    return data || []
}

import * as uazapi from '@/lib/uazapi'

export async function sendMessage(contactId: string, body: string, orgId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // 1. Get contact details
    const { data: contact } = await supabase
        .from('contacts')
        .select('phone')
        .eq('id', contactId)
        .single()

    if (!contact) throw new Error('Contact not found')

    // 2. Check if organization has show_attendant_name enabled
    let messageBody = body
    const { data: org } = await supabase
        .from('organizations')
        .select('show_attendant_name')
        .eq('id', orgId)
        .single()

    if (org?.show_attendant_name) {
        // Fetch user's profile name
        const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .single()

        const attendantName = profile?.name || 'Atendente'
        messageBody = `*${attendantName}:*\n\n${body}`
    }

    // 3. Insert message with 'sending' status (store original body for display in UI)
    const { data: msg, error } = await supabase.from('messages').insert({
        organization_id: orgId,
        contact_id: contactId,
        sender_type: 'user',
        sender_id: user.id,
        body,
        status: 'sending'
    }).select('id').single()

    if (error) throw new Error(error.message)

    revalidatePath('/dashboard/chat')

    // 4. Send via UAZAPI (async, don't block UI but wait for success to update status)
    try {
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('instance_token, status')
            .eq('organization_id', orgId)
            .single()

        if (!instance || instance.status !== 'connected') {
            throw new Error('WhatsApp disconnected')
        }

        // Send text message with potentially prefixed name
        const response = await uazapi.sendTextMessage(
            instance.instance_token,
            contact.phone,
            messageBody
        )

        // Update status to 'sent' AND save whatsapp_id
        await supabase
            .from('messages')
            .update({
                status: 'sent',
                whatsapp_id: response.messageId
            })
            .eq('id', msg.id)

    } catch (e: any) {
        console.error('Failed to send message:', e)
        // Update status to 'failed'
        await supabase
            .from('messages')
            .update({ status: 'failed' })
            .eq('id', msg.id)

        // We don't throw error to UI to avoid crash, but UI will show failed status via Realtime/Refetch if implemented
    }
    // Note: Removed duplicate revalidatePath - first call on line 218 is sufficient for optimistic UI
}

export async function sendMedia(contactId: string, formData: FormData, orgId: string) {
    console.log('[sendMedia] Starting media send...')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    const file = formData.get('file') as File
    const mediaType = formData.get('type') as 'audio' | 'image'

    if (!file) throw new Error('No file provided')

    // Convert File to ArrayBuffer for server-side upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // 1. Upload to Supabase Storage (Using Admin Client to bypass RLS)
    const adminSupabase = createAdminClient()
    if (!adminSupabase) throw new Error('Server misconfiguration: No Admin Client')

    const ext = file.name.split('.').pop() || (mediaType === 'image' ? 'jpg' : 'webm')
    const fileName = `${contactId}/${Date.now()}.${ext}`

    console.log('[sendMedia] Uploading to storage:', fileName)

    const { error: uploadError } = await adminSupabase
        .storage
        .from('chat-media')
        .upload(fileName, buffer, {
            contentType: file.type,
            upsert: true
        })

    if (uploadError) {
        console.error('[sendMedia] Upload error:', uploadError)
        throw new Error(`Upload failed: ${uploadError.message}`)
    }

    // 2. Get Public URL
    const { data: publicUrlData } = supabase
        .storage
        .from('chat-media')
        .getPublicUrl(fileName)

    const mediaUrl = publicUrlData.publicUrl
    console.log('[sendMedia] Public URL generated:', mediaUrl)

    // 3. Insert message with 'sending' status
    const { data: msg, error: msgError } = await supabase.from('messages').insert({
        organization_id: orgId,
        contact_id: contactId,
        sender_type: 'user',
        sender_id: user.id,
        body: mediaType === 'audio' ? 'Áudio enviado' : 'Imagem enviada',
        media_url: mediaUrl,
        media_type: mediaType,
        status: 'sending'
    }).select('id').single()

    if (msgError) throw new Error(msgError.message)
    console.log('[sendMedia] DB record created:', msg.id)

    revalidatePath('/dashboard/chat')

    // 4. Send via UAZAPI
    try {
        console.log('[sendMedia] Sending to UAZAPI...')
        // Get contact details
        const { data: contact } = await supabase
            .from('contacts')
            .select('phone')
            .eq('id', contactId)
            .single()

        if (!contact) throw new Error('Contact not found')

        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('instance_token, status')
            .eq('organization_id', orgId)
            .single()

        if (!instance || instance.status !== 'connected') {
            throw new Error('WhatsApp disconnected')
        }

        let response
        if (mediaType === 'audio') {
            response = await uazapi.sendVoiceMessage(
                instance.instance_token,
                contact.phone,
                mediaUrl
            )
        } else {
            response = await uazapi.sendImageMessage(
                instance.instance_token,
                contact.phone,
                mediaUrl
            )
        }

        console.log('[sendMedia] UAZAPI success:', response)

        // Update status to 'sent'
        await supabase
            .from('messages')
            .update({
                status: 'sent',
                whatsapp_id: response.messageId
            })
            .eq('id', msg.id)

    } catch (e: any) {
        console.error('[sendMedia] Failed to send to UAZAPI:', e)
        await supabase
            .from('messages')
            .update({ status: 'failed' })
            .eq('id', msg.id)

        // Re-throw to inform UI
        throw e
    }

    // revalidatePath('/dashboard/chat')
}



export async function assignChat(contactId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    await supabase
        .from('contacts')
        .update({ owner_id: user.id })
        .eq('id', contactId)

    revalidatePath('/dashboard/chat')
}

export async function finishChat(contactId: string) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('contacts')
        .update({
            status: 'closed',
            updated_at: new Date().toISOString()
        })
        .eq('id', contactId)

    if (error) {
        console.error('Error finishing chat:', error)
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/chat')
}

export async function reopenChat(contactId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Reopen and assign to current user
    const { error } = await supabase
        .from('contacts')
        .update({
            status: 'open',
            owner_id: user?.id,
            updated_at: new Date().toISOString()
        })
        .eq('id', contactId)

    if (error) {
        console.error('Error reopening chat:', error)
        throw new Error(error.message)
    }

    revalidatePath('/dashboard/chat')
}


// --- Chat Actions (Tags, Notes, CRM, Reminders) ---

export async function addTag(contactId: string, tag: string) {
    if (!tag) return
    const supabase = await createClient()

    // Get current tags
    const { data: contact } = await supabase.from('contacts').select('tags').eq('id', contactId).single()
    const currentTags = contact?.tags || []

    if (!currentTags.includes(tag)) {
        await supabase
            .from('contacts')
            .update({ tags: [...currentTags, tag] })
            .eq('id', contactId)

        revalidatePath('/dashboard/chat')
    }
}

export async function removeTag(contactId: string, tag: string) {
    const supabase = await createClient()

    const { data: contact } = await supabase.from('contacts').select('tags').eq('id', contactId).single()
    const currentTags = contact?.tags || []

    const newTags = currentTags.filter((t: string) => t !== tag)

    await supabase
        .from('contacts')
        .update({ tags: newTags })
        .eq('id', contactId)

    revalidatePath('/dashboard/chat')
}

export async function getNotes(contactId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('contact_notes')
        .select(`
            *,
            author:author_id(name)
        `)
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
    return data
}

export async function addNote(contactId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('contact_notes').insert({
        contact_id: contactId,
        author_id: user.id,
        content
    })

    revalidatePath('/dashboard/chat')
}

export async function updateContactStage(contactId: string, pipelineId: string, stageId: string) {
    const supabase = await createClient()

    try {
        // 1. Try to find an existing deal for this contact (get the most recent one)
        const { data: deal, error: dealError } = await supabase
            .from('deals')
            .select('id')
            .eq('contact_id', contactId)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()

        if (dealError) {
            console.error('Error finding deal:', dealError)
            return { error: `Failed to find deal: ${dealError.message}` }
        }

        if (deal) {
            // Update existing deal
            const { error } = await supabase.from('deals').update({
                pipeline_id: pipelineId,
                stage_id: stageId
                // updated_at column missing in DB, removing for now
            }).eq('id', deal.id)

            if (error) {
                console.error('Error updating deal stage:', error)
                return { error: `Failed to update deal: ${error.message}` }
            }
        } else {
            // Create new deal
            // First get contact details including organization_id
            const { data: contact, error: contactError } = await supabase
                .from('contacts')
                .select('organization_id, name')
                .eq('id', contactId)
                .single()

            if (contactError || !contact) {
                console.error('Error fetching contact for deal creation:', contactError)
                return { error: `Contact not found: ${contactError?.message}` }
            }

            const { data: newDeal, error: insertError } = await supabase.from('deals').insert({
                contact_id: contactId,
                organization_id: contact.organization_id,
                pipeline_id: pipelineId,
                stage_id: stageId,
                title: `Negócio: ${contact.name}`,
                status: 'open',
                value: 0 // Default value
            }).select().single()

            if (insertError) {
                console.error('Error creating deal from chat:', insertError)
                return { error: `Failed to create deal: ${insertError.message}` }
            }
        }

        revalidatePath('/dashboard/chat')
        revalidatePath('/dashboard/kanban')
        return { success: true }
    } catch (e: any) {
        console.error('Unexpected error in updateContactStage:', e)
        return { error: e.message || 'Unknown error' }
    }
}

export async function getContactDeal(contactId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('deals')
        .select('id, stage_id, pipeline_id, value')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
    return data
}

export async function updateDealValue(contactId: string, value: number) {
    const supabase = await createClient()

    // Find the deal for this contact
    const { data: deal } = await supabase
        .from('deals')
        .select('id')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (!deal) {
        return { error: 'Nenhum deal encontrado para este contato' }
    }

    // Update the deal value
    const { error } = await supabase
        .from('deals')
        .update({ value })
        .eq('id', deal.id)

    if (error) {
        console.error('Error updating deal value:', error)
        return { error: error.message }
    }

    return { success: true }
}

export async function getPipelines() {
    const supabase = await createClient()
    const { data } = await supabase.from('pipelines').select('*, stages(*)')
    return data
}

export async function getReminders(contactId: string) {
    const supabase = await createClient()
    const { data } = await supabase
        .from('reminders')
        .select('*')
        .eq('contact_id', contactId)
        .order('due_at', { ascending: true })
    return data
}

export async function createReminder(contactId: string, title: string, dueAt: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('reminders').insert({
        contact_id: contactId,
        created_by: user.id,
        title,
        due_at: dueAt
    })

    revalidatePath('/dashboard/chat')
}

export async function toggleReminder(reminderId: string, completed: boolean) {
    const supabase = await createClient()
    await supabase.from('reminders').update({ completed }).eq('id', reminderId)
    revalidatePath('/dashboard/chat')
}

export async function syncProfilePictures() {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) throw new Error('Unauthorized')

        // 1. Get Org ID
        const { data: member } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
        if (!member) throw new Error('Organization not found')
        const orgId = member.organization_id

        // 2. Get instance token
        const { data: instance } = await supabase
            .from('whatsapp_instances')
            .select('instance_token')
            .eq('organization_id', orgId)
            .eq('status', 'connected')
            .single()

        if (!instance) {
            return { error: 'WhatsApp não está conectado' }
        }

        // 3. Fetch contacts from UAZAPI
        const waContacts = await uazapi.getContacts(instance.instance_token)
        console.log(`Syncing profile pictures for ${waContacts.length} contacts`)

        // 4. Update local contacts
        let updatedCount = 0
        const logs: string[] = [] // Collect logs to return to client

        const allDbPhones = await supabase
            .from('contacts')
            .select('id, phone, name, avatar_url')
            .eq('organization_id', orgId)

        logs.push(`Found ${waContacts.length} contacts on WhatsApp`)
        if (waContacts.length > 0) {
            logs.push(`🔍 Raw First Contact: ${JSON.stringify(waContacts[0])}`)
        }
        logs.push(`Found ${allDbPhones.data?.length} contacts in DB`)

        // 4. Match and Update
        logs.push(`Starting sync for ${allDbPhones.data?.length} DB contacts...`)

        for (const dbContact of allDbPhones.data || []) {
            // OPTIMIZATION: Skip if already has avatar
            if (dbContact.avatar_url) {
                // logs.push(`Skipping ${dbContact.name} - already has photo`)
                continue
            }

            let avatarUrl: string | undefined

            // Clean DB phone for matching
            const dbDigits = dbContact.phone.replace(/\D/g, '')

            // Strategy A: Check if we already have it in the bulk list (fastest)
            const waMatch = waContacts.find(wa => {
                const waDigits = wa.phone.replace(/\D/g, '')
                return waDigits === dbDigits || waDigits.endsWith(dbDigits) || dbDigits.endsWith(waDigits)
            })

            if (waMatch && waMatch.profilePicUrl) {
                avatarUrl = waMatch.profilePicUrl
                logs.push(`Found in list: ${dbContact.name}`)
            }

            // Strategy B: Fetch individual profile picture (fallback)
            if (!avatarUrl) {
                try {
                    logs.push(`Fetching specific for ${dbContact.name} (${dbDigits})...`)
                    const fetchedUrl = await uazapi.fetchProfilePicture(instance.instance_token, dbContact.phone)
                    if (fetchedUrl) {
                        avatarUrl = fetchedUrl
                        logs.push(`✓ Got URL: ${fetchedUrl.substring(0, 20)}...`)
                    } else {
                        logs.push(`✗ No URL returned for ${dbDigits}`)
                    }
                } catch (err: any) {
                    logs.push(`Error fetching for ${dbContact.name}: ${err.message}`)
                }
            }

            // Update if we found a photo
            if (avatarUrl) {
                logs.push(`✓ Updating DB for ${dbContact.name}`)
                const { error: updateError } = await supabase
                    .from('contacts')
                    .update({ avatar_url: avatarUrl })
                    .eq('id', dbContact.id)

                if (!updateError) updatedCount++
            }
        }

        revalidatePath('/dashboard/chat')
        return { success: true, updatedCount, logs }
    } catch (e: any) {
        console.error('Error in syncProfilePictures:', e)
        return { error: e.message || 'Unknown error', logs: ['Error occurred'] }
    }
}

export async function refreshContactAvatar(contactId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthorized' }

    // 1. Get contact
    const { data: contact } = await supabase
        .from('contacts')
        .select('phone, organization_id')
        .eq('id', contactId)
        .single()

    if (!contact) return { error: 'Contact not found' }

    // 2. Get instance
    const { data: instance } = await supabase
        .from('whatsapp_instances')
        .select('instance_token')
        .eq('organization_id', contact.organization_id)
        .eq('status', 'connected')
        .single()

    if (!instance) return { error: 'WhatsApp not connected' }

    // 3. Fetch from API
    const avatarUrl = await uazapi.fetchProfilePicture(instance.instance_token, contact.phone)

    if (avatarUrl) {
        // 4. Update DB
        await supabase
            .from('contacts')
            .update({ avatar_url: avatarUrl })
            .eq('id', contactId)

        revalidatePath('/dashboard/chat')
        return { success: true, avatarUrl }
    }

    return { success: false, message: 'No avatar found' }
}

export async function getContact(contactId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Get basic contact info
    const { data: contact } = await supabase
        .from('contacts')
        .select('*')
        .eq('id', contactId)
        .single()

    if (!contact) return null

    // Get last message and unread count
    const { data: messages } = await supabase
        .from('messages')
        .select('body, sender_type, media_type, created_at')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })

    const lastMsg = messages?.[0]

    // Calculate unread count (simple version: count contact messages since last user message)
    let unreadCount = 0
    if (messages) {
        for (const msg of messages) {
            if (msg.sender_type === 'user') break
            if (msg.sender_type === 'contact') unreadCount++
        }
    }

    return {
        ...contact,
        last_message: lastMsg ? {
            body: lastMsg.body,
            sender_type: lastMsg.sender_type,
            media_type: lastMsg.media_type
        } : null,
        last_message_at: lastMsg?.created_at || contact.created_at,
        unread_count: unreadCount
    }
}
