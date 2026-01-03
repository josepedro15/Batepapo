'use client'

import { useState, useEffect, useCallback } from 'react'
import { Smartphone, Wifi, WifiOff, Loader2, RefreshCw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

interface StatusResponse {
    configured: boolean
    status: 'disconnected' | 'connecting' | 'connected' | 'not_configured'
    phone_number?: string
    qrcode?: string
    pairingCode?: string
    instance_name?: string
    error?: string
}

export function WhatsAppConnectionCard() {
    const [isLoading, setIsLoading] = useState(true)
    const [isConnecting, setIsConnecting] = useState(false)
    const [status, setStatus] = useState<StatusResponse | null>(null)
    const [isPolling, setIsPolling] = useState(false)

    // Fetch current status
    const fetchStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/whatsapp/status')
            const data: StatusResponse = await response.json()
            setStatus(data)

            // Start/stop polling based on status
            if (data.status === 'connecting') {
                setIsPolling(true)
            } else {
                setIsPolling(false)
            }

            return data
        } catch (error) {
            console.error('Error fetching status:', error)
            return null
        } finally {
            setIsLoading(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        fetchStatus()
    }, [fetchStatus])

    // Poll while connecting
    useEffect(() => {
        if (!isPolling) return

        const interval = setInterval(async () => {
            const data = await fetchStatus()
            if (data?.status === 'connected') {
                toast.success('WhatsApp conectado com sucesso!')
                setIsPolling(false)
            }
        }, 3000)

        return () => clearInterval(interval)
    }, [isPolling, fetchStatus])

    // Connect WhatsApp (creates instance if needed)
    const handleConnect = async () => {
        setIsConnecting(true)
        try {
            // Check if instance exists
            if (status?.configured) {
                // Just reconnect
                const response = await fetch('/api/whatsapp/connect', { method: 'POST' })
                const data = await response.json()

                if (!response.ok) {
                    toast.error(data.error || 'Erro ao reconectar')
                    return
                }

                setStatus(prev => prev ? { ...prev, status: 'connecting', qrcode: data.qrcode } : null)
                setIsPolling(true)
                toast.info('Escaneie o QR Code')
            } else {
                // Create new instance
                const response = await fetch('/api/whatsapp/instance', { method: 'POST' })
                const data = await response.json()

                if (!response.ok) {
                    toast.error(data.error || 'Erro ao criar instância')
                    return
                }

                setStatus({
                    configured: true,
                    status: 'connecting',
                    qrcode: data.qrcode,
                    instance_name: data.instance?.instance_name
                })
                setIsPolling(true)
                toast.info('Escaneie o QR Code com seu WhatsApp')
            }
        } catch (error) {
            console.error('Connect error:', error)
            toast.error('Erro ao conectar')
        } finally {
            setIsConnecting(false)
        }
    }

    // Disconnect
    const handleDisconnect = async () => {
        if (!confirm('Desconectar WhatsApp?')) return

        try {
            const response = await fetch('/api/whatsapp/disconnect', { method: 'POST' })
            if (!response.ok) {
                toast.error('Erro ao desconectar')
                return
            }

            setStatus(prev => prev ? { ...prev, status: 'disconnected', phone_number: undefined } : null)
            toast.success('WhatsApp desconectado')
        } catch (error) {
            toast.error('Erro ao desconectar')
        }
    }

    // Delete instance
    const handleDelete = async () => {
        if (!confirm('Remover instância WhatsApp? Esta ação não pode ser desfeita.')) return

        try {
            const response = await fetch('/api/whatsapp/instance', { method: 'DELETE' })
            if (!response.ok) {
                toast.error('Erro ao remover')
                return
            }

            setStatus({ configured: false, status: 'not_configured' })
            toast.success('Instância removida')
        } catch (error) {
            toast.error('Erro ao remover')
        }
    }

    if (isLoading) {
        return (
            <div className="glass p-6 rounded-2xl border border-white/5">
                <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 text-violet-400 animate-spin" />
                </div>
            </div>
        )
    }

    const isConnected = status?.status === 'connected'
    const isConnecting_ = status?.status === 'connecting'
    const isConfigured = status?.configured

    return (
        <div className="glass p-6 rounded-2xl border border-white/5">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5 text-violet-400" />
                    <h2 className="text-lg font-bold text-white">WhatsApp</h2>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-2 ${isConnected
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : isConnecting_
                            ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                    }`}>
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' :
                            isConnecting_ ? 'bg-yellow-500 animate-pulse' : 'bg-slate-500'
                        }`} />
                    {isConnected ? 'Online' : isConnecting_ ? 'Conectando' : 'Offline'}
                </div>
            </div>

            {/* Content */}
            <div className="space-y-4">
                {/* Not configured - Show connect button */}
                {!isConfigured && (
                    <div className="text-center py-6">
                        <WifiOff className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                        <p className="text-slate-400 mb-4">WhatsApp não conectado</p>
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 mx-auto"
                        >
                            {isConnecting ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <Wifi className="h-5 w-5" />
                            )}
                            Conectar WhatsApp
                        </button>
                    </div>
                )}

                {/* Connecting - Show QR Code */}
                {isConnecting_ && status?.qrcode && (
                    <div className="text-center py-4">
                        <div className="bg-white p-3 rounded-xl inline-block mb-4">
                            <img
                                src={status.qrcode.startsWith('data:') ? status.qrcode : `data:image/png;base64,${status.qrcode}`}
                                alt="QR Code"
                                className="w-44 h-44"
                            />
                        </div>
                        <p className="text-slate-400 text-sm animate-pulse">
                            Escaneie com WhatsApp
                        </p>
                        <button
                            onClick={handleConnect}
                            className="text-violet-400 hover:text-violet-300 text-sm flex items-center gap-1 mx-auto mt-3"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Novo QR
                        </button>
                    </div>
                )}

                {/* Configured but disconnected */}
                {isConfigured && status?.status === 'disconnected' && (
                    <div className="text-center py-4">
                        <WifiOff className="h-10 w-10 text-red-400 mx-auto mb-3" />
                        <p className="text-slate-400 mb-4">Sessão desconectada</p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="bg-violet-600 hover:bg-violet-500 text-white px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reconectar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 px-4 py-2 rounded-lg font-medium text-sm flex items-center gap-2"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Connected */}
                {isConnected && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                                <Wifi className="h-5 w-5 text-emerald-400" />
                            </div>
                            <div>
                                <p className="font-bold text-white">Conectado</p>
                                <p className="text-sm text-slate-400 font-mono">
                                    {status?.phone_number || 'Número não disponível'}
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleDisconnect}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-2"
                            >
                                <WifiOff className="h-4 w-4" />
                                Desconectar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
