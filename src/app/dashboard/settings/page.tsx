import { createClient } from '@/lib/supabase/server'
import { revokeApiKey } from './actions'
import { GenerateKeyForm } from './generate-key-form'
import { TeamManagement } from '@/components/settings/team-management'
import { TagManagement } from '@/components/settings/tag-management'
import { WhatsAppConnectionCard } from '@/components/settings/whatsapp-status-card'
import { AISettingsCard } from '@/components/settings/ai-settings-card'
import { MessageSettingsCard } from '@/components/settings/message-settings-card'
import { SubscriptionCard } from '@/components/settings/subscription-card'
import { Key, Trash2, Copy, Sparkles, Users, Smartphone, Tag, KeyRound, CreditCard } from 'lucide-react'

export default async function SettingsPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) throw new Error('Unauthorized')

    // Fetch API Keys
    const { data: membership } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single()
    const { data: keys } = await supabase.from('api_keys').select('*').eq('organization_id', membership?.organization_id)

    // Fetch Team Members
    const { data: members } = await supabase
        .from('organization_members')
        .select('user_id, role, profiles(name, email)')
        .eq('organization_id', membership?.organization_id)
        .order('role')

    // Fetch Subscription
    const { data: subData } = await supabase
        .from('subscriptions')
        .select(`
            status,
            current_period_end,
            prices (
                products (name),
                plan_limits (max_users, max_contacts, max_pipelines)
            )
        `)
        // Check for active or past_due subscriptions (so we show something even if payment failed)
        .in('status', ['trialing', 'active', 'past_due', 'canceled'])
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

    // Format subscription for the card
    const priceData = Array.isArray(subData?.prices) ? subData.prices[0] : (subData?.prices as any)
    const productsData = Array.isArray(priceData?.products) ? priceData.products[0] : priceData?.products
    const limitsData = Array.isArray(priceData?.plan_limits) ? priceData.plan_limits[0] : priceData?.plan_limits

    const formattedSubscription = subData ? {
        planName: productsData?.name || 'Plano',
        status: subData.status,
        currentPeriodEnd: subData.current_period_end,
        limits: {
            users: limitsData?.max_users || 1,
            contacts: limitsData?.max_contacts || 100,
            pipelines: limitsData?.max_pipelines || 1
        }
    } : undefined


    return (
        <div className="min-h-[calc(100vh-6rem)] space-y-8">
            {/* Header com gradiente decorativo */}
            <div className="relative overflow-hidden rounded-2xl glass-heavy p-8">
                <div className="relative flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Sparkles className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-display text-foreground">Configurações</h1>
                            <p className="text-muted-foreground mt-1">Gerencie sua equipe, integrações e preferências.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seção: Assinatura (NOVO) */}
            <section className="animate-fade-in" style={{ animationDelay: '50ms' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <CreditCard className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-headline text-foreground">Assinatura</h2>
                </div>
                <div className="max-w-3xl">
                    <SubscriptionCard subscription={formattedSubscription} />
                </div>
            </section>

            {/* Seção: Equipe e WhatsApp */}
            <section className="animate-fade-in" style={{ animationDelay: '100ms' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Users className="h-4 w-4 text-primary" />
                    </div>
                    <h2 className="text-headline text-foreground">Equipe & Conexões</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="animate-slide-up" style={{ animationDelay: '150ms' }}>
                        <TeamManagement members={members || []} />
                    </div>
                    <div className="space-y-6">
                        <div className="animate-slide-up" style={{ animationDelay: '200ms' }}>
                            <WhatsAppConnectionCard />
                        </div>
                        <div className="animate-slide-up" style={{ animationDelay: '250ms' }}>
                            <MessageSettingsCard />
                        </div>
                    </div>
                </div>
            </section>

            {/* Seção: IA Agent Config */}
            <section className="animate-fade-in" style={{ animationDelay: '300ms' }}>
                <AISettingsCard />
            </section>


            {/* Seção: Integrações */}
            <section className="animate-fade-in" style={{ animationDelay: '350ms' }}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                        <KeyRound className="h-4 w-4 text-accent" />
                    </div>
                    <h2 className="text-headline text-foreground">Integrações & API</h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* API Keys Section */}
                    <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '400ms' }}>
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                                    <Key className="h-5 w-5 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-foreground">Chaves de API</h3>
                                    <p className="text-sm text-muted-foreground">Integração com n8n e sistemas externos</p>
                                </div>
                            </div>
                        </div>

                        {/* Generate Form */}
                        <GenerateKeyForm />

                        {/* Keys List */}
                        <div className="space-y-3 mt-4">
                            {keys?.map((key, index) => (
                                <div
                                    key={key.id}
                                    className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 group hover:border-accent/30 hover:bg-accent/5 transition-all duration-300"
                                    style={{ animationDelay: `${350 + index * 50}ms` }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-gradient-to-br from-accent/20 to-accent/5 rounded-lg flex items-center justify-center text-accent font-mono text-xs font-bold border border-accent/20">
                                            KEY
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{key.label}</p>
                                            <p className="text-xs text-muted-foreground font-mono">Criado em: {new Date(key.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                                        <button className="p-2 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-colors" title="Copiar">
                                            <Copy className="h-4 w-4" />
                                        </button>
                                        <form action={async () => {
                                            'use server'
                                            await revokeApiKey(key.id)
                                        }}>
                                            <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors" title="Revogar">
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ))}
                            {keys?.length === 0 && (
                                <div className="text-center py-10 rounded-xl border-2 border-dashed border-border/50">
                                    <div className="h-14 w-14 bg-muted/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                        <Key className="h-7 w-7 text-muted-foreground/50" />
                                    </div>
                                    <p className="text-muted-foreground font-medium">Nenhuma chave de API ativa</p>
                                    <p className="text-xs text-muted-foreground/70 mt-1">Gere uma chave para integrar com sistemas externos</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Tag Management */}
                    <div className="animate-slide-up" style={{ animationDelay: '450ms' }}>
                        <TagManagement />
                    </div>
                </div>
            </section>
        </div>
    )
}
