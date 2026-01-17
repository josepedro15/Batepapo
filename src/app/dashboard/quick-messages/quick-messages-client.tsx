'use client'

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, Edit, Trash2, MessageSquareMore } from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"
import { createQuickMessage, updateQuickMessage, deleteQuickMessage } from "./actions"

type QuickMessage = {
    id: string
    title: string
    content: string
    created_at: string
}

export default function QuickMessagesPage({
    initialMessages,
    orgId
}: {
    initialMessages: QuickMessage[],
    orgId: string
}) {
    const [messages, setMessages] = useState<QuickMessage[]>(initialMessages)
    const [searchQuery, setSearchQuery] = useState("")
    const [isCreateOpen, setIsCreateOpen] = useState(false)
    const [editingMessage, setEditingMessage] = useState<QuickMessage | null>(null)
    const [isLoading, setIsLoading] = useState(false)

    // Form inputs
    const [title, setTitle] = useState("")
    const [content, setContent] = useState("")

    const filteredMessages = messages.filter(msg =>
        msg.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.content.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const resetForm = () => {
        setTitle("")
        setContent("")
        setEditingMessage(null)
    }

    const handleOpenCreate = () => {
        resetForm()
        setIsCreateOpen(true)
    }

    const handleOpenEdit = (msg: QuickMessage) => {
        setEditingMessage(msg)
        setTitle(msg.title)
        setContent(msg.content)
        setIsCreateOpen(true)
    }

    const handleSave = async () => {
        if (!title.trim() || !content.trim()) {
            toast.error("Preencha todos os campos")
            return
        }

        setIsLoading(true)
        try {
            if (editingMessage) {
                // Update
                const res = await updateQuickMessage(editingMessage.id, title, content)
                if (res.success && res.data) {
                    setMessages(prev => prev.map(m => m.id === res.data.id ? res.data : m))
                    toast.success("Mensagem atualizada!")
                    setIsCreateOpen(false)
                } else {
                    toast.error(res.error || "Erro ao atualizar")
                }
            } else {
                // Create
                const res = await createQuickMessage(orgId, title, content)
                if (res.success && res.data) {
                    setMessages(prev => [res.data, ...prev])
                    toast.success("Mensagem criada!")
                    setIsCreateOpen(false)
                } else {
                    toast.error(res.error || "Erro ao criar")
                }
            }
        } catch (err) {
            console.error(err)
            toast.error("Ocorreu um erro")
        } finally {
            setIsLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Tem certeza que deseja excluir esta mensagem?")) return

        const loadingId = toast.loading("Excluindo...")
        try {
            const res = await deleteQuickMessage(id)
            if (res.success) {
                setMessages(prev => prev.filter(m => m.id !== id))
                toast.success("Mensagem excluída", { id: loadingId })
            } else {
                toast.error("Erro ao excluir", { id: loadingId })
            }
        } catch (err) {
            console.error(err)
            toast.error("Ocorreu um erro", { id: loadingId })
        }
    }

    return (
        <div className="flex-1 space-y-8 p-8 max-w-5xl mx-auto animate-fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Mensagens Rápidas</h2>
                    <p className="text-muted-foreground mt-1">
                        Gerencie respostas prontas para seus atendentes usarem no chat (atalho /).
                    </p>
                </div>
                <Button onClick={handleOpenCreate} className="rounded-xl shadow-lg shadow-primary/20">
                    <Plus className="mr-2 h-4 w-4" />
                    Nova Mensagem
                </Button>
            </div>

            <div className="flex items-center space-x-2 bg-card p-2 rounded-xl border shadow-sm max-w-md">
                <Search className="h-5 w-5 text-muted-foreground ml-2" />
                <input
                    className="flex-1 bg-transparent border-none outline-none text-sm p-1"
                    placeholder="Buscar por atalho ou conteúdo..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {filteredMessages.map((msg) => (
                    <div
                        key={msg.id}
                        className="group relative bg-card hover:bg-card/80 border p-6 rounded-2xl transition-all duration-200 hover:shadow-md flex flex-col"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-xs font-bold font-mono">
                                <span>/</span>
                                {msg.title}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-muted"
                                    onClick={() => handleOpenEdit(msg)}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                                    onClick={() => handleDelete(msg.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm line-clamp-4 flex-1 whitespace-pre-wrap">
                            {msg.content}
                        </p>
                    </div>
                ))}

                {filteredMessages.length === 0 && (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-muted-foreground bg-muted/30 rounded-3xl border border-dashed">
                        <div className="h-16 w-16 bg-muted rounded-2xl flex items-center justify-center mb-4">
                            <MessageSquareMore className="h-8 w-8 opacity-20" />
                        </div>
                        <p>Nenhuma mensagem encontrada.</p>
                    </div>
                )}
            </div>

            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingMessage ? "Editar Mensagem" : "Nova Mensagem Rápida"}</DialogTitle>
                        <DialogDescription>
                            Configure o atalho e o conteúdo da mensagem. O atalho será usado com / no chat.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label htmlFor="shortcut" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Atalho
                            </label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-muted-foreground font-mono">/</span>
                                <input
                                    id="shortcut"
                                    value={title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-7 font-mono"
                                    placeholder="exemplo"
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">Ex: digite 'preco' para usar /preco</p>
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="content" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                Conteúdo
                            </label>
                            <textarea
                                id="content"
                                value={content}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setContent(e.target.value)}
                                placeholder="Olá! O preço do nosso serviço é..."
                                className="flex min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={isLoading}>
                            {isLoading ? "Salvando..." : "Salvar"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
