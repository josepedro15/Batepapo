import Link from 'next/link'
import { signup } from './actions'

interface SignupPageProps {
    searchParams: Promise<{ error?: string; success?: string }>
}

export default async function SignupPage({ searchParams }: SignupPageProps) {
    const params = await searchParams
    const error = params.error
    const success = params.success

    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/20 blur-3xl animate-pulse" style={{ animationDuration: '5s' }} />
                <div className="absolute bottom-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl animate-pulse" style={{ animationDuration: '7s' }} />
            </div>

            <div className="w-full max-w-md animate-[slide-up_0.5s_ease-out]">
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8 animate-[fade-in_0.6s_ease-out]">
                        <div className="mx-auto h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4 transition-transform hover:scale-110 hover:bg-accent/20">
                            <svg
                                className="h-8 w-8 text-accent"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={2}
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                                />
                            </svg>
                        </div>
                        <h1 className="text-headline text-foreground">Criar Conta</h1>
                        <p className="text-muted-foreground mt-2">Preencha seus dados para começar</p>
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

                    {/* Success Message */}
                    {success && (
                        <div className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-sm animate-[slide-up_0.3s_ease-out]">
                            <div className="flex items-center gap-2">
                                <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <span>{decodeURIComponent(success)}</span>
                            </div>
                        </div>
                    )}

                    <form className="space-y-5">
                        <div className="animate-[slide-up_0.6s_ease-out_0.1s_both]">
                            <label htmlFor="full_name" className="text-sm font-medium text-foreground block mb-2">
                                Nome Completo
                            </label>
                            <input
                                id="full_name"
                                name="full_name"
                                type="text"
                                required
                                placeholder="Ex: João Silva"
                                className="w-full bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-muted/70 outline-none transition-all duration-300"
                            />
                        </div>

                        <div className="animate-[slide-up_0.6s_ease-out_0.2s_both]">
                            <label htmlFor="email" className="text-sm font-medium text-foreground block mb-2">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                placeholder="seu@email.com"
                                className="w-full bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-muted/70 outline-none transition-all duration-300"
                            />
                        </div>

                        <div className="animate-[slide-up_0.6s_ease-out_0.3s_both]">
                            <label htmlFor="password" className="text-sm font-medium text-foreground block mb-2">
                                Senha
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                minLength={6}
                                placeholder="Mínimo 6 caracteres"
                                className="w-full bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-muted/70 outline-none transition-all duration-300"
                            />
                        </div>

                        <div className="animate-[slide-up_0.6s_ease-out_0.4s_both]">
                            <label htmlFor="confirm_password" className="text-sm font-medium text-foreground block mb-2">
                                Confirmar Senha
                            </label>
                            <input
                                id="confirm_password"
                                name="confirm_password"
                                type="password"
                                required
                                minLength={6}
                                placeholder="Digite a senha novamente"
                                className="w-full bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-accent focus:border-transparent focus:bg-muted/70 outline-none transition-all duration-300"
                            />
                        </div>

                        <div className="pt-2 animate-[slide-up_0.6s_ease-out_0.5s_both]">
                            <button
                                formAction={signup}
                                className="w-full bg-gradient-to-r from-accent to-primary hover:from-accent/90 hover:to-primary/90 text-white font-semibold py-3.5 rounded-xl transition-all duration-300 shadow-lg shadow-accent/25 hover:shadow-xl hover:shadow-accent/40 active:scale-[0.98] hover:scale-[1.02]"
                            >
                                Criar Conta
                            </button>
                        </div>
                    </form>

                    <div className="mt-6 text-center animate-[fade-in_0.8s_ease-out_0.6s_both]">
                        <p className="text-sm text-muted-foreground">
                            Já tem uma conta?{' '}
                            <Link 
                                href="/login" 
                                className="text-accent font-semibold hover:text-accent/80 transition-colors hover:underline"
                            >
                                Fazer login
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-caption mt-6 animate-[fade-in_1s_ease-out_0.7s_both]">
                    Ao criar uma conta, você concorda com nossos <br />
                    <Link href="/terms" className="text-primary hover:underline">Termos de Serviço</Link>
                    {' e '}
                    <Link href="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>
                </p>
            </div>
        </div>
    )
}
