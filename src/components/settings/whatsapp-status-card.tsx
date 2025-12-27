'use client'

import { useState } from 'react'
import { QrCode, Smartphone, Wifi, WifiOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function WhatsappStatusCard() {
    // Mock state: 'connected', 'disconnected', 'connecting'
    const [status, setStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected')
    const [qrCodeData, setQrCodeData] = useState<string | null>(null)

    // Mock function to simulate generating QR Code
    const handleGenerateQr = async () => {
        setStatus('connecting')
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        setQrCodeData('mock-qr-code-data')

        // Simulate successful connection after scanning (auto-connect for demo)
        setTimeout(() => {
            setStatus('connected')
            setQrCodeData(null)
            toast.success('WhatsApp conectado com sucesso!')
        }, 5000)
    }

    return (
        <div className="glass p-6 rounded-2xl border border-white/5">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-violet-400" />
                    <h2 className="text-xl font-bold text-white">Conexão WhatsApp</h2>
                </div>

                {/* Status Indicator Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${status === 'connected'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : status === 'connecting'
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' :
                            status === 'connecting' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                    {status === 'connected' ? 'Conectado' :
                        status === 'connecting' ? 'Aguardando Leitura' : 'Desconectado'}
                </div>
            </div>

            <div className="space-y-6">
                {status === 'disconnected' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-4">
                        <div className="p-2 bg-red-500/20 rounded-lg">
                            <WifiOff className="h-6 w-6 text-red-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-white mb-1">WhatsApp Desconectado</h3>
                            <p className="text-slate-400 text-sm mb-4">
                                Sua instância do WhatsApp não está conectada. As mensagens não serão enviadas ou recebidas.
                            </p>
                            <button
                                onClick={handleGenerateQr}
                                className="bg-white text-slate-900 hover:bg-slate-200 px-4 py-2 rounded-lg font-bold text-sm transition-colors flex items-center gap-2"
                            >
                                <QrCode className="h-4 w-4" />
                                Gerar QR Code
                            </button>
                        </div>
                    </div>
                )}

                {status === 'connecting' && (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-800/50 rounded-xl border border-white/5">
                        {qrCodeData ? (
                            <div className="text-center space-y-4">
                                <div className="bg-white p-4 rounded-xl inline-block">
                                    {/* Placeholder for QR Code Image */}
                                    <div className="w-48 h-48 bg-slate-200 flex items-center justify-center">
                                        <QrCode className="h-24 w-24 text-slate-900 opacity-20" />
                                    </div>
                                </div>
                                <p className="text-slate-400 text-sm animate-pulse">Abra o WhatsApp e escaneie o código acima</p>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4">
                                <Loader2 className="h-8 w-8 text-violet-400 animate-spin" />
                                <p className="text-slate-400">Gerando sessão...</p>
                            </div>
                        )}
                    </div>
                )}

                {status === 'connected' && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-6">
                        <div className="flex items-center gap-4">
                            <div className="h-12 w-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <Wifi className="h-6 w-6 text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="font-bold text-white">Conexão Estabelecida</h3>
                                <p className="text-slate-400 text-sm">
                                    Chip conectado: <span className="text-white font-mono">+55 (11) 99999-9999</span>
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-white/5 flex gap-4">
                            <div className="flex-1 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-slate-500 mb-1">Status da Bateria</p>
                                <p className="text-white font-medium">85%</p>
                            </div>
                            <div className="flex-1 bg-slate-900/50 p-3 rounded-lg border border-white/5">
                                <p className="text-xs text-slate-500 mb-1">Última Sincronização</p>
                                <p className="text-white font-medium">Agora mesmo</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
