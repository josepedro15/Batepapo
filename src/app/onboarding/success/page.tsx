'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2, AlertTriangle } from 'lucide-react'

export default function SuccessPage() {
    const router = useRouter()
    const [status, setStatus] = useState<'checking' | 'active' | 'error'>('checking')
    const [dots, setDots] = useState('')

    useEffect(() => {
        const interval = setInterval(() => {
            setDots(prev => prev.length >= 3 ? '' : prev + '.')
        }, 500)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        let isMounted = true
        let attempts = 0
        const MAX_ATTEMPTS = 30 // 60 seconds (2s interval)

        const checkSubscription = async () => {
            try {
                const res = await fetch('/api/subscription/check')
                const data = await res.json()

                if (data.active) {
                    if (isMounted) {
                        setStatus('active')
                        // Give explicit feedback before redirect
                        setTimeout(() => router.push('/dashboard'), 1500)
                    }
                    return true
                }
            } catch (error) {
                console.error('Check failed:', error)
            }
            return false
        }

        const poll = async () => {
            const success = await checkSubscription()
            if (!success && isMounted) {
                attempts++
                if (attempts < MAX_ATTEMPTS) {
                    setTimeout(poll, 2000)
                } else {
                    setStatus('error')
                }
            }
        }

        poll()

        return () => { isMounted = false }
    }, [router])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
            <div className={`glass p-12 rounded-3xl text-center max-w-md transition-all duration-500 ${status === 'active' ? 'scale-105 shadow-2xl shadow-success/20' : ''}`}>

                {status === 'error' ? (
                    <>
                        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in">
                            <AlertTriangle className="h-10 w-10 text-destructive" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-4">
                            Pagamento Confirmado
                        </h1>
                        <p className="text-muted-foreground mb-6">
                            Recebemos seu pagamento, mas ainda estamos aguardando a confirmação do sistema.
                        </p>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors w-full"
                        >
                            Verificar novamente
                        </button>
                    </>
                ) : (
                    <>
                        <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6 animate-in zoom-in duration-300">
                            <CheckCircle className={`h-10 w-10 text-success ${status === 'checking' ? 'animate-pulse' : ''}`} />
                        </div>

                        <h1 className="text-3xl font-bold text-foreground mb-4">
                            {status === 'active' ? 'Tudo pronto! 🚀' : 'Confirmando...'}
                        </h1>

                        <p className="text-muted-foreground mb-8">
                            {status === 'active'
                                ? 'Sua assinatura está ativa. Redirecionando para o painel.'
                                : 'Estamos sincronizando sua assinatura. Isso leva apenas alguns segundos.'}
                        </p>

                        <div className={`flex items-center justify-center gap-2 text-muted-foreground transition-opacity ${status === 'active' ? 'opacity-0' : 'opacity-100'}`}>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-sm font-mono">Sincronizando{dots}</span>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

