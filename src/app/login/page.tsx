import Link from 'next/link'
import { login } from './actions'

interface LoginPageProps {
    searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
    const params = await searchParams
    const error = params.error

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl animate-pulse" style={{ animationDuration: '6s' }} />
            </div>

            <div className="w-full max-w-md animate-[slide-up_0.5s_ease-out]">
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8 animate-[fade-in_0.6s_ease-out]">
                        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4 transition-transform hover:scale-110 hover:bg-primary/20">
                            <svg
                                className="h-8 w-8 text-primary"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-headline text-foreground">Bem-vindo de volta!</h1>
                        <p className="text-muted-foreground mt-2">Entre com suas credenciais</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm animate-[slide-up_0.3s_ease-out]">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{decodeURIComponent(error)}</span>
                            </div>
                        </div>
                    )}

                    <form className="space-y-5">
                        <div className="animate-[slide-up_0.6s_ease-out_0.1s_both]">
                            <label htmlFor="email" className="text-sm font-medium text-foreground block mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="seu@email.com"
                                className="w-full bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-muted/70 outline-none transition-all duration-300"
                            />
                        </div>

                        <div className="animate-[slide-up_0.6s_ease-out_0.2s_both]">
                            <div className="flex items-center justify-between mb-2">
                                <label htmlFor="password" className="text-sm font-medium text-foreground">
                                    Senha
                                </label>
                                <Link 
                                    href="/reset-password" 
                                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                                >
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-muted/70 outline-none transition-all duration-300"
                            />
                        </div>

                        <div className="pt-2 animate-[slide-up_0.6s_ease-out_0.3s_both]">
                            <button
                                formAction={login}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 active:scale-[0.98] hover:scale-[1.02]"
                            >
                                Entrar
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center animate-[fade-in_0.8s_ease-out_0.4s_both]">
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

                <p className="text-center text-caption mt-6 animate-[fade-in_1s_ease-out_0.5s_both]">
                    Ao continuar, você concorda com nossos Termos de Serviço
                </p>
            </div>
        </div>
    )
}

