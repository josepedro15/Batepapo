'use client'

import { useState } from 'react'
import { generateApiKey } from './actions'
import { Plus, Copy } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

export function GenerateKeyForm() {
    const [newKey, setNewKey] = useState<string | null>(null)
    const router = useRouter()

    async function handleSubmit(formData: FormData) {
        try {
            const result = await generateApiKey(formData)
            if (result.key) {
                setNewKey(result.key)
                toast.success('Chave gerada com sucesso!')
                // Reload page after 3 seconds to show key in list
                setTimeout(() => router.refresh(), 3000)
            }
        } catch (error) {
            toast.error('Erro ao gerar chave')
        }
    }

    return (
        <div className="mb-8 p-4 bg-slate-900/50 rounded-xl border border-dashed border-slate-700">
            <form action={handleSubmit} className="flex gap-4">
                <input
                    name="label"
                    placeholder="Nome da Chave (ex: n8n Produção)"
                    className="flex-1 bg-transparent border-none text-white focus:ring-0 placeholder:text-slate-600 outline-none"
                    required
                />
                <button type="submit" className="bg-white text-black hover:bg-slate-200 px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 cursor-pointer transition-colors">
                    <Plus className="h-4 w-4" /> Gerar Nova Chave
                </button>
            </form>

            {newKey && (
                <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-in fade-in slide-in-from-top-2">
                    <p className="text-emerald-400 text-sm font-bold mb-2">Chave Gerada! Copie agora (você não verá isso novamente):</p>
                    <div className="flex items-center gap-2 bg-slate-950 p-3 rounded font-mono text-sm text-white">
                        <span className="truncate flex-1">{newKey}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(newKey)}
                            className="p-2 hover:bg-white/10 rounded"
                        >
                            <Copy className="h-4 w-4 text-emerald-400" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}
