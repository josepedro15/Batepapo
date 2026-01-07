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
            <div className="glass p-6 rounded-2xl h-full">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-6 w-6 text-primary animate-spin" />
                </div>
            </div>
        )
    }

    const isConnected = status?.status === 'connected'
    const isConnecting_ = status?.status === 'connecting'
    const isConfigured = status?.configured

    return (
        <div className="glass p-6 rounded-2xl h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20">
                        <Smartphone className="h-5 w-5 text-success" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">WhatsApp</h3>
                        <p className="text-xs text-muted-foreground">Status da conexão</p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 transition-all duration-300 ${isConnected
                        ? 'bg-success/10 text-success border border-success/20'
                        : isConnecting_
                            ? 'bg-warning/10 text-warning border border-warning/20'
                            : 'bg-muted text-muted-foreground border border-border'
                    }`}>
                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${isConnected ? 'bg-success animate-pulse' :
                            isConnecting_ ? 'bg-warning animate-pulse' : 'bg-muted-foreground/50'
                        }`} />
                    {isConnected ? 'Online' : isConnecting_ ? 'Conectando' : 'Offline'}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col justify-center">
                {/* Not configured - Show connect button */}
                {!isConfigured && (
                    <div className="text-center py-6">
                        <div className="h-16 w-16 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <WifiOff className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-muted-foreground mb-4">WhatsApp não conectado</p>
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className="bg-gradient-to-r from-success to-success/80 hover:from-success/90 hover:to-success/70 disabled:opacity-50 text-success-foreground px-6 py-3 rounded-xl font-bold transition-all duration-300 flex items-center gap-2 mx-auto shadow-lg shadow-success/20 hover:shadow-success/30 active:scale-[0.98]"
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
                        <div className="relative inline-block">
                            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary rounded-2xl animate-pulse opacity-30 blur-xl" />
                            <div className="relative bg-white p-3 rounded-xl shadow-xl">
                                <img
                                    src={status.qrcode.startsWith('data:') ? status.qrcode : `data:image/png;base64,${status.qrcode}`}
                                    alt="QR Code"
                                    className="w-40 h-40"
                                />
                            </div>
                        </div>
                        <p className="text-muted-foreground text-sm mt-4 animate-pulse">
                            Escaneie com WhatsApp
                        </p>
                        <button
                            onClick={handleConnect}
                            className="text-primary hover:text-primary/80 text-sm flex items-center gap-1.5 mx-auto mt-3 transition-colors"
                        >
                            <RefreshCw className="h-4 w-4" />
                            Novo QR Code
                        </button>
                    </div>
                )}

                {/* Configured but disconnected */}
                {isConfigured && status?.status === 'disconnected' && (
                    <div className="text-center py-4">
                        <div className="h-14 w-14 bg-destructive/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <WifiOff className="h-7 w-7 text-destructive" />
                        </div>
                        <p className="text-muted-foreground mb-4">Sessão desconectada</p>
                        <div className="flex gap-2 justify-center">
                            <button
                                onClick={handleConnect}
                                disabled={isConnecting}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all shadow-lg shadow-primary/20 active:scale-[0.98]"
                            >
                                <RefreshCw className="h-4 w-4" />
                                Reconectar
                            </button>
                            <button
                                onClick={handleDelete}
                                className="bg-destructive/10 hover:bg-destructive/20 text-destructive px-3 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-all"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                )}

                {/* Connected */}
                {isConnected && (
                    <div className="space-y-4">
                        <div className="bg-success/5 border border-success/10 rounded-xl p-4">
                            <div className="flex items-center gap-3">
                                <div className="h-12 w-12 bg-success/20 rounded-full flex items-center justify-center">
                                    <Wifi className="h-6 w-6 text-success" />
                                </div>
                                <div>
                                    <p className="font-bold text-foreground">Conectado</p>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {status?.phone_number || 'Número não disponível'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleDisconnect}
                            className="w-full bg-muted hover:bg-muted/80 text-foreground px-4 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all"
                        >
                            <WifiOff className="h-4 w-4" />
                            Desconectar
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
