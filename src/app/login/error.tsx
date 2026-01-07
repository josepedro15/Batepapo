'use client'

import Link from 'next/link'
import { useEffect } from 'react'

export default function LoginError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        // Log the error to console for debugging
        console.error('Login error:', error)
    }, [error])

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            <div className="w-full max-w-md animate-[slide-up_0.5s_ease-out]">
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="mx-auto h-14 w-14 rounded-2xl bg-red-500/10 flex items-center justify-center mb-4">
                            <svg
                                className="h-8 w-8 text-red-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-headline text-foreground">Ops! Algo deu errado</h1>
                        <p className="text-muted-foreground mt-2">
                            Ocorreu um erro ao processar sua solicitação.
                        </p>
                    </div>

                    <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                        <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                                {error.message || 'Erro ao fazer login. Por favor, tente novamente.'}
                            </span>
                        </div>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => reset()}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] hover:scale-[1.02]"
                        >
                            Tentar novamente
                        </button>

                        <Link
                            href="/login"
                            className="w-full block text-center bg-muted/50 hover:bg-muted/70 text-foreground font-medium py-3.5 rounded-xl transition-all duration-300 border border-border"
                        >
                            Voltar para o login
                        </Link>
                    </div>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-muted-foreground">
                            Não tem uma conta?{' '}
                            <Link
                                href="/signup"
                                className="text-primary font-semibold hover:text-primary/80 transition-colors hover:underline"
                            >
                                Criar conta
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
