'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log error to monitoring service in production
        if (process.env.NODE_ENV === 'production') {
            // TODO: Send to error monitoring service (e.g., Sentry)
        }
    }, [error])

    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-6 p-8">
            <div className="flex flex-col items-center gap-4 text-center">
                <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
                    <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-foreground mb-2">
                        Algo deu errado
                    </h2>
                    <p className="text-muted-foreground max-w-md">
                        Ocorreu um erro inesperado. Por favor, tente novamente ou entre em contato com o suporte se o problema persistir.
                    </p>
                </div>
                {process.env.NODE_ENV === 'development' && (
                    <pre className="mt-4 max-w-lg overflow-auto rounded-lg bg-slate-900 p-4 text-xs text-red-400">
                        {error.message}
                    </pre>
                )}
            </div>
            <button
                onClick={reset}
                className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 rounded-xl font-bold transition-colors"
            >
                <RefreshCw className="h-4 w-4" />
                Tentar Novamente
            </button>
        </div>
    )
}
