'use client'

import { useState, useEffect } from 'react'
import { Brain, Save, RefreshCw, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { getAISettings, updateAISettings } from '@/app/dashboard/settings/actions'
import { cn } from '@/lib/utils'

export function AISettingsCard() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form State
    const [prompt, setPrompt] = useState('')

    useEffect(() => {
        loadSettings()
    }, [])

    async function loadSettings() {
        try {
            const data = await getAISettings()
            if (data) {
                if (data.system_prompt) setPrompt(data.system_prompt)
            }
        } catch (error) {
            console.error('Error loading AI settings:', error)
            toast.error('Erro ao carregar configurações da IA')
        } finally {
            setLoading(false)
        }
    }

    async function handleSave() {
        setSaving(true)
        try {
            const result = await updateAISettings({
                prompt,
                model: 'gpt-4o-mini', // Hardcoded default
                temperature: 0.7 // Default
            })

            if (result.error) {
                toast.error(result.error)
            } else {
                toast.success('Configurações da IA salvas!')
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="glass p-6 rounded-2xl animate-pulse">
                <div className="h-4 bg-muted/50 rounded w-1/4 mb-4"></div>
                <div className="space-y-3">
                    <div className="h-10 bg-muted/50 rounded"></div>
                    <div className="h-32 bg-muted/50 rounded"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="glass p-6 rounded-2xl space-y-6 relative overflow-hidden group">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors duration-500"></div>

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20 shadow-inner">
                        <Brain className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            Configuração do Agente
                            {/* <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-primary/20">Beta</span> */}
                        </h3>
                        <p className="text-sm text-muted-foreground">Personalize as instruções e comportamento (Modelo: GPT-4o Mini)</p>
                    </div>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Prompt Section */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-foreground flex items-center gap-2">
                            <Wand2 className="h-4 w-4 text-primary" />
                            Prompt do Sistema
                        </label>
                        <span className="text-xs text-muted-foreground">Instruções de como a IA deve se comportar</span>
                    </div>
                    <textarea
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="Ex: Você é um vendedor experiente da empresa X. Use tom formal e focado em fechar vendas..."
                        className="w-full min-h-[180px] p-4 rounded-xl bg-background/50 border border-border focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all text-sm resize-y leading-relaxed"
                    />
                </div>


                {/* Footer / Save Button */}
                <div className="pt-4 flex justify-end">
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={cn(
                            "flex items-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 shadow-lg shadow-primary/20",
                            saving
                                ? "bg-muted text-muted-foreground cursor-not-allowed"
                                : "bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105 active:scale-95"
                        )}
                    >
                        {saving ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Salvando...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4" />
                                Salvar Configurações
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
