'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { assignChat, sendMessage, finishChat, reopenChat, getMessages } from '@/app/dashboard/chat/actions'
import { cn } from '@/lib/utils'
import { User, MessageSquare, Send, Clock, ArrowRight, CheckCircle, RotateCcw, Plus } from 'lucide-react'
import { TransferChatDialog } from '@/components/dialogs/transfer-chat-dialog'
import { NewChatDialog } from '@/components/dialogs/new-chat-dialog'
import { ContactDetailsPanel } from '@/components/chat/contact-details-panel'
import { toast } from 'sonner' // Assuming toast is available or use console/native alert if not

// Types (simplified for this file)
type Contact = { id: string; name: string; phone: string; tags: string[] | null; last_message_at?: string; avatar_url?: string }
type Message = { id: string; body: string; sender_type: 'user' | 'contact' | 'system'; created_at: string }

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

    const getOriginalTab = (contactId: string) => {
        if (initialMyChats?.find(c => c.id === contactId)) return 'mine'
        if (initialAwaitingChats?.find(c => c.id === contactId)) return 'awaiting'
        if (initialAllChats?.find(c => c.id === contactId)) return 'all'
        if (initialFinishedChats?.find(c => c.id === contactId)) return 'finished'
        return 'mine'
    }

    return (
        <div className="flex h-[calc(100vh-8rem)] gap-6 rounded-2xl overflow-hidden glass border border-white/5">

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
                                messages.map(msg => (
                                    <div key={msg.id} className={cn("flex", msg.sender_type === 'user' ? "justify-end" : "justify-start")}>
                                        <div className={cn(
                                            "max-w-[70%] p-3 rounded-xl text-sm",
                                            msg.sender_type === 'user'
                                                ? "bg-violet-600 text-white rounded-tr-none"
                                                : "bg-slate-800 text-slate-200 rounded-tl-none border border-white/10"
                                        )}>
                                            {msg.body}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Input Area (Only if "Mine") */}
                        {activeTab === 'mine' ? (
                            <div className="p-4 bg-slate-900/50 border-t border-white/5">
                                <form
                                    className="flex gap-2"
                                    onSubmit={async (e) => {
                                        e.preventDefault()
                                        if (!inputText.trim()) return

                                        const messageBody = inputText
                                        setInputText('')

                                        // Send to DB + WhatsApp (all in server action)
                                        await sendMessage(selectedContact.id, messageBody, orgId)
                                    }}
                                >
                                    <input
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 bg-slate-800 border-none rounded-xl px-4 py-3 text-white placeholder:text-slate-600 focus:ring-1 focus:ring-violet-500 outline-none"
                                    />
                                    <button type="submit" className="p-3 bg-violet-600 hover:bg-violet-700 text-white rounded-xl transition-colors">
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

        </div>
    )
}
