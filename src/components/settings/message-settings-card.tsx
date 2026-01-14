'use client'

import { useState, useEffect, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { MessageSquareText, User, Loader2 } from 'lucide-react'

export function MessageSettingsCard() {
    const [showAttendantName, setShowAttendantName] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [isLoading, setIsLoading] = useState(true)
    const [orgId, setOrgId] = useState<string | null>(null)

    // Fetch current setting on mount
    useEffect(() => {
        const fetchSetting = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: membership } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .single()

            if (!membership) return
            setOrgId(membership.organization_id)

            const { data: org } = await supabase
                .from('organizations')
                .select('show_attendant_name')
                .eq('id', membership.organization_id)
                .single()

            if (org) {
                setShowAttendantName(org.show_attendant_name || false)
            }
            setIsLoading(false)
        }

        fetchSetting()
    }, [])

    const handleToggle = () => {
        if (!orgId) return

        const newValue = !showAttendantName
        setShowAttendantName(newValue)

        startTransition(async () => {
            const supabase = createClient()
            await supabase
                .from('organizations')
                .update({ show_attendant_name: newValue })
                .eq('id', orgId)
        })
    }

    if (isLoading) {
        return (
            <div className="glass p-6 rounded-2xl">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
            </div>
        )
    }

    return (
        <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                    <MessageSquareText className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Mensagens</h3>
                    <p className="text-sm text-muted-foreground">Personalize o envio de mensagens</p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Toggle: Show attendant name */}
                <div 
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300 cursor-pointer group"
                    onClick={handleToggle}
                >
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-gradient-to-br from-primary/20 to-primary/5 rounded-lg flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
                            <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium text-foreground">Exibir nome do atendente</p>
                            <p className="text-xs text-muted-foreground">
                                Envia o nome do atendente antes da mensagem
                            </p>
                        </div>
                    </div>

                    {/* Toggle Switch */}
                    <button
                        type="button"
                        role="switch"
                        aria-checked={showAttendantName}
                        disabled={isPending}
                        className={`
                            relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50
                            ${showAttendantName ? 'bg-primary' : 'bg-muted-foreground/30'}
                            ${isPending ? 'opacity-50' : ''}
                        `}
                    >
                        <span
                            className={`
                                inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform duration-200
                                ${showAttendantName ? 'translate-x-5' : 'translate-x-0.5'}
                            `}
                        />
                    </button>
                </div>

                {/* Preview */}
                {showAttendantName && (
                    <div className="p-4 bg-muted/20 rounded-xl border border-dashed border-border/50">
                        <p className="text-xs text-muted-foreground mb-2">Exemplo de mensagem:</p>
                        <div className="bg-background/50 rounded-lg p-3 font-mono text-sm">
                            <span className="text-primary font-bold">*João:*</span>
                            <br />
                            <br />
                            <span className="text-foreground">Olá, como posso ajudar?</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
