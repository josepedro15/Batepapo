import { getDashboardData } from './actions'
import { 
    Users, 
    TrendingUp, 
    MessageSquare, 
    Megaphone,
    Bell,
    Wifi,
    WifiOff,
    ArrowUpRight,
    ArrowDownRight,
    Calendar,
    UserPlus,
    Zap,
    Target,
    DollarSign,
    BarChart3,
    Activity,
    CheckCircle2
} from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
    const data = await getDashboardData()

    const greeting = getGreeting()

    // Calculate trends
    const activeRate = data.contactStats.total > 0 
        ? Math.round((data.contactStats.active / data.contactStats.total) * 100)
        : 0

    return (
        <div className="min-h-[calc(100vh-6rem)] space-y-6">
            {/* Header with Welcome & WhatsApp Status */}
            <div className="relative overflow-hidden rounded-2xl glass-heavy p-6 md:p-8">
                {/* Decorative gradient orbs */}
                <div className="absolute -top-20 -right-20 h-40 w-40 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 bg-accent/20 rounded-full blur-3xl" />
                
                <div className="relative flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                            <BarChart3 className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                                {greeting}, <span className="text-primary">{data.userName}</span>
                            </h1>
                            <p className="text-muted-foreground mt-1">
                                Aqui está o resumo do seu negócio hoje
                            </p>
                        </div>
                    </div>
                    
                    {/* WhatsApp Status Badge */}
                    <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border ${
                        data.whatsappStatus === 'connected' 
                            ? 'bg-success/10 border-success/30 text-success' 
                            : 'bg-destructive/10 border-destructive/30 text-destructive'
                    }`}>
                        {data.whatsappStatus === 'connected' ? (
                            <>
                                <Wifi className="h-4 w-4" />
                                <span className="text-sm font-medium">WhatsApp Conectado</span>
                                {data.whatsappPhone && (
                                    <span className="text-xs opacity-70">({data.whatsappPhone})</span>
                                )}
                            </>
                        ) : (
                            <>
                                <WifiOff className="h-4 w-4" />
                                <span className="text-sm font-medium">WhatsApp Desconectado</span>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Main KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Contacts Card */}
                <Link href="/dashboard/contacts" className="block">
                    <div className="glass p-5 rounded-2xl relative overflow-hidden group hover:border-primary/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full">
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-full h-full bg-primary rounded-full blur-2xl" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                <Users className="h-5 w-5 text-primary" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Contatos</div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{data.contactStats.total}</p>
                        <div className="mt-3 flex items-center justify-between">
                            <div className="flex items-center gap-1 text-xs">
                                <span className="text-success flex items-center gap-1">
                                    <UserPlus className="h-3 w-3" />
                                    +{data.contactStats.newThisWeek} esta semana
                                </span>
                            </div>
                            <span className="text-xs text-muted-foreground">{activeRate}% ativos</span>
                        </div>
                    </div>
                </Link>

                {/* Deals Value Card */}
                <Link href="/dashboard/kanban" className="block">
                    <div className="glass p-5 rounded-2xl relative overflow-hidden group hover:border-accent/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full">
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-full h-full bg-accent rounded-full blur-2xl" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                                <DollarSign className="h-5 w-5 text-accent" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Em Pipeline</div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">
                            {formatCurrency(data.dealStats.totalValue)}
                        </p>
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <Target className="h-3 w-3" />
                            {data.dealStats.count} negócios ativos
                        </div>
                    </div>
                </Link>

                {/* Messages Card */}
                <Link href="/dashboard/chat" className="block">
                    <div className="glass p-5 rounded-2xl relative overflow-hidden group hover:border-pink-500/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full">
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-full h-full bg-pink-500 rounded-full blur-2xl" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-pink-500/20 to-pink-500/5 flex items-center justify-center border border-pink-500/20">
                                <MessageSquare className="h-5 w-5 text-pink-500" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Mensagens</div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{data.messageStats.today}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                            <Activity className="h-3 w-3" />
                            {data.messageStats.thisWeek} esta semana
                        </div>
                    </div>
                </Link>

                {/* Campaigns Card */}
                <Link href="/dashboard/campaigns" className="block">
                    <div className="glass p-5 rounded-2xl relative overflow-hidden group hover:border-amber-500/30 transition-all duration-300 hover:scale-[1.02] cursor-pointer h-full">
                        <div className="absolute top-0 right-0 w-24 h-24 opacity-10 group-hover:opacity-20 transition-opacity">
                            <div className="w-full h-full bg-amber-500 rounded-full blur-2xl" />
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/20">
                                <Megaphone className="h-5 w-5 text-amber-500" />
                            </div>
                            <div className="text-sm text-muted-foreground font-medium">Campanhas</div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{data.campaignStats.total}</p>
                        <div className="mt-3 flex items-center gap-1 text-xs">
                            {data.campaignStats.active > 0 ? (
                                <span className="text-success flex items-center gap-1">
                                    <Zap className="h-3 w-3" />
                                    {data.campaignStats.active} em execução
                                </span>
                            ) : (
                                <span className="text-muted-foreground">Nenhuma ativa</span>
                            )}
                        </div>
                    </div>
                </Link>
            </div>

            {/* Secondary Row: Funnel + Reminders + Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Deals Funnel */}
                <div className="lg:col-span-2 glass rounded-2xl p-6">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                <TrendingUp className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Funil de Vendas</h2>
                                <p className="text-sm text-muted-foreground">Distribuição por estágio</p>
                            </div>
                        </div>
                        <Link 
                            href="/dashboard/kanban" 
                            className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                        >
                            Ver Kanban
                            <ArrowUpRight className="h-4 w-4" />
                        </Link>
                    </div>

                    {data.dealStats.byStage.length > 0 ? (
                        <div className="space-y-4">
                            {data.dealStats.byStage.map((stage, index) => {
                                const maxCount = Math.max(...data.dealStats.byStage.map(s => s.count))
                                const percentage = maxCount > 0 ? (stage.count / maxCount) * 100 : 0
                                
                                return (
                                    <div key={stage.name} className="group">
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <div 
                                                    className="h-3 w-3 rounded-full" 
                                                    style={{ backgroundColor: getStageColor(stage.color) }}
                                                />
                                                <span className="text-sm font-medium text-foreground">{stage.name}</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm text-muted-foreground">{stage.count} negócios</span>
                                                <span className="text-sm font-semibold text-foreground">
                                                    {formatCurrency(stage.value)}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-muted/30 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                                                style={{ 
                                                    width: `${percentage}%`,
                                                    backgroundColor: getStageColor(stage.color)
                                                }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                            <div className="h-16 w-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-4">
                                <Target className="h-8 w-8 text-muted-foreground/50" />
                            </div>
                            <p className="text-muted-foreground font-medium">Nenhum negócio no pipeline</p>
                            <p className="text-sm text-muted-foreground/70 mt-1">Novos contatos criarão negócios automaticamente</p>
                        </div>
                    )}
                </div>

                {/* Right Column: Reminders + Quick Actions */}
                <div className="space-y-6">
                    {/* Reminders */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center border border-amber-500/20">
                                <Bell className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">Lembretes Hoje</h2>
                                <p className="text-sm text-muted-foreground">Tarefas pendentes</p>
                            </div>
                        </div>
                        
                        {data.remindersToday > 0 ? (
                            <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <div className="h-12 w-12 rounded-full bg-amber-500/20 flex items-center justify-center">
                                    <span className="text-xl font-bold text-amber-500">{data.remindersToday}</span>
                                </div>
                                <div>
                                    <p className="font-medium text-foreground">
                                        {data.remindersToday === 1 ? 'Lembrete pendente' : 'Lembretes pendentes'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">Verifique no chat do contato</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-4 rounded-xl bg-success/5 border border-success/20">
                                <CheckCircle2 className="h-6 w-6 text-success" />
                                <div>
                                    <p className="font-medium text-foreground">Tudo em dia!</p>
                                    <p className="text-sm text-muted-foreground">Nenhum lembrete para hoje</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Quick Actions */}
                    <div className="glass rounded-2xl p-6">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                <Zap className="h-5 w-5 text-primary" />
                            </div>
                            <h2 className="text-lg font-semibold text-foreground">Ações Rápidas</h2>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <Link 
                                href="/dashboard/chat"
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-muted/20 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-200 group"
                            >
                                <MessageSquare className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    Abrir Chat
                                </span>
                            </Link>
                            <Link 
                                href="/dashboard/kanban"
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-muted/20 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-200 group"
                            >
                                <Target className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    Ver Kanban
                                </span>
                            </Link>
                            <Link 
                                href="/dashboard/contacts"
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-muted/20 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-200 group"
                            >
                                <UserPlus className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    Contatos
                                </span>
                            </Link>
                            <Link 
                                href="/dashboard/settings"
                                className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl bg-muted/20 hover:bg-primary/10 border border-transparent hover:border-primary/20 transition-all duration-200 group"
                            >
                                <Wifi className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                <span className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">
                                    WhatsApp
                                </span>
                            </Link>
                        </div>
                    </div>

                    {/* Team Info */}
                    <div className="glass rounded-2xl p-5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center border border-violet-500/20">
                                    <Users className="h-5 w-5 text-violet-500" />
                                </div>
                                <div>
                                    <p className="font-semibold text-foreground">{data.teamMembers} membros</p>
                                    <p className="text-sm text-muted-foreground">na equipe</p>
                                </div>
                            </div>
                            <Link 
                                href="/dashboard/settings"
                                className="text-sm text-primary hover:text-primary/80 transition-colors"
                            >
                                Gerenciar
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function getGreeting(): string {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bom dia'
    if (hour < 18) return 'Boa tarde'
    return 'Boa noite'
}

function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value)
}

function getStageColor(color: string): string {
    const colors: Record<string, string> = {
        blue: '#3b82f6',
        green: '#22c55e',
        yellow: '#eab308',
        orange: '#f97316',
        red: '#ef4444',
        purple: '#a855f7',
        pink: '#ec4899',
        violet: '#8b5cf6',
        indigo: '#6366f1',
        cyan: '#06b6d4',
        teal: '#14b8a6',
        emerald: '#10b981',
        lime: '#84cc16',
        amber: '#f59e0b',
        gray: '#6b7280'
    }
    return colors[color] || colors.blue
}
