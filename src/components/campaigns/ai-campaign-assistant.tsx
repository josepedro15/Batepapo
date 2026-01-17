'use client'

import { useState, useEffect } from 'react'
import { Sparkles, Brain, Copy, RefreshCw, X, AlertCircle } from 'lucide-react'
import { generateCampaignCopy, getRemainingCampaignRequests } from '@/app/dashboard/chat/ai-actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface AICampaignAssistantProps {
    onClose: () => void
    onCopy?: (text: string) => void
}

export function AICampaignAssistant({ onClose, onCopy }: AICampaignAssistantProps) {
    const [targetAudience, setTargetAudience] = useState('')
    const [messageInfo, setMessageInfo] = useState('')
    const [generatedCopy, setGeneratedCopy] = useState('')

    const [loading, setLoading] = useState(false)
    const [usageRemaining, setUsageRemaining] = useState<number | null>(null)

    useEffect(() => {
        loadUsage()
    }, [])

    async function loadUsage() {
        const remaining = await getRemainingCampaignRequests()
        setUsageRemaining(remaining)
    }

    async function handleGenerate() {
        if (!targetAudience.trim() || !messageInfo.trim()) {
            toast.error('Preencha todos os campos.')
            return
        }

        if (usageRemaining === 0) {
            toast.error('Limite diário atingido (5/5).')
            return
        }

        setLoading(true)
        setGeneratedCopy('')

        try {
            const result = await generateCampaignCopy(targetAudience, messageInfo)

            if (result.error) {
                toast.error(result.error)
            } else if (result.suggestion) {
                setGeneratedCopy(result.suggestion)
                toast.success('Copy gerada com sucesso!')
                loadUsage() // Refresh limit
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao gerar copy.')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedCopy)
        toast.success('Copiado para área de transferência')
        if (onCopy) onCopy(generatedCopy)
    }

    return (
        <div className="fixed inset-y-0 right-0 w-96 bg-background/95 backdrop-blur-xl border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="p-5 border-b border-border/50 flex items-center justify-between bg-primary/5">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">IA Copywriter</h3>
                        <p className="text-xs text-muted-foreground">Assistente de Campanhas</p>
                    </div>
                </div>
                <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-lg transition-colors">
                    <X className="h-5 w-5 text-muted-foreground" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Inputs */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            🎯 Público Alvo
                        </label>
                        <textarea
                            value={targetAudience}
                            onChange={(e) => setTargetAudience(e.target.value)}
                            placeholder="Ex: Clientes inativos há mais de 30 dias que compraram sapatos..."
                            className="w-full h-20 bg-muted/50 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                            📝 Sobre a Mensagem
                        </label>
                        <textarea
                            value={messageInfo}
                            onChange={(e) => setMessageInfo(e.target.value)}
                            placeholder="Ex: Oferta de 20% de desconto na nova coleção, válido até sexta-feira..."
                            className="w-full h-24 bg-muted/50 border border-border rounded-xl p-3 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all"
                        />
                    </div>

                    <button
                        onClick={handleGenerate}
                        disabled={loading || usageRemaining === 0}
                        className={cn(
                            "w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg",
                            loading || usageRemaining === 0
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-violet-500/25 active:scale-95"
                        )}
                    >
                        {loading ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Criando Copy...
                            </>
                        ) : (
                            <>
                                <Brain className="h-4 w-4" />
                                Gerar Campanha
                            </>
                        )}
                    </button>
                </div>

                {/* Output */}
                {generatedCopy && (
                    <div className="space-y-3 animate-fade-in">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-bold text-success uppercase flex items-center gap-1.5">
                                ✨ Sugestão Gerada
                            </label>
                            <button
                                onClick={handleCopy}
                                className="text-xs flex items-center gap-1 text-primary hover:text-primary/80 font-medium"
                            >
                                <Copy className="h-3 w-3" />
                                Copiar
                            </button>
                        </div>

                        <div className="bg-background border border-violet-500/20 rounded-xl p-4 shadow-inner relative group">
                            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                                {generatedCopy}
                            </p>
                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent pointer-events-none rounded-xl" />
                        </div>
                    </div>
                )}

                {/* Hints */}
                {!generatedCopy && !loading && (
                    <div className="bg-muted/30 border border-border/50 rounded-xl p-4">
                        <h4 className="text-xs font-bold text-muted-foreground mb-2 flex items-center gap-2">
                            <Sparkles className="h-3 w-3" /> Dicas para melhores resultados:
                        </h4>
                        <ul className="text-[11px] text-muted-foreground space-y-1.5 list-disc pl-4">
                            <li>Seja específico sobre quem vai receber a mensagem.</li>
                            <li>Inclua detalhes sobre a oferta (preço, datas, benefícios).</li>
                            <li>Defina o tom de voz (urgente, amigável, formal).</li>
                        </ul>
                    </div>
                )}
            </div>

            {/* Footer Limit */}
            <div className="p-4 border-t border-border/50 bg-muted/20">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1.5">
                        <AlertCircle className="h-3 w-3" /> Limite Diário
                    </span>
                    <span className="text-xs font-medium text-foreground">
                        {usageRemaining !== null ? usageRemaining : '--'}/5
                    </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all duration-500"
                        style={{ width: usageRemaining !== null ? `${Math.max(0, (usageRemaining / 5) * 100)}%` : '0%' }}
                    />
                </div>
            </div>
        </div>
    )
}
