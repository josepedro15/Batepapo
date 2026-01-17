'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useNotification } from '@/components/providers/notification-provider'
import { createClient } from '@/lib/supabase/client'
import { assignChat, sendMessage, finishChat, reopenChat, getMessages, getNewMessages, syncProfilePictures, sendMedia, getChatData, refreshContactAvatar, getContact, deleteConversation, updateContactName } from '@/app/dashboard/chat/actions'
import { getQuickMessages } from '@/app/dashboard/quick-messages/actions'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { User, MessageSquare, Send, Clock, ArrowRight, CheckCircle, RotateCcw, Plus, RefreshCw, Paperclip, Mic, X, ImageIcon, MessageCircle, Loader2, ChevronLeft, ChevronRight, Search, MoreVertical, Trash2, Edit, Check, FileText, Video, Download, Play } from 'lucide-react'
import { TransferChatDialog } from '@/components/dialogs/transfer-chat-dialog'
import { NewChatDialog } from '@/components/dialogs/new-chat-dialog'
import { ContactDetailsPanel } from '@/components/chat/contact-details-panel'
import { toast } from 'sonner'
import { ImageGalleryDialog } from '@/components/dialogs/image-gallery-dialog'
import { MessageImageGroup } from '@/components/chat/message-image-group'
import { AudioPlayer } from '@/components/chat/audio-player'
import MicRecorder from 'mic-recorder-to-mp3'

// Types (simplified for this file)
type Contact = {
    id: string;
    name: string;
    phone: string;
    tags: string[] | null;
    last_message_at?: string;
    avatar_url?: string;
    unread_count?: number;
    last_message?: {
        body: string | null;
        sender_type: string;
        media_type: string | null;
    } | null;
}
type Message = {
    id: string;
    body: string | null;
    sender_type: 'user' | 'contact' | 'system';
    created_at: string;
    media_url?: string | null;
    media_type?: string | null;
}

