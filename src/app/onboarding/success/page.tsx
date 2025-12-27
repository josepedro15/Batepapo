'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, Loader2 } from 'lucide-react'

export default function SuccessPage() {
    const router = useRouter()

    useEffect(() => {
        // Redirect to dashboard after 3 seconds
        const timer = setTimeout(() => {
            router.push('/dashboard')
        }, 3000)

        return () => clearTimeout(timer)
    }, [router])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
            <div className="glass p-12 rounded-3xl text-center max-w-md">
                <div className="h-20 w-20 bg-success/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="h-10 w-10 text-success" />
                </div>

                <h1 className="text-3xl font-bold text-foreground mb-4">
                    Assinatura Confirmada! 🎉
                </h1>

                <p className="text-muted-foreground mb-8">
                    Sua conta foi criada com sucesso. Você será redirecionado
                    para o painel em instantes.
                </p>

                <div className="flex items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Redirecionando...</span>
                </div>
            </div>
        </div>
    )
}
