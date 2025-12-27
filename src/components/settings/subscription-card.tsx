'use client'

import { useState } from 'react'
import { CreditCard, Calendar, Users, ExternalLink, Loader2 } from 'lucide-react'

interface SubscriptionCardProps {
    subscription?: {
        planName: string
        status: string
        currentPeriodEnd: string
        limits: {
            users: number
            contacts: number
            pipelines: number
        }
    }
}

export function SubscriptionCard({ subscription }: SubscriptionCardProps) {
    const [loading, setLoading] = useState(false)

    const handleManageSubscription = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/stripe/portal', {
                method: 'POST',
            })
            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            }
        } catch (error) {
            console.error('Failed to open portal:', error)
        } finally {
            setLoading(false)
        }
    }

    if (!subscription) {
        return (
            <div className="glass p-6 rounded-2xl border border-white/5">
                <h3 className="text-lg font-bold text-foreground mb-4">Assinatura</h3>
                <p className="text-muted-foreground">Nenhuma assinatura ativa encontrada.</p>
            </div>
        )
    }

    const statusColors = {
        active: 'bg-success/10 text-success',
        trialing: 'bg-primary/10 text-primary',
        past_due: 'bg-warning/10 text-warning',
        canceled: 'bg-destructive/10 text-destructive',
    }

    const statusLabels = {
        active: 'Ativo',
        trialing: 'Em Trial',
        past_due: 'Pagamento Pendente',
        canceled: 'Cancelado',
    }

    return (
        <div className="glass p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
                        <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">
                            Plano {subscription.planName}
                        </h3>
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[subscription.status as keyof typeof statusColors] || 'bg-slate-500/10 text-slate-500'
                            }`}>
                            {statusLabels[subscription.status as keyof typeof statusLabels] || subscription.status}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mb-6">
                <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Atendentes</p>
                    <p className="text-lg font-bold text-foreground flex items-center gap-2">
                        <Users className="h-4 w-4 text-primary" />
                        {subscription.limits.users}
                    </p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Contatos</p>
                    <p className="text-lg font-bold text-foreground">
                        {subscription.limits.contacts.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white/5 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-1">Pipelines</p>
                    <p className="text-lg font-bold text-foreground">
                        {subscription.limits.pipelines}
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                <Calendar className="h-4 w-4" />
                <span>
                    Próxima cobrança: {new Date(subscription.currentPeriodEnd).toLocaleDateString('pt-BR')}
                </span>
            </div>

            <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="w-full bg-white/10 hover:bg-white/20 text-foreground py-3 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
            >
                {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                    <>
                        <ExternalLink className="h-4 w-4" />
                        Gerenciar Assinatura
                    </>
                )}
            </button>
        </div>
    )
}
