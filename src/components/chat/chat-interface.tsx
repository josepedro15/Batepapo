'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { assignChat, sendMessage, finishChat, reopenChat, getMessages, syncProfilePictures, sendMedia } from '@/app/dashboard/chat/actions'
import { cn } from '@/lib/utils'
import { User, MessageSquare, Send, Clock, ArrowRight, CheckCircle, RotateCcw, Plus, RefreshCw, Paperclip, Mic, X, ImageIcon } from 'lucide-react'
import { TransferChatDialog } from '@/components/dialogs/transfer-chat-dialog'
import { NewChatDialog } from '@/components/dialogs/new-chat-dialog'
import { ContactDetailsPanel } from '@/components/chat/contact-details-panel'
import { toast } from 'sonner'
import { ImageDialog } from '@/components/dialogs/image-dialog'

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
    const [clickedImage, setClickedImage] = useState<string | null>(null)
    const fileInputRef = useRef<HTMLInputElement>(null)
    const mediaRecorderRef = useRef<MediaRecorder | null>(null)
    const chunksRef = useRef<Blob[]>([])

    const messagesEndRef = useRef<HTMLDivElement>(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    // Media Handlers
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
            const mediaRecorder = new MediaRecorder(stream)
            mediaRecorderRef.current = mediaRecorder
            chunksRef.current = []

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) chunksRef.current.push(e.data)
            }

            mediaRecorder.onstop = () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/ogg; codecs=opus' })
                const file = new File([blob], 'recording.ogg', { type: 'audio/ogg' })
                setMediaFiles(prev => [...prev, {
                    file,
                    preview: URL.createObjectURL(blob),
                    type: 'audio'
                }])
                stream.getTracks().forEach(track => track.stop())
            }

            mediaRecorder.start()
            setIsRecording(true)
        } catch (err) {
            console.error('Error accessing microphone:', err)
            toast.error('Erro ao acessar microfone')
        }
    }

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop()
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

        // 1. Load initial history
        getMessages(selectedContact.id).then(msgs => {
            setMessages(msgs || [])
        })

        // 2. Polling fallback (since Realtime has connection issues)
        // Refresh messages every 3 seconds
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
        }, 3000)

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

    return (
        <div className="flex h-full gap-6 rounded-2xl overflow-hidden glass border border-white/5">

            {/* LEFT SIDEBAR: Contact List */}
            <div className="w-80 flex flex-col border-r border-white/5 bg-slate-900/30">
                {/* Header with New Chat button */}
                <div className="p-3 border-b border-white/5">
                    <button
                        onClick={() => setShowNewChatDialog(true)}
                        className="w-full bg-violet-600 hover:bg-violet-500 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                        <Plus className="h-4 w-4" />
                        Nova Conversa
                    </button>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-white/5 overflow-x-auto scrollbar-hide">
                    <button
                        onClick={() => { setActiveTab('mine'); setSelectedContact(null) }}
                        className={cn("px-4 py-4 text-sm font-bold transition-colors whitespace-nowrap flex-shrink-0", activeTab === 'mine' ? "text-violet-400 border-b-2 border-violet-500 bg-white/5" : "text-slate-500 hover:text-slate-300")}
                    >
                        Meus ({initialMyChats?.length || 0})
                    </button>
                    <button
                        onClick={() => { setActiveTab('awaiting'); setSelectedContact(null) }}
                        className={cn("px-4 py-4 text-sm font-bold transition-colors whitespace-nowrap flex-shrink-0", activeTab === 'awaiting' ? "text-amber-400 border-b-2 border-amber-500 bg-white/5" : "text-slate-500 hover:text-slate-300")}
                    >
                        Fila ({initialAwaitingChats?.length || 0})
                    </button>
                    {(userRole === 'owner' || userRole === 'manager') && (
                        <button
                            onClick={() => { setActiveTab('all'); setSelectedContact(null) }}
                            className={cn("px-4 py-4 text-sm font-bold transition-colors whitespace-nowrap flex-shrink-0", activeTab === 'all' ? "text-cyan-400 border-b-2 border-cyan-500 bg-white/5" : "text-slate-500 hover:text-slate-300")}
                        >
                            Todos ({initialAllChats?.length || 0})
                        </button>
                    )}
                    <button
                        onClick={() => { setActiveTab('finished'); setSelectedContact(null) }}
                        className={cn("px-4 py-4 text-sm font-bold transition-colors whitespace-nowrap flex-shrink-0", activeTab === 'finished' ? "text-emerald-400 border-b-2 border-emerald-500 bg-white/5" : "text-slate-500 hover:text-slate-300")}
                    >
                        Finalizados ({initialFinishedChats?.length || 0})
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {(activeTab === 'mine' ? initialMyChats : activeTab === 'awaiting' ? initialAwaitingChats : activeTab === 'all' ? initialAllChats : initialFinishedChats)?.map(contact => (
                        <button
                            key={contact.id}
                            onClick={() => setSelectedContact(contact)}
                            className={cn(
                                "w-full text-left p-4 hover:bg-white/5 transition-colors border-b border-white/5",
                                selectedContact?.id === contact.id ? "bg-violet-500/10 border-l-2 border-l-violet-500" : ""
                            )}
                        >
                            <div className="flex items-center gap-3 mb-1">
                                <div className="relative h-10 w-10 flex-shrink-0">
                                    {contact.avatar_url ? (
                                        <img src={contact.avatar_url} alt={contact.name} className="h-10 w-10 rounded-full object-cover" />
                                    ) : (
                                        <div className="h-10 w-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-sm">
                                            {contact.name.charAt(0)}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <span className="font-bold text-slate-200 truncate">{contact.name}</span>
                                        {activeTab === 'awaiting' && <Clock className="h-3 w-3 text-amber-500 flex-shrink-0 ml-1" />}
                                        {activeTab === 'finished' && <CheckCircle className="h-3 w-3 text-emerald-500 flex-shrink-0 ml-1" />}
                                    </div>
                                    <p className="text-xs text-slate-500 truncate">{contact.phone}</p>
                                </div>
                            </div>
                        </button>
                    ))}

                    {/* Empty States */}
                    {activeTab === 'mine' && initialMyChats?.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Você não tem atendimentos ativos.
                        </div>
                    )}
                    {activeTab === 'awaiting' && initialAwaitingChats?.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Fila vazia! 🎉
                        </div>
                    )}
                    {activeTab === 'finished' && initialFinishedChats?.length === 0 && (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            Nenhum atendimento finalizado.
                        </div>
                    )}
                </div>
            </div>

            {/* RIGHT AREA: Chat Window */}
            <div className="flex-1 flex flex-col bg-slate-900/20">
                {selectedContact ? (
                    <>
                        {/* Header */}
                        <div className="h-16 border-b border-white/5 flex items-center px-6 justify-between bg-white/5 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-violet-500 to-cyan-500 flex items-center justify-center text-white font-bold overflow-hidden">
                                    {selectedContact.avatar_url ? (
                                        <img src={selectedContact.avatar_url} alt={selectedContact.name} className="h-full w-full object-cover" />
                                    ) : (
                                        selectedContact.name.charAt(0)
                                    )}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">{selectedContact.name}</h3>
                                    <p className="text-xs text-slate-400">{selectedContact.phone}</p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                {activeTab === 'awaiting' && (
                                    <button
                                        onClick={async () => {
                                            await assignChat(selectedContact.id)
                                            setActiveTab('mine') // Optimistic switch
                                        }}
                                        className="bg-amber-500 hover:bg-amber-600 text-black px-4 py-2 rounded-lg text-sm font-bold shadow-lg shadow-amber-500/20 transition-all"
                                    >
                                        Assumir Atendimento
                                    </button>
                                )}

                                {activeTab === 'mine' && (
                                    <>
                                        <button
                                            onClick={handleFinishChat}
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                                            title="Finalizar Atendimento"
                                        >
                                            <CheckCircle className="h-4 w-4" /> Finalizar
                                        </button>
                                        {members.length > 0 && (
                                            <button
                                                onClick={() => setShowTransferDialog(true)}
                                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                                            >
                                                <ArrowRight className="h-4 w-4" /> Transferir
                                            </button>
                                        )}
                                        {!showDetailsPanel && (
                                            <button
                                                onClick={() => setShowDetailsPanel(true)}
                                                className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
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
                                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                                    >
                                        <RotateCcw className="h-4 w-4" /> Reabrir
                                    </button>
                                )}

                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-6 overflow-y-auto space-y-4">
                            {/* Note: This would typically be populated by fetching real messages. 
                   For now, we show a placeholder explanation or empty state until connected. */}
                            {messages.length === 0 ? (
                                <div className="flex h-full items-center justify-center flex-col text-slate-500 gap-2">
                                    <MessageSquare className="h-8 w-8 opacity-20" />
                                    <p>Inicie a conversa ou aguarde mensagens.</p>
                                </div>
                            ) : (
                                messages.map(message => (
                                    <div key={message.id} className={cn("flex", message.sender_type === 'user' ? "justify-end" : "justify-start")}>
                                        <div
                                            className={`
                                                    p-3 rounded-2xl max-w-[80%] 
                                                    ${message.sender_type === 'user'
                                                    ? 'bg-violet-600 text-white rounded-tr-none'
                                                    : 'bg-slate-800 text-slate-200 rounded-tl-none border border-white/10'
                                                }
                                                `}
                                        >
                                            {message.body && message.media_type !== 'audio' && message.media_type !== 'image' && (
                                                <p>{message.body}</p>
                                            )}

                                            {message.media_type === 'audio' && message.media_url && (
                                                <div className="flex items-center gap-2 min-w-[200px]">
                                                    <audio controls className="w-full h-8 max-w-[250px]" src={message.media_url}>
                                                        Your browser does not support the audio element.
                                                    </audio>
                                                </div>
                                            )}

                                            {message.media_type === 'image' && message.media_url && (
                                                <div className="mt-2 mb-1">
                                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                                    <img
                                                        src={message.media_url}
                                                        alt="Imagem"
                                                        className="rounded-lg max-w-[250px] max-h-[300px] object-cover border border-white/10 cursor-pointer hover:opacity-90 transition-opacity"
                                                        loading="lazy"
                                                        onClick={() => setClickedImage(message.media_url || '')}
                                                    />
                                                </div>
                                            )}

                                            <div className="flex items-center justify-end gap-1 mt-1"></div>
                                        </div>
                                    </div>
                                ))
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area (Only if "Mine") */}
                        {activeTab === 'mine' ? (
                            <div className="p-4 bg-slate-900/50 border-t border-white/5">
                                <form
                                    className="flex gap-2 items-end"
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
                                        className="p-3 text-slate-400 hover:text-white hover:bg-white/10 rounded-xl transition-colors mb-[1px]"
                                        title="Anexar Imagem"
                                    >
                                        <Paperclip className="h-5 w-5" />
                                    </button>

                                    {/* MIC BUTTON */}
                                    <button
                                        type="button"
                                        onMouseDown={startRecording}
                                        onMouseUp={stopRecording}
                                        onMouseLeave={stopRecording} // Stop if drag out
                                        className={cn(
                                            "p-3 rounded-xl transition-colors mb-[1px]",
                                            isRecording
                                                ? "bg-red-500/20 text-red-500 animate-pulse"
                                                : "text-slate-400 hover:text-white hover:bg-white/10"
                                        )}
                                        title="Gravar Áudio (Segure para gravar)"
                                    >
                                        <Mic className="h-5 w-5" />
                                    </button>

                                    {/* INPUT / PREVIEW AREA */}
                                    <div className="flex-1 relative">
                                        {mediaFiles.length > 0 ? (
                                            <div className="flex items-center gap-2 p-2 bg-slate-800 rounded-xl border border-violet-500/30 overflow-x-auto">
                                                {mediaFiles.map((media, index) => (
                                                    <div key={index} className="relative group min-w-fit">
                                                        {media.type === 'image' ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={media.preview}
                                                                alt={`Preview ${index}`}
                                                                className="h-12 w-12 object-cover rounded-lg border border-white/10"
                                                            />
                                                        ) : (
                                                            <div className="flex items-center justify-center h-12 w-12 bg-violet-500/20 rounded-lg border border-violet-500/30">
                                                                <Mic className="h-5 w-5 text-violet-400" />
                                                            </div>
                                                        )}
                                                        <button
                                                            type="button"
                                                            onClick={() => setMediaFiles(prev => prev.filter((_, i) => i !== index))}
                                                            className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setMediaFiles([])}
                                                    className="sticky right-0 ml-2 p-1 hover:bg-white/10 rounded-full text-slate-400 hover:text-red-400"
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
                                                className="w-full bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500 outline-none"
                                            />
                                        )}
                                    </div>

                                    {/* SEND BUTTON */}
                                    <button
                                        type="submit"
                                        disabled={!inputText.trim() && mediaFiles.length === 0}
                                        className={cn(
                                            "p-3 rounded-xl transition-colors mb-[1px]",
                                            (!inputText.trim() && mediaFiles.length === 0)
                                                ? "bg-slate-800 text-slate-600 cursor-not-allowed"
                                                : "bg-violet-600 hover:bg-violet-700 text-white"
                                        )}
                                    >
                                        <Send className="h-5 w-5" />
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="p-4 bg-slate-900/50 border-t border-white/5 text-center text-slate-500 text-sm">
                                Você precisa assumir este chat para responder.
                            </div>
                        )}

                    </>
                ) : (
                    <div className="flex h-full items-center justify-center flex-col text-slate-600">
                        <MessageSquare className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg">Selecione um contato para abrir o chat.</p>
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

            {/* Image Dialog (Lightbox) */}
            <ImageDialog
                isOpen={!!clickedImage}
                imageUrl={clickedImage || ''}
                onClose={() => setClickedImage(null)}
            />

        </div>
    )
}
