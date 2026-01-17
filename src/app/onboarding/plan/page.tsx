'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Sparkles, Users, MessageSquare, BarChart3, LogOut, AlertTriangle } from 'lucide-react'
import { logout } from '@/app/dashboard/logout-action'

type Plan = {
    id: string
    name: string
    description: string
    price: number
    priceId: string
    trialDays: number
    limits: {
        users: number
        contacts: number
        pipelines: number
    }
    features: string[]
}

export default function PlanSelectionPage() {
    const [loading, setLoading] = useState<string | null>(null)
    const [plans, setPlans] = useState<Plan[]>([])
    const [loadingPlans, setLoadingPlans] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const res = await fetch('/api/plans')
            if (!res.ok) throw new Error('Failed to load plans')
            const data = await res.json()
            setPlans(data)
        } catch (err) {
            console.error('Error fetching plans:', err)
            setError('Não foi possível carregar os planos. Tente novamente.')
        } finally {
            setLoadingPlans(false)
        }
    }

    const handleSelectPlan = async (planId: string, priceId: string) => {
        setLoading(planId)

        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ priceId }),
            })

            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                console.error('Checkout error:', data.error)
                setError('Erro ao iniciar checkout. Tente novamente.')
            }
        } catch (error) {
            console.error('Failed to start checkout:', error)
            setError('Erro ao processar. Tente novamente.')
        } finally {
            setLoading(null)
        }
    }

    // Determine which plan should be highlighted as popular (highest price or first with > 1 user limit)
    const popularPlanId = plans.length > 1
        ? plans.reduce((prev, curr) => curr.price > prev.price ? curr : prev).id
        : plans[0]?.id

    if (loadingPlans) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando planos...</p>
                </div>
            </div>
        )
    }

    if (error && plans.length === 0) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-8">
                <div className="text-center">
                    <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-foreground mb-2">Erro ao carregar planos</h2>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button
                        onClick={() => { setError(null); setLoadingPlans(true); fetchPlans(); }}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg"
                    >
                        Tentar novamente
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative">
            <button
                onClick={() => logout()}
                className="absolute top-4 right-4 flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors px-4 py-2 rounded-lg hover:bg-white/5"
            >
                <LogOut className="h-4 w-4" />
                Sair da conta
            </button>

            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <Sparkles className="h-4 w-4" />
                    {plans[0]?.trialDays || 7} dias grátis em todos os planos
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    Escolha seu plano
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Comece com {plans[0]?.trialDays || 7} dias grátis. Cancele quando quiser.
                </p>
            </div>

            {plans.length === 0 ? (
                <div className="text-center py-12">
                    <AlertTriangle className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <p className="text-muted-foreground">Nenhum plano disponível no momento.</p>
                </div>
            ) : (
                <div className={`grid gap-8 max-w-5xl w-full ${plans.length === 1 ? 'md:grid-cols-1 max-w-lg' : plans.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-3'}`}>
                    {plans.map((plan) => {
                        const isPopular = plan.id === popularPlanId && plans.length > 1
                        return (
                            <div
                                key={plan.id}
                                className={`relative glass p-8 rounded-2xl border-2 transition-all ${isPopular
                                    ? 'border-primary shadow-xl shadow-primary/20'
                                    : 'border-white/10 hover:border-white/20'
                                    }`}
                            >
                                {isPopular && (
                                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                                        Mais Popular
                                    </div>
                                )}

                                <div className="mb-6">
                                    <h2 className="text-2xl font-bold text-foreground mb-2">
                                        {plan.name}
                                    </h2>
                                    <p className="text-muted-foreground text-sm">
                                        {plan.description}
                                    </p>
                                </div>

                                <div className="mb-6">
                                    <span className="text-4xl font-bold text-foreground">
                                        R$ {plan.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-muted-foreground">/mês</span>
                                </div>

                                {/* Quick Stats */}
                                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-white/5 rounded-xl">
                                    <div className="text-center">
                                        <Users className="h-5 w-5 mx-auto text-primary mb-1" />
                                        <p className="text-foreground font-bold">{plan.limits.users}</p>
                                        <p className="text-xs text-muted-foreground">Atendentes</p>
                                    </div>
                                    <div className="text-center">
                                        <MessageSquare className="h-5 w-5 mx-auto text-primary mb-1" />
                                        <p className="text-foreground font-bold">{plan.limits.contacts >= 1000 ? `${(plan.limits.contacts / 1000).toFixed(0)}k` : plan.limits.contacts}</p>
                                        <p className="text-xs text-muted-foreground">Contatos</p>
                                    </div>
                                    <div className="text-center">
                                        <BarChart3 className="h-5 w-5 mx-auto text-primary mb-1" />
                                        <p className="text-foreground font-bold">{plan.limits.pipelines}</p>
                                        <p className="text-xs text-muted-foreground">Pipelines</p>
                                    </div>
                                </div>

                                <ul className="space-y-3 mb-8">
                                    {plan.features.slice(3).map((feature, idx) => (
                                        <li key={idx} className="flex items-center gap-3 text-sm">
                                            <Check className="h-5 w-5 text-success flex-shrink-0" />
                                            <span className="text-foreground">{feature}</span>
                                        </li>
                                    ))}
                                    <li className="flex items-center gap-3 text-sm">
                                        <Check className="h-5 w-5 text-success flex-shrink-0" />
                                        <span className="text-foreground">{plan.trialDays} dias de trial</span>
                                    </li>
                                </ul>

                                <button
                                    onClick={() => handleSelectPlan(plan.id, plan.priceId)}
                                    disabled={loading !== null}
                                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${isPopular
                                        ? 'bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/30'
                                        : 'bg-white/10 hover:bg-white/20 text-foreground'
                                        } disabled:opacity-50`}
                                >
                                    {loading === plan.id ? (
                                        <>
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        `Começar com ${plan.name}`
                                    )}
                                </button>
                            </div>
                        )
                    })}
                </div>
            )}

            <p className="text-muted-foreground text-sm mt-8 text-center">
                Ao continuar, você concorda com nossos{' '}
                <a href="#" className="text-primary underline">Termos de Uso</a>
                {' '}e{' '}
                <a href="#" className="text-primary underline">Política de Privacidade</a>
            </p>
        </div>
    )
}