export function ChatInterface({
    initialMyChats,
    initialAwaitingChats,
    initialAllChats,
    initialFinishedChats,
    currentUserId,
    orgId,
    userRole,
    members
}: {
    initialMyChats: any[],
    initialAwaitingChats: any[],
    initialAllChats: any[],
    initialFinishedChats: any[],
    currentUserId: string,
    orgId: string,
    userRole: string,
    members: any[]
}) {
    const [activeTab, setActiveTab] = useState<'mine' | 'awaiting' | 'all' | 'finished'>('mine')
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
    const [messages, setMessages] = useState<Message[]>([])
    const [inputText, setInputText] = useState('')
    const [showTransferDialog, setShowTransferDialog] = useState(false)
    const [showNewChatDialog, setShowNewChatDialog] = useState(false)
    const [showDetailsPanel, setShowDetailsPanel] = useState(true)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [loadingContactId, setLoadingContactId] = useState<string | null>(null)
    const [page, setPage] = useState(0)
    const [hasMore, setHasMore] = useState(true)
    const MESSAGES_PER_PAGE = 25
    const [searchQuery, setSearchQuery] = useState('')
    const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
    const [editingContactId, setEditingContactId] = useState<string | null>(null)
    const [editingName, setEditingName] = useState('')

    // Quick Messages State
    const [quickMessages, setQuickMessages] = useState<any[]>([])
    const [showQuickCommands, setShowQuickCommands] = useState(false)
    const [filteredCommands, setFilteredCommands] = useState<any[]>([])

    useEffect(() => {
        if (orgId) {
            getQuickMessages(orgId).then(msgs => {
                if (msgs) setQuickMessages(msgs)
            })
        }
    }, [orgId])

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value
        setInputText(val)

        // Simple slash command detection: starts with /
        if (val.startsWith('/')) {
            const query = val.slice(1).toLowerCase()
            const matches = quickMessages.filter(msg =>
                msg.title.toLowerCase().includes(query) ||
                msg.content.toLowerCase().includes(query)
            )
            setFilteredCommands(matches)
            setShowQuickCommands(matches.length > 0)
        } else {
            setShowQuickCommands(false)
        }
    }

    const selectQuickMessage = (content: string) => {
        setInputText(content)
        setShowQuickCommands(false)
        // Optional: auto-focus back to input if needed, but react state update should keep focus
    }

    // Contact lists state (for real-time updates)
    const [myChats, setMyChats] = useState<any[]>(initialMyChats || [])
    const [awaitingChats, setAwaitingChats] = useState<any[]>(initialAwaitingChats || [])
    const [allChats, setAllChats] = useState<any[]>(initialAllChats || [])
    const [finishedChats, setFinishedChats] = useState<any[]>(initialFinishedChats || [])

    // Helper to format timestamp to Brasilia time (UTC-3)
    const formatTime = (timestamp: string) => {
        const date = new Date(timestamp)
        // Convert to Brasilia timezone (UTC-3)
        return date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'America/Sao_Paulo'
        })
    }

    // Media State
    const [isRecording, setIsRecording] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<{ file: File, preview: string, type: 'image' | 'audio' | 'video' | 'document' }[]>([])

    // Gallery State
    const [galleryImages, setGalleryImages] = useState<string[]>([])
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)
    const [showGallery, setShowGallery] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const recorderRef = useRef<MicRecorder | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const messagesContainerRef = useRef<HTMLDivElement>(null) // Container for scroll control
    const messagesRef = useRef<Message[]>([]) // Ref to track current messages for polling
    const tabsRef = useRef<HTMLDivElement>(null)
    const shouldScrollToBottomRef = useRef(true) // Flag to control auto-scroll
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = () => {
            if (openDropdownId) {
                setOpenDropdownId(null)
                setDeleteConfirmId(null)
                setEditingContactId(null)
                setEditingName('')
            }
        }

        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [openDropdownId])

    // Message cache per contact - stores messages in memory for instant switching
    const messageCacheRef = useRef<Map<string, {
        messages: Message[],
        page: number,
        hasMore: boolean
    }>>(new Map())

    const checkScroll = useCallback(() => {
        if (tabsRef.current) {
            const { scrollLeft, scrollWidth, clientWidth } = tabsRef.current
            setCanScrollLeft(scrollLeft > 0)
            setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5) // buffer of 5px
        }
    }, [])

    useEffect(() => {
        checkScroll()
        window.addEventListener('resize', checkScroll)
        return () => window.removeEventListener('resize', checkScroll)
    }, [checkScroll, myChats, awaitingChats, allChats, finishedChats]) // checking when data changes too

    // Handle Deep Linking to Chat
    const searchParams = useSearchParams()

    const router = useRouter()
    const pathname = usePathname()
    const chatId = searchParams.get('chatId')

    useEffect(() => {
        if (!chatId) return

        const loadDeepLinkChat = async () => {
            // 1. Try to find in existing lists
            const allLists = [
                ...(myChats || []),
                ...(awaitingChats || []),
                ...(allChats || []),
                ...(finishedChats || [])
            ]

            const existing = allLists.find(c => c.id === chatId)

            if (existing) {
                setSelectedContact(existing)
                // Switch to correct tab
                if (myChats?.find(c => c.id === chatId)) setActiveTab('mine')
                else if (awaitingChats?.find(c => c.id === chatId)) setActiveTab('awaiting')
                else if (finishedChats?.find(c => c.id === chatId)) setActiveTab('finished')
                else setActiveTab('all')
            } else {
                // 2. Not in lists, fetch from DB
                try {
                    const fetchedContact = await getContact(chatId)
                    if (fetchedContact) {
                        setSelectedContact(fetchedContact)
                        // Guess tab
                        if (fetchedContact.status === 'closed') setActiveTab('finished')
                        else if (!fetchedContact.owner_id) setActiveTab('awaiting')
                        else setActiveTab('mine') // or 'all' if owner is different, but 'mine' is safe default
                    }
                } catch (error) {
                    console.error('Error fetching chat from URL', error)
                }
            }
        }

        loadDeepLinkChat()
    }, [chatId, myChats, awaitingChats, allChats, finishedChats])

    const scrollTabs = (direction: 'left' | 'right') => {
        if (tabsRef.current) {
            const container = tabsRef.current
            const scrollAmount = 200
            const newScrollLeft = direction === 'left'
                ? container.scrollLeft - scrollAmount
                : container.scrollLeft + scrollAmount

            container.scrollTo({
                left: newScrollLeft,
                behavior: 'smooth'
            })
            // Update buttons state after animation (approx)
            setTimeout(checkScroll, 300)
        }
    }

    // Notification context
    const { markAsRead, setIsChatVisible } = useNotification()

    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
        if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTo({
                top: messagesContainerRef.current.scrollHeight,
                behavior
            })
        }
    }, [])

    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight } = e.currentTarget
        if (scrollTop < 80 && hasMore && !isLoadingMessages) {
            setIsLoadingMessages(true)
            const currentScrollHeight = scrollHeight

            const nextPage = page + 1
            const olderMessages = await getMessages(selectedContact!.id, nextPage, MESSAGES_PER_PAGE)

            if (olderMessages && olderMessages.length > 0) {
                setMessages(prev => [...olderMessages, ...prev])
                setPage(nextPage)
                setHasMore(olderMessages.length === MESSAGES_PER_PAGE)

                // Restore scroll position
                requestAnimationFrame(() => {
                    if (e.currentTarget) {
                        e.currentTarget.scrollTop = e.currentTarget.scrollHeight - currentScrollHeight
                    }
                })
            } else {
                setHasMore(false)
            }
            setIsLoadingMessages(false)
        }
    }

    // Media Handlers
    const startRecording = async () => {
        try {
            const recorder = new MicRecorder({ bitRate: 128 })
            recorderRef.current = recorder

            await recorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error('Error accessing microphone:', err)
            toast.error('Erro ao acessar microfone')
        }
    }

    const stopRecording = () => {
        if (recorderRef.current && isRecording) {
            recorderRef.current
                .stop()
                .getMp3()
                .then(([buffer, blob]) => {
                    if (blob.size < 1000) {
                        toast.error('Áudio muito curto ou vazio')
                        return
                    }
                    const file = new File([blob], 'recording.mp3', { type: 'audio/mpeg', lastModified: Date.now() })
                    setMediaFiles(prev => [...prev, {
                        file,
                        preview: URL.createObjectURL(blob),
                        type: 'audio'
                    }])
                })
                .catch((e: Error) => {
                    console.error('Mp3 conversion failed', e)
                    toast.error('Erro ao processar áudio')
                })

            setIsRecording(false)
        }
    }

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            // Accept images, videos, and documents
            const newFiles = Array.from(e.target.files)

            const newMediaItems = newFiles.map(file => {
                let type: 'image' | 'video' | 'document' = 'document'

                if (file.type.startsWith('image/')) type = 'image'
                else if (file.type.startsWith('video/')) type = 'video'

                return {
                    file,
                    preview: type === 'image' || type === 'video' ? URL.createObjectURL(file) : '', // Video also has URL preview
                    type
                }
            })

            setMediaFiles(prev => [...prev, ...newMediaItems])
        }
    }

    const handleSendMedia = async () => {
        if (mediaFiles.length === 0 || !selectedContact) return

        const loadingId = toast.loading('Iniciando envio...')
        const failedFiles: typeof mediaFiles = []
        let successCount = 0

        for (let i = 0; i < mediaFiles.length; i++) {
            const media = mediaFiles[i]
            toast.loading(`Enviando ${i + 1} de ${mediaFiles.length}...`, { id: loadingId })

            try {
                const formData = new FormData()
                formData.append('file', media.file)
                formData.append('type', media.type)

                await sendMedia(selectedContact.id, formData, orgId)
                successCount++
            } catch (error) {
                console.error(`Falha ao enviar ${media.file.name}`, error)
                failedFiles.push(media)
            }
        }

        if (failedFiles.length > 0) {
            toast.error(`${failedFiles.length} arquivos falharam. Tente novamente.`, { id: loadingId })
            setMediaFiles(failedFiles)
        } else {
            toast.success(`${successCount} arquivos enviados!`, { id: loadingId })
            setMediaFiles([])
        }
    }


    // Scroll to bottom when messages change (controlled by flag)
    useEffect(() => {
        if (shouldScrollToBottomRef.current && messages.length > 0) {
            // Small delay to ensure DOM is updated
            requestAnimationFrame(() => {
                scrollToBottom('instant')
            })
        }
    }, [messages, scrollToBottom])

    // Mark as read and set chat as visible on mount
    useEffect(() => {
        markAsRead()
        setIsChatVisible(true)

        // Clean up: mark chat as not visible when leaving
        return () => {
            setIsChatVisible(false)
        }
    }, [markAsRead, setIsChatVisible])

    // Poll contact list every 10 seconds for real-time updates (increased from 5s for performance)
    useEffect(() => {
        const refreshContacts = async () => {
            try {
                const data = await getChatData()
                setMyChats(data.myChats || [])
                setAwaitingChats(data.awaitingChats || [])
                setAllChats(data.allChats || [])
                setFinishedChats(data.finishedChats || [])
            } catch (error) {
                console.error('Error refreshing contacts:', error)
            }
        }

        // Initial sync
        refreshContacts()

        // Poll every 10 seconds (optimized from 5s)
        const pollInterval = setInterval(refreshContacts, 10000)

        return () => clearInterval(pollInterval)
    }, [])

    // Realtime Setup
    const supabase = createClient()
    // const { toast } = useToast() <- Removing this as we use 'sonner' toast imported at top

    useEffect(() => {
        if (!selectedContact?.id) return

        const contactId = selectedContact.id

        // Mark as read when selecting a contact
        markAsRead()
        // Enable auto-scroll when opening a new conversation
        shouldScrollToBottomRef.current = true

        // Check if we have cached messages for this contact
        const cached = messageCacheRef.current.get(contactId)

        if (cached && cached.messages.length > 0) {
            // CACHE HIT: Show cached messages instantly (no loading!)
            setMessages(cached.messages)
            setPage(cached.page)
            setHasMore(cached.hasMore)
            setIsLoadingMessages(false)
            setLoadingContactId(null) // Clear loading state immediately for cached content

            // Scroll to bottom immediately
            requestAnimationFrame(() => {
                scrollToBottom('instant')
            })

            // Fetch new messages in background (if any)
            const lastMessage = cached.messages[cached.messages.length - 1]
            if (lastMessage) {
                getNewMessages(contactId, lastMessage.created_at).then(newMsgs => {
                    if (newMsgs && newMsgs.length > 0) {
                        setMessages(prev => {
                            const existingIds = new Set(prev.map(m => m.id))
                            const trulyNew = newMsgs.filter((m: Message) => !existingIds.has(m.id))
                            if (trulyNew.length > 0) {
                                const updated = [...prev, ...trulyNew].sort((a, b) =>
                                    new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                                )
                                // Update cache
                                messageCacheRef.current.set(contactId, {
                                    messages: updated,
                                    page: cached.page,
                                    hasMore: cached.hasMore
                                })
                                return updated
                            }
                            return prev
                        })
                        requestAnimationFrame(() => scrollToBottom('smooth'))
                    }
                }).catch(console.error)
            }
        } else {
            // CACHE MISS: First visit - fetch from server
            setMessages([])
            setPage(0)
            setHasMore(true)
            setIsLoadingMessages(true)

            getMessages(contactId, 0, MESSAGES_PER_PAGE).then(msgs => {
                const messageList = msgs || []
                const hasMorePages = messageList.length === MESSAGES_PER_PAGE

                setMessages(messageList)
                setHasMore(hasMorePages)
                setIsLoadingMessages(false)
                setLoadingContactId(null) // Clear loading state when messages are loaded

                // Save to cache
                messageCacheRef.current.set(contactId, {
                    messages: messageList,
                    page: 0,
                    hasMore: hasMorePages
                })

                requestAnimationFrame(() => {
                    scrollToBottom('instant')
                })
            }).catch(() => {
                setIsLoadingMessages(false)
                setLoadingContactId(null) // Clear loading state on error too
            })
        }

        // 2. OPTIMIZED Polling: Only fetch NEW messages (incremental)
        const pollInterval = setInterval(async () => {
            // Use ref to get current messages (avoids stale closure)
            const currentMessages = messagesRef.current
            const lastMessage = currentMessages[currentMessages.length - 1]
            if (!lastMessage) return

            try {
                // Only fetch messages after the last known timestamp
                const newMessages = await getNewMessages(contactId, lastMessage.created_at)

                if (newMessages && newMessages.length > 0) {
                    // Use setMessages with callback to get fresh state and avoid duplicates
                    setMessages(prev => {
                        // Check for optimistic messages (temp-*) that should be replaced
                        const tempMessages = prev.filter(m => m.id.startsWith('temp-'))
                        const realMessages = prev.filter(m => !m.id.startsWith('temp-'))

                        const existingIds = new Set(realMessages.map(m => m.id))
                        const trulyNew = newMessages.filter((m: Message) => !existingIds.has(m.id))

                        if (trulyNew.length > 0) {
                            // For each new message, check if it matches an optimistic message (same body)
                            // and replace it, or add it as new
                            let updatedMessages = [...realMessages]

                            for (const newMsg of trulyNew) {
                                // Find matching optimistic message by body and sender_type
                                const matchingOptimistic = tempMessages.find(
                                    t => t.body === newMsg.body && t.sender_type === newMsg.sender_type
                                )

                                if (matchingOptimistic) {
                                    // This is our optimistic message confirmed - already in list, just skip
                                    // (the optimistic was filtered out, so we add the real one)
                                    updatedMessages.push(newMsg)
                                } else {
                                    // Truly new message from contact
                                    // Note: No notification sound here - user is viewing the chat screen
                                    updatedMessages.push(newMsg)
                                }
                            }

                            // Sort by created_at to maintain order
                            updatedMessages.sort((a, b) =>
                                new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                            )

                            // Scroll to bottom when new messages arrive
                            requestAnimationFrame(() => {
                                scrollToBottom('smooth')
                            })

                            return updatedMessages
                        }
                        return prev
                    })
                }
            } catch (error) {
                console.error('Error polling new messages:', error)
            }
        }, 5000) // Increased to 5s (from 3s) with incremental fetching it's much lighter

        return () => {
            clearInterval(pollInterval)
        }
    }, [selectedContact?.id, markAsRead, scrollToBottom]) // Only re-run if ID changes

    // Keep messagesRef in sync with messages state AND update cache
    useEffect(() => {
        messagesRef.current = messages

        // Update cache for current contact
        if (selectedContact?.id && messages.length > 0) {
            const currentCache = messageCacheRef.current.get(selectedContact.id)
            messageCacheRef.current.set(selectedContact.id, {
                messages: messages.filter(m => !m.id.startsWith('temp-')), // Don't cache optimistic messages
                page: currentCache?.page || 0,
                hasMore: currentCache?.hasMore ?? true
            })
        }
    }, [messages, selectedContact?.id])

    // Sync selectedContact when lists update (e.g. after adding a tag)
    useEffect(() => {
        if (selectedContact) {
            const all = [...(myChats || []), ...(awaitingChats || []), ...(allChats || []), ...(finishedChats || [])]
            const updated = all.find(c => c.id === selectedContact.id)
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedContact)) {
                setSelectedContact(updated)
            }
        }
    }, [myChats, awaitingChats, allChats, finishedChats])

    // Refresh Avatar on selection if missing
    useEffect(() => {
        if (selectedContact && !selectedContact.avatar_url) {
            refreshContactAvatar(selectedContact.id).then(res => {
                if (res.success && res.avatarUrl) {
                    setSelectedContact(prev => prev ? { ...prev, avatar_url: res.avatarUrl } : null)
                }
            })
        }
    }, [selectedContact])

    const handleFinishChat = async () => {
        if (!selectedContact) return
        try {
            await finishChat(selectedContact.id)
            setSelectedContact(null)
            toast.success('Atendimento finalizado')
        } catch (error) {
            toast.error('Erro ao finalizar atendimento')
        }
    }

    const handleReopenChat = async () => {
        if (!selectedContact) return
        try {
            await reopenChat(selectedContact.id)
            setActiveTab('mine') // Switch to mine as it gets assigned to user
            toast.success('Atendimento reaberto')
        } catch (error) {
            toast.error('Erro ao reabrir atendimento')
        }
    }

    const handleSyncPhotos = async () => {
        const loadingToast = toast.loading('Sincronizando fotos de perfil...')
        try {
            const result = await syncProfilePictures()
            if (result.success) {
                toast.success(`Sincronização concluída! ${result.updatedCount} fotos atualizadas.`, { id: loadingToast })
            } else {
                toast.error(result.error || 'Erro ao sincronizar fotos', { id: loadingToast })
            }
        } catch (error) {
            toast.error('Erro inesperado ao sincronizar fotos', { id: loadingToast })
        }
    }

    // Note: Auto-sync of profile pictures has been REMOVED for performance.
    // Use the manual "Sync Photos" button in the menu if needed.

    const getOriginalTab = (contactId: string) => {
        if (myChats?.find(c => c.id === contactId)) return 'mine'
        if (awaitingChats?.find(c => c.id === contactId)) return 'awaiting'
        if (allChats?.find(c => c.id === contactId)) return 'all'
        if (finishedChats?.find(c => c.id === contactId)) return 'finished'
        return 'mine'
    }

    const tabs = [
        { id: 'mine' as const, label: 'Meus', count: myChats?.length || 0, color: 'primary' },
        { id: 'awaiting' as const, label: 'Fila', count: awaitingChats?.length || 0, color: 'warning' },
        ...(userRole === 'owner' || userRole === 'manager' ? [{ id: 'all' as const, label: 'Todos', count: allChats?.length || 0, color: 'accent' }] : []),
        { id: 'finished' as const, label: 'Finalizados', count: finishedChats?.length || 0, color: 'success' },
    ]

    const getTabColorClasses = (tabId: string, isActive: boolean) => {
        const colors: Record<string, { active: string, inactive: string }> = {
            mine: { active: 'text-primary border-primary bg-primary/5', inactive: 'text-muted-foreground hover:text-primary/80' },
            awaiting: { active: 'text-warning border-warning bg-warning/5', inactive: 'text-muted-foreground hover:text-warning/80' },
            all: { active: 'text-accent border-accent bg-accent/5', inactive: 'text-muted-foreground hover:text-accent/80' },
            finished: { active: 'text-success border-success bg-success/5', inactive: 'text-muted-foreground hover:text-success/80' },
        }
        return isActive ? colors[tabId]?.active : colors[tabId]?.inactive
    }

    // Helper to format date for separator
    const formatDateForSeparator = (dateString: string) => {
        const date = new Date(dateString)
        const now = new Date()
        const yesterday = new Date(now)
        yesterday.setDate(now.getDate() - 1)

        const isToday = date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()

        const isYesterday = date.getDate() === yesterday.getDate() &&
            date.getMonth() === yesterday.getMonth() &&
            date.getFullYear() === yesterday.getFullYear()

        if (isToday) return 'Hoje'
        if (isYesterday) return 'Ontem'

        return date.toLocaleDateString('pt-BR')
    }

    // Group consecutive image messages from same sender
    type GroupedMessage = {
        type: 'single'
        message: Message
        createdAt: string // Normalized for sorting/display
    } | {
        type: 'image-group'
        senderType: 'user' | 'contact' | 'system'
        images: string[]
        firstMessageId: string
        createdAt: string
    }

    const groupedMessages = useMemo<GroupedMessage[]>(() => {
        const result: GroupedMessage[] = []
        let currentImageGroup: { senderType: 'user' | 'contact' | 'system'; images: string[]; firstMessageId: string; createdAt: string } | null = null

        for (const message of messages) {
            if (message.media_type === 'image' && message.media_url) {
                // Image message
                if (currentImageGroup && currentImageGroup.senderType === message.sender_type) {
                    // Same sender, add to group
                    currentImageGroup.images.push(message.media_url)
                } else {
                    // New sender or first image, close previous group and start new
                    if (currentImageGroup) {
                        result.push({ type: 'image-group', ...currentImageGroup })
                    }
                    currentImageGroup = {
                        senderType: message.sender_type,
                        images: [message.media_url],
                        firstMessageId: message.id,
                        createdAt: message.created_at
                    }
                }
            } else {
                // Non-image message (text, video, audio, document), close any open image group
                if (currentImageGroup) {
                    result.push({ type: 'image-group', ...currentImageGroup })
                    currentImageGroup = null
                }
                result.push({ type: 'single', message, createdAt: message.created_at })
            }
        }

        // Don't forget to add the last group if any
        if (currentImageGroup) {
            result.push({ type: 'image-group', ...currentImageGroup })
        }

        return result
    }, [messages])

    const openGallery = (images: string[], index: number) => {
        setGalleryImages(images)
        setGalleryInitialIndex(index)
        setShowGallery(true)
    }

    const handleContactSelect = (contact: Contact) => {
        setLoadingContactId(contact.id) // Set loading state for the clicked contact
        const params = new URLSearchParams(searchParams.toString())
        params.set('chatId', contact.id)
        router.replace(`${pathname}?${params.toString()}`)
    }

    const handleUpdateContactName = async (contactId: string, newName: string) => {
        if (!newName.trim()) {
            toast.error('O nome não pode estar vazio')
            return
        }

        try {
            await updateContactName(contactId, newName)

            // Refresh contact lists
            const data = await getChatData()
            setMyChats(data.myChats || [])
            setAwaitingChats(data.awaitingChats || [])
            setAllChats(data.allChats || [])
            setFinishedChats(data.finishedChats || [])

            // Update selected contact if it was the one being edited
            if (selectedContact?.id === contactId) {
                setSelectedContact(prev => prev ? { ...prev, name: newName } : null)
            }

            setEditingContactId(null)
            setEditingName('')
            setOpenDropdownId(null)
            toast.success('Nome atualizado com sucesso')
        } catch (error) {
            console.error('Error updating contact name:', error)
            toast.error('Erro ao atualizar nome')
        }
    }

    const handleDeleteConversation = async (contactId: string, contactName: string) => {
        try {
            await deleteConversation(contactId)

            // Clear selection if deleted contact was selected
            if (selectedContact?.id === contactId) {
                setSelectedContact(null)
            }

            // Refresh contact lists
            const data = await getChatData()
            setMyChats(data.myChats || [])
            setAwaitingChats(data.awaitingChats || [])
            setAllChats(data.allChats || [])
            setFinishedChats(data.finishedChats || [])

            setDeleteConfirmId(null)
            setOpenDropdownId(null)
            toast.success(`Conversa com ${contactName} excluída`)
        } catch (error) {
            console.error('Error deleting conversation:', error)
            toast.error('Erro ao excluir conversa')
        }
    }

    // Filter contacts based on search query
    const filterContacts = (contacts: Contact[]) => {
        if (!searchQuery.trim()) return contacts
        const query = searchQuery.toLowerCase()
        return contacts.filter(contact =>
            contact.name.toLowerCase().includes(query) ||
            contact.phone.toLowerCase().includes(query)
        )
    }

    // Get filtered contacts for current tab
    const filteredContacts = useMemo(() => {
        const currentList = activeTab === 'mine' ? myChats :
            activeTab === 'awaiting' ? awaitingChats :
                activeTab === 'all' ? allChats :
                    finishedChats
        return filterContacts(currentList || [])
    }, [activeTab, myChats, awaitingChats, allChats, finishedChats, searchQuery])

    return (
        <div className="flex h-full gap-0 rounded-2xl overflow-hidden glass animate-fade-in">

            {/* LEFT SIDEBAR: Contact List */}
            <div className="w-80 flex flex-col border-r border-border/50 bg-card/30">
                {/* Header with New Chat button */}
                <div className="p-3 border-b border-border/50">
                    <button
                        onClick={() => setShowNewChatDialog(true)}
                        className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-300 shadow-lg shadow-primary/20"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Conversa
                    </button>
                </div>

                {/* Search Box */}
                <div className="p-3 border-b border-border/50">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou número..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-background/50 border border-border/50 rounded-xl text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                        />
                        {searchQuery && (
                            <button
                                onClick={() => setSearchQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                {/* Tabs Wrapper with Slider Controls */}
                <div className="relative group border-b border-border/50">
                    {/* Left Button */}
                    <div className={cn(
                        "absolute left-0 top-0 bottom-0 z-10 flex items-center bg-gradient-to-r from-card to-transparent pr-4 pl-1 transition-opacity duration-200",
                        canScrollLeft ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                        <button
                            onClick={() => scrollTabs('left')}
                            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                    </div>

                    {/* Scroll Container */}
                    <div
                        ref={tabsRef}
                        onScroll={checkScroll}
                        className="flex overflow-x-auto scrollbar-hide scroll-smooth relative"
                    >
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => { setActiveTab(tab.id); setSelectedContact(null) }}
                                className={cn(
                                    "px-4 py-3.5 text-sm font-bold transition-all duration-200 whitespace-nowrap flex-shrink-0 border-b-2 border-transparent",
                                    getTabColorClasses(tab.id, activeTab === tab.id)
                                )}
                            >
                                {tab.label} <span className="ml-1 opacity-70">({tab.count})</span>
                            </button>
                        ))}
                    </div>

                    {/* Right Button */}
                    <div className={cn(
                        "absolute right-0 top-0 bottom-0 z-10 flex items-center justify-end bg-gradient-to-l from-card to-transparent pl-4 pr-1 transition-opacity duration-200",
                        canScrollRight ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}>
                        <button
                            onClick={() => scrollTabs('right')}
                            className="h-8 w-8 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 shadow-sm flex items-center justify-center hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filteredContacts?.map((contact, index) => (
                        <div
                            key={contact.id}
                            className={cn(
                                "relative w-full text-left p-4 hover:bg-muted/30 transition-all duration-200 border-b border-border/30 animate-fade-in",
                                selectedContact?.id === contact.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                            )}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            {/* Main Contact Area (Clickable) */}
                            <div
                                onClick={() => handleContactSelect(contact)}
                                className="cursor-pointer"
                            >
                                {loadingContactId === contact.id ? (
                                    /* Loading State */
                                    <div className="flex items-center gap-3 mb-1">
                                        <div className="relative h-11 w-11 flex-shrink-0">
                                            <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                                                <Loader2 className="h-5 w-5 text-primary animate-spin" />
                                            </div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-foreground truncate">{contact.name}</span>
                                            </div>
                                            <p className="text-xs text-primary/70 animate-pulse">Carregando conversa...</p>
                                        </div>
                                    </div>
                                ) : (
                                    /* Normal State */
                                    <div className="flex items-center gap-3">
                                        <div className="relative h-11 w-11 flex-shrink-0">
                                            {contact.avatar_url ? (
                                                <img src={contact.avatar_url} alt={contact.name} className="h-11 w-11 rounded-full object-cover ring-2 ring-border/50" />
                                            ) : (
                                                <div className="h-11 w-11 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold text-sm shadow-lg shadow-primary/20">
                                                    {contact.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {activeTab === 'awaiting' && (
                                                <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-warning flex items-center justify-center">
                                                    <Clock className="h-2.5 w-2.5 text-warning-foreground" />
                                                </div>
                                            )}
                                            {activeTab === 'finished' && (
                                                <div className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-success flex items-center justify-center">
                                                    <CheckCircle className="h-2.5 w-2.5 text-success-foreground" />
                                                </div>
                                            )}
                                            {activeTab !== 'awaiting' && activeTab !== 'finished' && (contact.unread_count ?? 0) > 0 && (
                                                <div className="absolute -top-1 -right-1 h-5 min-w-5 px-1 rounded-full bg-primary flex items-center justify-center animate-pulse">
                                                    <span className="text-[10px] font-bold text-primary-foreground">
                                                        {contact.unread_count! > 99 ? '99+' : contact.unread_count}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start">
                                                <span className="font-bold text-foreground truncate">{contact.name}</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {contact.last_message ? (
                                                    <>
                                                        {contact.last_message.sender_type === 'user' && (
                                                            <span className="text-primary/70">Você: </span>
                                                        )}
                                                        {contact.last_message.media_type === 'audio' ? (
                                                            '🎵 Áudio'
                                                        ) : contact.last_message.media_type === 'image' ? (
                                                            '📷 Imagem'
                                                        ) : (
                                                            contact.last_message.body || 'Mensagem'
                                                        )}
                                                    </>
                                                ) : (
                                                    contact.phone
                                                )}
                                            </p>
                                            {/* Tags Display */}
                                            {contact.tags && Array.isArray(contact.tags) && contact.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1.5 mt-2">
                                                    {contact.tags.map((tag: string, idx: number) => (
                                                        <span
                                                            key={idx}
                                                            className="px-2 py-0.5 text-[10px] font-bold bg-primary/15 text-primary border border-primary/20 rounded-md uppercase tracking-wide"
                                                        >
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Three-dot menu button */}
                            <div className="absolute top-4 right-2">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        setOpenDropdownId(openDropdownId === contact.id ? null : contact.id)
                                        setDeleteConfirmId(null)
                                        setEditingContactId(null)
                                        setEditingName('')
                                    }}
                                    className="p-2 hover:bg-muted/50 rounded-lg transition-colors"
                                >
                                    <MoreVertical className="h-4 w-4 text-muted-foreground" />
                                </button>

                                {/* Dropdown menu */}
                                {openDropdownId === contact.id && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute right-0 top-10 bg-card border border-border rounded-lg shadow-lg z-50 min-w-[200px] overflow-hidden"
                                    >
                                        {editingContactId === contact.id ? (
                                            /* Edit Name Input */
                                            <div className="p-3">
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={editingName}
                                                        onChange={(e) => setEditingName(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') {
                                                                handleUpdateContactName(contact.id, editingName)
                                                            } else if (e.key === 'Escape') {
                                                                setEditingContactId(null)
                                                                setEditingName('')
                                                            }
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        autoFocus
                                                        className="flex-1 px-3 py-2 bg-background border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                                                        placeholder="Novo nome..."
                                                    />
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            handleUpdateContactName(contact.id, editingName)
                                                        }}
                                                        className="px-3 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg transition-colors"
                                                    >
                                                        <Check className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : deleteConfirmId === contact.id ? (
                                            /* Delete Confirmation */
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleDeleteConversation(contact.id, contact.name)
                                                }}
                                                className="w-full px-4 py-2.5 text-left text-sm hover:bg-destructive hover:text-destructive-foreground bg-destructive/10 text-destructive transition-colors flex items-center gap-2 font-medium"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Confirmar Exclusão?
                                            </button>
                                        ) : (
                                            /* Menu Options */
                                            <>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingContactId(contact.id)
                                                        setEditingName(contact.name)
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2 border-b border-border/50"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Editar Nome
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setDeleteConfirmId(contact.id)
                                                    }}
                                                    className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted/50 transition-colors flex items-center gap-2"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Excluir Conversa
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}


                    {/* Empty States */}
                    {activeTab === 'mine' && initialMyChats?.length === 0 && (
                        <div className="p-8 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground text-sm">Você não tem atendimentos ativos.</p>
                        </div>
                    )}
                    {activeTab === 'awaiting' && initialAwaitingChats?.length === 0 && (
                        <div className="p-8 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-success/10 flex items-center justify-center mx-auto mb-4">
                                <span className="text-2xl">🎉</span>
                            </div>
                            <p className="text-muted-foreground text-sm">Fila vazia!</p>
                        </div>
                    )}
                    {activeTab === 'finished' && initialFinishedChats?.length === 0 && (
                        <div className="p-8 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground text-sm">Nenhum atendimento finalizado.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT AREA: Chat Window */}
            <div className="flex-1 flex flex-col bg-background/50">
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="h-[72px] border-b border-border/50 flex items-center px-6 justify-between bg-card/50 backdrop-blur-md">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-primary via-primary/80 to-accent/60 flex items-center justify-center text-primary-foreground font-bold overflow-hidden shadow-lg shadow-primary/20">
                                    {selectedContact.avatar_url ? (
                                        <img src={selectedContact.avatar_url} alt={selectedContact.name} className="h-full w-full object-cover" />
                                    ) : (
                                        selectedContact.name.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-foreground text-lg">{selectedContact.name}</h3>
                                    <p className="text-xs text-muted-foreground font-mono">{selectedContact.phone}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {activeTab === 'awaiting' && (
                                    <button
                                        onClick={async () => {
                                            await assignChat(selectedContact.id)
                                            setActiveTab('mine') // Optimistic switch
                                        }}
                                        className="bg-warning hover:bg-warning/90 text-warning-foreground px-4 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-warning/20 transition-all duration-200"
                                    >
                                        Assumir Atendimento
                                    </button>
                                )}

                                {activeTab === 'mine' && (
                                    <>
                                        <button
                                            onClick={handleFinishChat}
                                            className="bg-success hover:bg-success/90 text-success-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200 shadow-lg shadow-success/20"
                                            title="Finalizar Atendimento"
                                        >
                                            <CheckCircle className="h-4 w-4" /> Finalizar
                                        </button>
                                        {members.length > 0 && (
                                            <button
                                                onClick={() => setShowTransferDialog(true)}
                                                className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200"
                                            >
                                                <ArrowRight className="h-4 w-4" /> Transferir
                                            </button>
                                        )}
                                        {!showDetailsPanel && (
                                            <button
                                                onClick={() => setShowDetailsPanel(true)}
                                                className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200"
                                                title="Mostrar Detalhes"
                                            >
                                                <User className="h-4 w-4" /> Detalhes
                                            </button>
                                        )}
                                    </>
                                )}

                                {activeTab === 'finished' && (
                                    <button
                                        onClick={handleReopenChat}
                                        className="bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all duration-200"
                                    >
                                        <RotateCcw className="h-4 w-4" /> Reabrir
                                    </button>
                                )}

                            </div>
                        </div>

                        {/* Messages Area */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 p-6 overflow-y-auto space-y-4"
                            onScroll={handleScroll}
                        >
                            {isLoadingMessages ? (
                                <div className="flex h-full items-center justify-center flex-col text-muted-foreground gap-4 animate-fade-in">
                                    <div className="h-20 w-20 rounded-2xl bg-primary/10 flex items-center justify-center relative">
                                        <Loader2 className="h-10 w-10 text-primary animate-spin" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-medium text-foreground">Carregando mensagens...</p>
                                        <p className="text-xs text-muted-foreground mt-1">Aguarde um momento</p>
                                    </div>
                                </div>
                            ) : groupedMessages.length === 0 ? (
                                <div className="flex h-full items-center justify-center flex-col text-muted-foreground gap-3">
                                    <div className="h-20 w-20 rounded-2xl bg-muted/30 flex items-center justify-center">
                                        <MessageCircle className="h-10 w-10 opacity-30" />
                                    </div>
                                    <p className="text-sm">Inicie a conversa ou aguarde mensagens.</p>
                                </div>
                            ) : (
                                groupedMessages.map((item, index) => {
                                    const prevItem = index > 0 ? groupedMessages[index - 1] : null
                                    const showDateSeparator = !prevItem ||
                                        new Date(item.createdAt).toDateString() !== new Date(prevItem.createdAt).toDateString()

                                    return (
                                        <div key={item.type === 'single' ? item.message.id : item.firstMessageId}>
                                            {showDateSeparator && (
                                                <div className="flex justify-center my-6">
                                                    <span className="text-xs font-bold text-muted-foreground/60 bg-muted/30 px-3 py-1 rounded-full uppercase tracking-wider">
                                                        {formatDateForSeparator(item.createdAt)}
                                                    </span>
                                                </div>
                                            )}

                                            {item.type === 'image-group' ? (
                                                <div
                                                    className={cn("flex animate-fade-in", item.senderType === 'user' ? "justify-end" : "justify-start")}
                                                    style={{ animationDelay: `${index * 20}ms` }}
                                                >
                                                    <div
                                                        className={cn(
                                                            "p-2 rounded-2xl shadow-sm transition-all duration-200",
                                                            item.senderType === 'user'
                                                                ? 'bg-primary rounded-tr-md'
                                                                : 'bg-card rounded-tl-md border border-border/50'
                                                        )}
                                                    >
                                                        <MessageImageGroup
                                                            images={item.images}
                                                            onOpenGallery={(idx) => openGallery(item.images, idx)}
                                                            isFromUser={item.senderType === 'user'}
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                // Render single message (non-image or audio)
                                                <div
                                                    className={cn("flex animate-fade-in", item.message.sender_type === 'user' ? "justify-end" : "justify-start")}
                                                    style={{ animationDelay: `${index * 20}ms` }}
                                                >
                                                    <div
                                                        className={cn(
                                                            "p-4 rounded-2xl max-w-[75%] shadow-sm transition-all duration-200",
                                                            item.message.sender_type === 'user'
                                                                ? 'bg-primary text-primary-foreground rounded-tr-md'
                                                                : 'bg-card text-foreground rounded-tl-md border border-border/50'
                                                        )}
                                                    >
                                                        {item.message.body && item.message.media_type !== 'audio' && (
                                                            <p className="leading-relaxed">{item.message.body}</p>
                                                        )}

                                                        {item.message.media_type === 'audio' && item.message.media_url && (
                                                            <AudioPlayer
                                                                src={item.message.media_url}
                                                                isFromUser={item.message.sender_type === 'user'}
                                                            />
                                                        )}

                                                        {item.message.media_type === 'video' && item.message.media_url && (
                                                            <div className="rounded-lg overflow-hidden max-w-[280px]">
                                                                <video controls src={item.message.media_url} className="w-full" />
                                                            </div>
                                                        )}

                                                        {item.message.media_type === 'document' && item.message.media_url && (
                                                            <a
                                                                href={item.message.media_url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className={cn(
                                                                    "flex items-center gap-3 p-3 rounded-xl border transition-colors max-w-[280px]",
                                                                    item.message.sender_type === 'user'
                                                                        ? "bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20"
                                                                        : "bg-muted hover:bg-muted/80 border-border/50"
                                                                )}
                                                            >
                                                                <div className={cn(
                                                                    "h-10 w-10 rounded-lg flex items-center justify-center flex-shrink-0",
                                                                    item.message.sender_type === 'user' ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
                                                                )}>
                                                                    <FileText className="h-5 w-5" />
                                                                </div>
                                                                <div className="overflow-hidden">
                                                                    <p className="font-medium text-sm truncate">{item.message.body?.replace('Arquivo: ', '') || 'Documento'}</p>
                                                                    <p className="text-[10px] opacity-70 uppercase">Documento</p>
                                                                </div>
                                                                <Download className="h-4 w-4 opacity-70 ml-auto" />
                                                            </a>
                                                        )}

                                                        <div className="flex items-center justify-end gap-1 mt-1">
                                                            <span className={cn(
                                                                "text-[10px]",
                                                                item.message.sender_type === 'user'
                                                                    ? "text-primary-foreground/70"
                                                                    : "text-muted-foreground"
                                                            )}>
                                                                {formatTime(item.message.created_at)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area (Only if "Mine") */}
                        {activeTab === 'mine' ? (
                            <div className="p-4 bg-card/50 border-t border-border/50">
                                <form
                                    className="flex gap-3 items-end"
                                    onSubmit={async (e) => {
                                        e.preventDefault()
                                        if (mediaFiles.length > 0) {
                                            await handleSendMedia()
                                        } else if (inputText.trim()) {
                                            const messageBody = inputText
                                            setInputText('')

                                            // OPTIMISTIC UI: Add message to list immediately
                                            const optimisticMessage: Message = {
                                                id: `temp-${Date.now()}`, // Temporary ID
                                                body: messageBody,
                                                sender_type: 'user',
                                                created_at: new Date().toISOString(),
                                                media_url: null,
                                                media_type: null
                                            }
                                            setMessages(prev => [...prev, optimisticMessage])
                                            // Scroll to bottom after sending message
                                            requestAnimationFrame(() => {
                                                scrollToBottom('smooth')
                                            })

                                            // Send in background (don't await to not block UI)
                                            sendMessage(selectedContact.id, messageBody, orgId).catch(() => {
                                                // On failure, could mark message as failed or remove it
                                                // For now, the polling will eventually sync the real state
                                                toast.error('Erro ao enviar mensagem')
                                            })
                                        }
                                    }}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        // Accept images, videos, pdfs, docs, spreadsheets, text
                                        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain"
                                        multiple
                                        onChange={handleFileSelect}
                                    />

                                    {/* ATTACHMENT BUTTON */}
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="p-3 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all duration-200 mb-[1px]"
                                        title="Anexar Imagem"
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </button>

                                    {/* MIC BUTTON */}
                                    <button
                                        type="button"
                                        onClick={isRecording ? stopRecording : startRecording}
                                        className={cn(
                                            "p-3 rounded-xl transition-all duration-200 mb-[1px]",
                                            isRecording
                                                ? "bg-destructive/20 text-destructive animate-pulse"
                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                        )}
                                        title={isRecording ? "Parar gravação" : "Gravar Áudio"}
                                    >
                                        {isRecording ? <div className="h-5 w-5 bg-current rounded-sm scale-50" /> : <Mic className="h-5 w-5" />}
                                    </button>

                                    {/* INPUT / PREVIEW AREA */}
                                    <div className="flex-1 relative">
                                        {mediaFiles.length > 0 ? (
                                            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-xl border border-primary/30 overflow-x-auto">
                                                {mediaFiles.map((media, index) => (
                                                    <div key={index} className="relative group min-w-fit">
                                                        {media.type === 'image' ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={media.preview}
                                                                alt={`Preview ${index}`}
                                                                className="h-12 w-12 object-cover rounded-lg border border-border/50"
                                                            />
                                                        ) : media.type === 'video' ? (
                                                            <div className="relative h-12 w-12 rounded-lg border border-border/50 overflow-hidden bg-black/10">
                                                                <video src={media.preview} className="h-full w-full object-cover" />
                                                                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                                                    <Play className="h-4 w-4 text-white fill-white" />
                                                                </div>
                                                            </div>
                                                        ) : media.type === 'document' ? (
                                                            <div className="flex flex-col items-center justify-center h-12 w-16 bg-primary/10 rounded-lg border border-primary/30 p-1">
                                                                <FileText className="h-4 w-4 text-primary mb-0.5" />
                                                                <span className="text-[8px] text-primary truncate w-full text-center">{media.file.name.slice(0, 8)}...</span>
                                                            </div>
                                                        ) : (
                                                            <div className="flex items-center justify-center h-12 w-12 bg-primary/10 rounded-lg border border-primary/30">
                                                                <Mic className="h-5 w-5 text-primary" />
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                                                            className="absolute -top-1.5 -right-1.5 p-1 bg-destructive rounded-full text-destructive-foreground opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaFiles([])}
                                                    className="sticky right-0 ml-2 p-2 hover:bg-destructive/10 rounded-full text-muted-foreground hover:text-destructive transition-colors"
                                                    title="Limpar tudo"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                {showQuickCommands && (
                                                    <div className="absolute bottom-full left-0 w-full mb-2 bg-popover border border-border rounded-xl shadow-lg max-h-60 overflow-y-auto z-10 p-1">
                                                        {filteredCommands.map((cmd) => (
                                                            <button
                                                                key={cmd.id}
                                                                type="button"
                                                                onClick={() => selectQuickMessage(cmd.content)}
                                                                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-accent hover:text-accent-foreground flex flex-col gap-1 transition-colors"
                                                            >
                                                                <span className="font-bold font-mono text-primary text-xs">/{cmd.title}</span>
                                                                <span className="text-muted-foreground line-clamp-1 text-xs">{cmd.content}</span>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <input
                                                    value={inputText}
                                                    onChange={handleInputChange}
                                                    placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem... (Use / para mensagens rápidas)"}
                                                    disabled={isRecording}
                                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                                                />
                                            </>
                                        )}
                                    </div>

                                    {/* SEND BUTTON */}
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() && mediaFiles.length === 0}
                                        className={cn(
                                            "p-3.5 rounded-xl transition-all duration-200 mb-[1px]",
                                            (!inputText.trim() && mediaFiles.length === 0)
                                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                                : "bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20"
                                        )}
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-4 bg-card/50 border-t border-border/50 text-center text-muted-foreground text-sm">
                                <p className="py-2">Você precisa assumir este chat para responder.</p>
                            </div>
                        )}

                    </>
                ) : (
                    <div className="flex h-full items-center justify-center flex-col text-muted-foreground">
                        <div className="h-24 w-24 rounded-3xl bg-muted/30 flex items-center justify-center mb-6">
                            <MessageSquare className="h-12 w-12 opacity-20" />
                        </div>
                        <p className="text-lg font-medium">Selecione um contato para abrir o chat.</p>
                        <p className="text-sm mt-2 opacity-70">Suas conversas aparecerão aqui.</p>
                    </div>
                )}
            </div>

            {/* RIGHT SIDEBAR DETAILS (Optional/Toggleable) */}
            {selectedContact && showDetailsPanel && (
                <ContactDetailsPanel contact={selectedContact} messages={messages} onClose={() => setShowDetailsPanel(false)} />
            )}

            {/* Transfer Dialog */}
            {showTransferDialog && selectedContact && (
                <TransferChatDialog
                    contactId={selectedContact.id}
                    contactName={selectedContact.name}
                    members={members}
                    onClose={() => setShowTransferDialog(false)}
                />
            )}

            {/* New Chat Dialog */}
            <NewChatDialog
                open={showNewChatDialog}
                onClose={() => setShowNewChatDialog(false)}
                onChatCreated={(contactId) => {
                    // Refresh server data to show new contact using Next.js router
                    router.refresh()
                    // Optionally set selected contact immediately if we can
                    // setSelectedContact({ id: contactId, ... }) - complex because we need full object
                }}
                orgId={orgId}

            />

            {/* Image Gallery Dialog (Lightbox with slider) */}
            <ImageGalleryDialog
                isOpen={showGallery}
                images={galleryImages}
                initialIndex={galleryInitialIndex}
                onClose={() => setShowGallery(false)}
            />

        </div>
    )
}
