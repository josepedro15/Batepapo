'use client'

import { createCampaign } from './actions'
import { Megaphone, Send, Users, Clock, Zap, Shield, CheckCircle, AlertTriangle, Info, Calendar, Target, BarChart3 } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

export default function CampaignsPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [campaignName, setCampaignName] = useState('')
    const [message, setMessage] = useState('')

    const features = [
        {
            icon: Clock,
            title: "Envio Gradual",
            description: "Mensagens enviadas a cada 10-30 segundos"
        },
        {
            icon: Shield,
            title: "Anti-Ban",
            description: "Simula comportamento humano natural"
        },
        {
            icon: Target,
            title: "Segmentação",
            description: "Envie para todos os contatos ativos"
        }
    ]

    const tips = [
        "Evite palavras como 'grátis', 'promoção imperdível' ou 'dinheiro'",
        "Personalize com o nome: Use {{nome}} para inserir o nome do contato",
        "Mantenha mensagens curtas e objetivas (máx. 300 caracteres)",
        "Envie em horários comerciais (8h-18h) para melhor engajamento"
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-display text-foreground">Campanhas em Massa</h1>
                    <p className="text-muted-foreground mt-1">Dispare mensagens para seus contatos com segurança (Throttling).</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-success/10 border border-success/20">
                    <CheckCircle className="h-5 w-5 text-success" />
                    <span className="text-success font-medium text-sm">Sistema Ativo</span>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Form - Takes 2 columns */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Send className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Nova Campanha</h2>
                            <p className="text-sm text-muted-foreground">Configure e dispare sua campanha</p>
                        </div>
                    </div>

                    <form action={async (formData) => {
                        setIsSubmitting(true)
                        await createCampaign(formData)
                        setIsSubmitting(false)
                        setCampaignName('')
                        setMessage('')
                    }} className="space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-semibold text-foreground">Nome da Campanha</label>
                                <input
                                    name="name"
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="Ex: Promoção de Natal"
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground">Data de Envio</label>
                                <div className="relative mt-2">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-muted/50 border border-border rounded-xl p-3.5 pl-11 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-foreground">Mensagem</label>
                                <span className={cn(
                                    "text-xs font-medium",
                                    message.length > 250 ? "text-warning" : "text-muted-foreground"
                                )}>
                                    {message.length}/300
                                </span>
                            </div>
                            <textarea
                                name="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Olá {{nome}}! Temos uma novidade especial para você..."
                                className="w-full h-40 bg-muted/50 border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all"
                                required
                                maxLength={300}
                            />
                        </div>

                        {/* Warning Banner */}
                        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
                            <AlertTriangle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                            <div>
                                <p className="text-warning font-medium text-sm">Atenção ao conteúdo</p>
                                <p className="text-warning/80 text-xs mt-1">
                                    Esta campanha será enviada para <strong>todos</strong> os contatos ativos desta organização.
                                    Revise a mensagem antes de enviar.
                                </p>
                            </div>
                        </div>

                        <button
                            disabled={isSubmitting || !campaignName || !message}
                            className={cn(
                                "w-full py-4 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-3",
                                "bg-primary hover:bg-primary/90 text-primary-foreground",
                                "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                                "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                                "active:scale-[0.99]"
                            )}
                        >
                            <Zap className="h-5 w-5" />
                            {isSubmitting ? 'Processando...' : 'Iniciar Disparo'}
                        </button>
                    </form>
                </div>

                {/* Right Sidebar */}
                <div className="space-y-6">
                    {/* Features Card */}
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Megaphone className="h-5 w-5 text-primary" />
                            <h3 className="font-bold text-foreground">Como funciona?</h3>
                        </div>

                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-3">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <feature.icon className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground text-sm">{feature.title}</p>
                                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tips Card */}
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Info className="h-5 w-5 text-accent" />
                            <h3 className="font-bold text-foreground">Dicas Importantes</h3>
                        </div>

                        <ul className="space-y-3">
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                                    <span className="h-5 w-5 rounded-full bg-accent/10 text-accent text-xs flex items-center justify-center shrink-0 font-bold">
                                        {index + 1}
                                    </span>
                                    {tip}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Stats Preview */}
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 className="h-5 w-5 text-success" />
                            <h3 className="font-bold text-foreground">Última Campanha</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-3 bg-muted/30 rounded-xl">
                                <p className="text-2xl font-bold text-foreground">0</p>
                                <p className="text-xs text-muted-foreground">Enviadas</p>
                            </div>
                            <div className="text-center p-3 bg-muted/30 rounded-xl">
                                <p className="text-2xl font-bold text-success">0%</p>
                                <p className="text-xs text-muted-foreground">Taxa Entrega</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
