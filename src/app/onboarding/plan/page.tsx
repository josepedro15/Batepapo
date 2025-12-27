'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check, Loader2, Sparkles, Users, MessageSquare, BarChart3 } from 'lucide-react'

const plans = [
    {
        id: 'starter',
        name: 'Starter',
        price: 97,
        description: 'Ideal para pequenas equipes começando com CRM',
        features: [
            '3 atendentes',
            '1.000 contatos',
            '2 pipelines',
            'Chat WhatsApp',
            'Kanban CRM',
            'Tags e notas',
            'API de integração',
            '7 dias de trial',
        ],
        limits: {
            users: 3,
            contacts: '1.000',
            pipelines: 2,
        },
        popular: false,
    },
    {
        id: 'pro',
        name: 'Pro',
        price: 197,
        description: 'Para equipes em crescimento que precisam de mais recursos',
        features: [
            '10 atendentes',
            '10.000 contatos',
            '5 pipelines',
            'Tudo do Starter +',
            'Campanhas WhatsApp',
            'Analytics avançado',
            'Webhooks customizados',
            'Suporte prioritário',
        ],
        limits: {
            users: 10,
            contacts: '10.000',
            pipelines: 5,
        },
        popular: true,
    },
]

export default function PlanSelectionPage() {
    const [loading, setLoading] = useState<string | null>(null)
    const router = useRouter()

    const handleSelectPlan = async (planId: string) => {
        setLoading(planId)

        try {
            const response = await fetch('/api/stripe/checkout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ plan: planId }),
            })

            const data = await response.json()

            if (data.url) {
                window.location.href = data.url
            } else {
                console.error('Checkout error:', data.error)
            }
        } catch (error) {
            console.error('Failed to start checkout:', error)
        } finally {
            setLoading(null)
        }
    }

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-6">
                    <Sparkles className="h-4 w-4" />
                    7 dias grátis em todos os planos
                </div>
                <h1 className="text-4xl font-bold text-foreground mb-4">
                    Escolha seu plano
                </h1>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                    Comece com 7 dias grátis. Cancele quando quiser.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 max-w-4xl w-full">
                {plans.map((plan) => (
                    <div
                        key={plan.id}
                        className={`relative glass p-8 rounded-2xl border-2 transition-all ${plan.popular
                                ? 'border-primary shadow-xl shadow-primary/20'
                                : 'border-white/10 hover:border-white/20'
                            }`}
                    >
                        {plan.popular && (
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
                                R$ {plan.price}
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
                                <p className="text-foreground font-bold">{plan.limits.contacts}</p>
                                <p className="text-xs text-muted-foreground">Contatos</p>
                            </div>
                            <div className="text-center">
                                <BarChart3 className="h-5 w-5 mx-auto text-primary mb-1" />
                                <p className="text-foreground font-bold">{plan.limits.pipelines}</p>
                                <p className="text-xs text-muted-foreground">Pipelines</p>
                            </div>
                        </div>

                        <ul className="space-y-3 mb-8">
                            {plan.features.map((feature, idx) => (
                                <li key={idx} className="flex items-center gap-3 text-sm">
                                    <Check className="h-5 w-5 text-success flex-shrink-0" />
                                    <span className="text-foreground">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <button
                            onClick={() => handleSelectPlan(plan.id)}
                            disabled={loading !== null}
                            className={`w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${plan.popular
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
                ))}
            </div>

            <p className="text-muted-foreground text-sm mt-8 text-center">
                Ao continuar, você concorda com nossos{' '}
                <a href="#" className="text-primary underline">Termos de Uso</a>
                {' '}e{' '}
                <a href="#" className="text-primary underline">Política de Privacidade</a>
            </p>
        </div>
    )
}
