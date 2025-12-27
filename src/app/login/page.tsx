import { login, signup } from './actions'

export default function LoginPage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background p-4">
            {/* Background decoration */}
            <div className="fixed inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-primary/20 blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl" />
            </div>

            <div className="w-full max-w-md">
                <div className="glass rounded-2xl p-8 shadow-2xl">
                    <div className="text-center mb-8">
                        <div className="mx-auto h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
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
                        <h1 className="text-headline text-foreground">Bem-vindo</h1>
                        <p className="text-muted-foreground mt-2">Acesse sua conta para continuar</p>
                    </div>

                    <form className="space-y-5">
                        <div>
                            <label className="text-sm font-medium text-foreground">Nome Completo (Cadastro)</label>
                            <input
                                name="full_name"
                                type="text"
                                placeholder="Ex: João Silva"
                                className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-foreground">Email</label>
                            <input
                                name="email"
                                type="email"
                                required
                                placeholder="seu@email.com"
                                className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="text-sm font-medium text-foreground">Senha</label>
                            <input
                                name="password"
                                type="password"
                                required
                                placeholder="••••••••"
                                className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                            />
                        </div>

                        <div className="flex gap-4 pt-4">
                            <button
                                formAction={login}
                                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 active:scale-[0.98]"
                            >
                                Entrar
                            </button>
                            <button
                                formAction={signup}
                                className="flex-1 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-semibold py-3.5 rounded-xl transition-all border border-border hover:border-primary/20 active:scale-[0.98]"
                            >
                                Criar Conta
                            </button>
                        </div>
                    </form>
                </div>

                <p className="text-center text-caption mt-6">
                    Ao continuar, você concorda com nossos Termos de Serviço
                </p>
            </div>
        </div>
    )
}

