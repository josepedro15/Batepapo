'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Plus, X, UserPlus } from 'lucide-react'
import { createContact } from '@/app/dashboard/contacts/create-contact-action'
import { toast } from 'sonner'

export function CreateContactDialog() {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [mounted, setMounted] = useState(false)

    // Garante que só renderiza o portal no cliente
    useEffect(() => {
        setMounted(true)
    }, [])

    async function handleSubmit(formData: FormData) {
        setLoading(true)
        try {
            await createContact(formData)
            toast.success('Contato criado com sucesso!')
            setOpen(false)
        } catch (error) {
            toast.error('Erro ao criar contato')
        } finally {
            setLoading(false)
        }
    }

    const modalContent = open && mounted ? createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
            <div className="glass-heavy p-6 rounded-2xl border border-border/50 w-full max-w-md animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                            <UserPlus className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground">Criar Contato</h2>
                    </div>
                    <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form action={handleSubmit} className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground">Nome *</label>
                        <input
                            name="name"
                            placeholder="Ex: João Silva"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Telefone (WhatsApp) *</label>
                        <input
                            name="phone"
                            type="tel"
                            placeholder="5511999999999"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                            required
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">Formato: DDI + DDD + Número sem espaços</p>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Email</label>
                        <input
                            name="email"
                            type="email"
                            placeholder="contato@example.com"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                        />
                    </div>

                    <div>
                        <label className="text-sm font-medium text-foreground">Tags</label>
                        <input
                            name="tags"
                            placeholder="lead, whatsapp, vip"
                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200"
                        />
                        <p className="text-xs text-muted-foreground mt-1.5">Separe por vírgulas</p>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={() => setOpen(false)}
                            className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-xl transition-all duration-200"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                        >
                            {loading ? 'Criando...' : <><Plus className="h-4 w-4" /> Criar Contato</>}
                        </button>
                    </div>
                </form>
            </div>
        </div>,
        document.body
    ) : null

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                className="bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground px-5 py-3 rounded-xl font-bold shadow-lg shadow-primary/20 transition-all duration-300 flex items-center gap-2 hover:shadow-primary/30 active:scale-[0.98]"
            >
                <Plus className="h-5 w-5" /> Novo Contato
            </button>
            {modalContent}
        </>
    )
}
