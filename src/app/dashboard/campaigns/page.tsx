'use client'

import { createCampaign } from './actions'
import { Megaphone, Send, Clock, Zap, Shield, CheckCircle, AlertTriangle, Info, Calendar, Target, BarChart3 } from 'lucide-react'
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
        <div className="min-h-[calc(100vh-6rem)] space-y-8">
            {/* Header com gradiente decorativo */}
            <div className="relative overflow-hidden rounded-2xl glass-heavy p-8">
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Megaphone className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-display text-foreground">Campanhas em Massa</h1>
                            <p className="text-muted-foreground mt-1">Dispare mensagens para seus contatos com segurança.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-success font-medium text-sm">Sistema Ativo</span>
                    </div>
                </div>
            </div>

            {/* Main Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Campaign Form - Takes 2 columns */}
                <div className="lg:col-span-2 glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '100ms' }}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
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
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 hover:bg-muted/70"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-sm font-semibold text-foreground">Data de Envio</label>
                                <div className="relative mt-2">
                                    <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                    <input
                                        type="datetime-local"
                                        className="w-full bg-muted/50 border border-border rounded-xl p-3.5 pl-11 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 hover:bg-muted/70"
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-sm font-semibold text-foreground">Mensagem</label>
                                <span className={cn(
                                    "text-xs font-medium px-2 py-1 rounded-lg transition-colors",
                                    message.length > 250 
                                        ? "text-warning bg-warning/10" 
                                        : "text-muted-foreground bg-muted/50"
                                )}>
                                    {message.length}/300
                                </span>
                            </div>
                            <textarea
                                name="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Olá {{nome}}! Temos uma novidade especial para você..."
                                className="w-full h-40 bg-muted/50 border border-border rounded-xl p-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none transition-all duration-200 hover:bg-muted/70"
                                required
                                maxLength={300}
                            />
                        </div>

                        {/* Warning Banner */}
                        <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
                            <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                                <AlertTriangle className="h-4 w-4 text-warning" />
                            </div>
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
                                "w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3",
                                "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground",
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
                    <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '150ms' }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                <Megaphone className="h-5 w-5 text-primary" />
                            </div>
                            <h3 className="font-bold text-foreground">Como funciona?</h3>
                        </div>

                        <div className="space-y-4">
                            {features.map((feature, index) => (
                                <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all duration-200">
                                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
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
                    <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                                <Info className="h-5 w-5 text-accent" />
                            </div>
                            <h3 className="font-bold text-foreground">Dicas Importantes</h3>
                        </div>

                        <ul className="space-y-3">
                            {tips.map((tip, index) => (
                                <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                                    <span className="h-6 w-6 rounded-lg bg-accent/10 text-accent text-xs flex items-center justify-center shrink-0 font-bold border border-accent/20">
                                        {index + 1}
                                    </span>
                                    <span className="pt-0.5">{tip}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Stats Preview */}
                    <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '250ms' }}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20">
                                <BarChart3 className="h-5 w-5 text-success" />
                            </div>
                            <h3 className="font-bold text-foreground">Última Campanha</h3>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/20 transition-all duration-200">
                                <p className="text-3xl font-bold text-foreground">0</p>
                                <p className="text-xs text-muted-foreground mt-1">Enviadas</p>
                            </div>
                            <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-success/20 transition-all duration-200">
                                <p className="text-3xl font-bold text-success">0%</p>
                                <p className="text-xs text-muted-foreground mt-1">Taxa Entrega</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
