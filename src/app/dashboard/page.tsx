import { TrendingUp, MessageSquare, Users } from 'lucide-react'

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-display text-foreground">Visão Geral</h1>
                <p className="text-muted-foreground mt-1">Bem-vindo de volta, Gestor.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Metric Cards with Glass Effect */}
                <div className="glass p-6 rounded-2xl relative overflow-hidden group interactive hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <div className="h-20 w-20 bg-accent rounded-full blur-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-accent" />
                        </div>
                        <h2 className="text-label text-muted-foreground">Novos Leads</h2>
                    </div>
                    <p className="text-4xl font-bold text-foreground">142</p>
                    <div className="mt-4 text-xs text-success flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +12% essa semana
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group interactive hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <div className="h-20 w-20 bg-primary rounded-full blur-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-primary" />
                        </div>
                        <h2 className="text-label text-muted-foreground">Negócios</h2>
                    </div>
                    <p className="text-4xl font-bold text-foreground">R$ 84.5k</p>
                    <div className="mt-4 text-xs text-success flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        +5% vs mês passado
                    </div>
                </div>

                <div className="glass p-6 rounded-2xl relative overflow-hidden group interactive hover:scale-[1.02]">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                        <div className="h-20 w-20 bg-pink-500 rounded-full blur-2xl"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="h-10 w-10 rounded-xl bg-pink-500/10 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-pink-500" />
                        </div>
                        <h2 className="text-label text-muted-foreground">Mensagens</h2>
                    </div>
                    <p className="text-4xl font-bold text-foreground">8,902</p>
                    <div className="mt-4 text-xs text-muted-foreground flex items-center">
                        Hoje
                    </div>
                </div>
            </div>
        </div>
    )
}

