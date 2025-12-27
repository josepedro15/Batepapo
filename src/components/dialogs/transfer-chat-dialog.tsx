'use client'

import { useState } from 'react'
import { X, ArrowRight } from 'lucide-react'
import { transferChat } from '@/app/dashboard/chat/transfer-action'
import { toast } from 'sonner'

export function TransferChatDialog({
    contactId,
    contactName,
    members,
    onClose
}: {
    contactId: string
    contactName: string
    members: any[]
    onClose: () => void
}) {
    const [loading, setLoading] = useState(false)
    const [selectedUserId, setSelectedUserId] = useState('')

    async function handleTransfer() {
        if (!selectedUserId) {
            toast.error('Selecione um atendente')
            return
        }

        setLoading(true)
        try {
            await transferChat(contactId, selectedUserId)
            toast.success('Chat transferido com sucesso!')
            onClose()
        } catch (error) {
            toast.error('Erro ao transferir chat')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="glass p-6 rounded-2xl border border-white/5 w-full max-w-md">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Transferir Chat</h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="mb-6">
                    <p className="text-slate-400 text-sm">
                        Transferir o contato <strong className="text-white">{contactName}</strong> para:
                    </p>
                </div>

                <div className="space-y-2 mb-6">
                    {members?.map((member) => (
                        <button
                            key={member.user_id}
                            onClick={() => setSelectedUserId(member.user_id)}
                            className={`w-full flex items-center justify-between p-4 rounded-xl transition-all ${selectedUserId === member.user_id
                                    ? 'bg-violet-600 text-white'
                                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                                }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${selectedUserId === member.user_id ? 'bg-white/20' : 'bg-violet-600'
                                    }`}>
                                    <span className="text-sm font-bold">
                                        {member.profiles?.name?.charAt(0) || '?'}
                                    </span>
                                </div>
                                <div className="text-left">
                                    <p className="font-medium">{member.profiles?.name || 'Usuário'}</p>
                                    <p className={`text-xs ${selectedUserId === member.user_id ? 'text-violet-200' : 'text-slate-500'}`}>
                                        {member.role === 'owner' ? 'Gestor' : member.role === 'manager' ? 'Manager' : 'Atendente'}
                                    </p>
                                </div>
                            </div>
                            {selectedUserId === member.user_id && (
                                <ArrowRight className="h-5 w-5" />
                            )}
                        </button>
                    ))}

                    {members?.length === 0 && (
                        <p className="text-center text-slate-500 py-4">
                            Nenhum outro membro disponível
                        </p>
                    )}
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={handleTransfer}
                        disabled={loading || !selectedUserId}
                        className="flex-1 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all"
                    >
                        {loading ? 'Transferindo...' : 'Transferir'}
                    </button>
                </div>
            </div>
        </div>
    )
}
