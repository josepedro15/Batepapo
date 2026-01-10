'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { assignChat, sendMessage, finishChat, reopenChat, getMessages, syncProfilePictures, sendMedia, refreshContactAvatar } from '@/app/dashboard/chat/actions'

// ... existing code ...



// Automatic Sync on Mount (once)
import { cn } from '@/lib/utils'
import { User, MessageSquare, Send, Clock, ArrowRight, CheckCircle, RotateCcw, Plus, RefreshCw, Paperclip, Mic, X, ImageIcon, MessageCircle } from 'lucide-react'
import { TransferChatDialog } from '@/components/dialogs/transfer-chat-dialog'
import { NewChatDialog } from '@/components/dialogs/new-chat-dialog'
import { ContactDetailsPanel } from '@/components/chat/contact-details-panel'
import { toast } from 'sonner'
import { ImageGalleryDialog } from '@/components/dialogs/image-gallery-dialog'
import { MessageImageGroup } from '@/components/chat/message-image-group'
import { AudioPlayer } from '@/components/chat/audio-player'
import MicRecorder from 'mic-recorder-to-mp3'

// Types (simplified for this file)
type Contact = { id: string; name: string; phone: string; tags: string[] | null; last_message_at?: string; avatar_url?: string }
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

    // Media State
    const [isRecording, setIsRecording] = useState(false)
    const [mediaFiles, setMediaFiles] = useState<{ file: File, preview: string, type: 'image' | 'audio' }[]>([])

    // Gallery State
    const [galleryImages, setGalleryImages] = useState<string[]>([])
    const [galleryInitialIndex, setGalleryInitialIndex] = useState(0)
    const [showGallery, setShowGallery] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const recorderRef = useRef<MicRecorder | null>(null)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
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
            const newFiles = Array.from(e.target.files).filter(file => file.type.startsWith('image/'))

            if (newFiles.length === 0) {
                toast.error('Apenas imagens são permitidas')
                return
            }

            const newMediaItems = newFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                type: 'image' as const
            }))

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


    // Scroll of new messages
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    // Realtime Setup
    const supabase = createClient()



    useEffect(() => {
        if (!selectedContact) return

        // Clear messages immediately to avoid showing previous chat
        setMessages([])

        // 1. Load initial history
        getMessages(selectedContact.id).then(msgs => {
            setMessages(msgs || [])
        })

        // 2. Polling fallback (since Realtime has connection issues)
        // Refresh messages every 1 second
        const pollInterval = setInterval(() => {
            getMessages(selectedContact.id).then(newMsgs => {
                if (newMsgs && newMsgs.length > 0) {
                    setMessages(prev => {
                        // Only update if there are new messages
                        if (newMsgs.length !== prev.length) {
                            return newMsgs
                        }
                        return prev
                    })
                }
            })
        }, 1000)

        return () => {
            clearInterval(pollInterval)
        }
    }, [selectedContact])

    // Sync selectedContact when lists update (e.g. after adding a tag)
    useEffect(() => {
        if (selectedContact) {
            const all = [...(initialMyChats || []), ...(initialAwaitingChats || []), ...(initialAllChats || []), ...(initialFinishedChats || [])]
            const updated = all.find(c => c.id === selectedContact.id)
            if (updated && JSON.stringify(updated) !== JSON.stringify(selectedContact)) {
                setSelectedContact(updated)
            }
        }
    }, [initialMyChats, initialAwaitingChats, initialAllChats, initialFinishedChats])

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

    // Automatic Sync on Mount (once)
    useEffect(() => {
        // Run sync after a short delay to let initial chats load
        const timer = setTimeout(async () => {
            console.log('🔄 Starting auto-sync of profile pictures...')
            try {
                const result = await syncProfilePictures()
                console.log('✅ Sync result:', result)
                if (result.success) {
                    console.log(`📸 Updated ${result.updatedCount} profile pictures`)
                    if (result.logs && result.logs.length > 0) {
                        console.groupCollapsed('📝 Sync Details')
                        console.log(result.logs.join('\n'))
                        console.groupEnd()
                    }
                } else {
                    console.warn('⚠️ Sync failed:', result.error)
                }
            } catch (err) {
                console.error('❌ Error calling syncProfilePictures:', err)
            }
        }, 2000)
        return () => clearTimeout(timer)
    }, [])

    const getOriginalTab = (contactId: string) => {
        if (initialMyChats?.find(c => c.id === contactId)) return 'mine'
        if (initialAwaitingChats?.find(c => c.id === contactId)) return 'awaiting'
        if (initialAllChats?.find(c => c.id === contactId)) return 'all'
        if (initialFinishedChats?.find(c => c.id === contactId)) return 'finished'
        return 'mine'
    }

    const tabs = [
        { id: 'mine' as const, label: 'Meus', count: initialMyChats?.length || 0, color: 'primary' },
        { id: 'awaiting' as const, label: 'Fila', count: initialAwaitingChats?.length || 0, color: 'warning' },
        ...(userRole === 'owner' || userRole === 'manager' ? [{ id: 'all' as const, label: 'Todos', count: initialAllChats?.length || 0, color: 'accent' }] : []),
        { id: 'finished' as const, label: 'Finalizados', count: initialFinishedChats?.length || 0, color: 'success' },
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

    // Group consecutive image messages from same sender
    type GroupedMessage = {
        type: 'single'
        message: Message
    } | {
        type: 'image-group'
        senderType: 'user' | 'contact' | 'system'
        images: string[]
        firstMessageId: string
    }

    const groupedMessages = useMemo<GroupedMessage[]>(() => {
        const result: GroupedMessage[] = []
        let currentImageGroup: { senderType: 'user' | 'contact' | 'system'; images: string[]; firstMessageId: string } | null = null

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
                        firstMessageId: message.id
                    }
                }
            } else {
                // Non-image message, close any open image group
                if (currentImageGroup) {
                    result.push({ type: 'image-group', ...currentImageGroup })
                    currentImageGroup = null
                }
                result.push({ type: 'single', message })
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

                {/* Tabs */}
                <div className="flex border-b border-border/50 overflow-x-auto scrollbar-hide">
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

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {(activeTab === 'mine' ? initialMyChats : activeTab === 'awaiting' ? initialAwaitingChats : activeTab === 'all' ? initialAllChats : initialFinishedChats)?.map((contact, index) => (
                        <button
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={cn(
                                "w-full text-left p-4 hover:bg-muted/30 transition-all duration-200 border-b border-border/30 animate-fade-in",
                                selectedContact?.id === contact.id ? "bg-primary/10 border-l-2 border-l-primary" : ""
                            )}
                            style={{ animationDelay: `${index * 30}ms` }}
                        >
                            <div className="flex items-center gap-3 mb-1">
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
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-foreground truncate">{contact.name}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">{contact.phone}</p>
                                </div>
                            </div>
                        </button>
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
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {groupedMessages.length === 0 ? (
                                <div className="flex h-full items-center justify-center flex-col text-muted-foreground gap-3">
                                    <div className="h-20 w-20 rounded-2xl bg-muted/30 flex items-center justify-center">
                                        <MessageCircle className="h-10 w-10 opacity-30" />
                                    </div>
                                    <p className="text-sm">Inicie a conversa ou aguarde mensagens.</p>
                                </div>
                            ) : (
                                groupedMessages.map((item, index) => {
                                    if (item.type === 'image-group') {
                                        // Render grouped images
                                        return (
                                            <div
                                                key={item.firstMessageId}
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
                                        )
                                    } else {
                                        // Render single message (non-image or audio)
                                        const message = item.message
                                        return (
                                            <div
                                                key={message.id}
                                                className={cn("flex animate-fade-in", message.sender_type === 'user' ? "justify-end" : "justify-start")}
                                                style={{ animationDelay: `${index * 20}ms` }}
                                            >
                                                <div
                                                    className={cn(
                                                        "p-4 rounded-2xl max-w-[75%] shadow-sm transition-all duration-200",
                                                        message.sender_type === 'user'
                                                            ? 'bg-primary text-primary-foreground rounded-tr-md'
                                                            : 'bg-card text-foreground rounded-tl-md border border-border/50'
                                                    )}
                                                >
                                                    {message.body && message.media_type !== 'audio' && (
                                                        <p className="leading-relaxed">{message.body}</p>
                                                    )}

                                                    {message.media_type === 'audio' && message.media_url && (
                                                        <AudioPlayer
                                                            src={message.media_url}
                                                            isFromUser={message.sender_type === 'user'}
                                                        />
                                                    )}

                                                    <div className="flex items-center justify-end gap-1 mt-1"></div>
                                                </div>
                                            </div>
                                        )
                                    }
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
                                            await sendMessage(selectedContact.id, messageBody, orgId)
                                        }
                                    }}
                                >
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
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
                                            <input
                                                value={inputText}
                                                onChange={e => setInputText(e.target.value)}
                                                placeholder={isRecording ? "Gravando áudio..." : "Digite sua mensagem..."}
                                                disabled={isRecording}
                                                className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                                            />
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
                <ContactDetailsPanel contact={selectedContact} onClose={() => setShowDetailsPanel(false)} />
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
                    // Refresh page to show new contact
                    window.location.reload()
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
