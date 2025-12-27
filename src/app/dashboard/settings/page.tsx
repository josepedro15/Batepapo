import { createClient } from '@/lib/supabase/server'
import { revokeApiKey } from './actions'
import { GenerateKeyForm } from './generate-key-form'
import { TeamManagement } from '@/components/settings/team-management'
import { TagManagement } from '@/components/settings/tag-management'
import { WhatsappStatusCard } from '@/components/settings/whatsapp-status-card'
import { Key, Trash2, Settings2, Shield, Palette, Bell, Database, Copy } from 'lucide-react'

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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-display text-foreground">Configurações</h1>
                    <p className="text-muted-foreground mt-1">Gerencie sua equipe, integrações e preferências.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium">
                        Plano PRO
                    </span>
                </div>
            </div>

            {/* Main Grid - 2 columns layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Main Settings */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Team Management */}
                    <TeamManagement members={members || []} />

                    {/* API Keys Section */}
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Key className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-foreground">Chaves de API</h2>
                                    <p className="text-sm text-muted-foreground">Integração com n8n e sistemas externos</p>
                                </div>
                            </div>
                        </div>

                        {/* Generate Form */}
                        <GenerateKeyForm />

                        {/* Keys List */}
                        <div className="space-y-3 mt-4">
                            {keys?.map((key) => (
                                <div key={key.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 group hover:border-primary/20 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-mono text-xs font-bold">
                                            KEY
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{key.label}</p>
                                            <p className="text-xs text-muted-foreground font-mono">Criado em: {new Date(key.created_at).toLocaleDateString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors" title="Copiar">
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
                                <div className="text-center py-8 text-muted-foreground">
                                    <Key className="h-10 w-10 mx-auto mb-3 opacity-30" />
                                    <p>Nenhuma chave de API ativa</p>
                                    <p className="text-xs mt-1">Gere uma chave para integrar com sistemas externos</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Right Column - Secondary Settings */}
                <div className="space-y-6">
                    {/* WhatsApp Status */}
                    <WhatsappStatusCard />

                    {/* Tag Management */}
                    <TagManagement />

                    {/* Quick Settings */}
                    <div className="glass p-6 rounded-2xl">
                        <div className="flex items-center gap-2 mb-4">
                            <Settings2 className="h-5 w-5 text-muted-foreground" />
                            <h3 className="font-bold text-foreground">Preferências</h3>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group">
                                <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex-1">
                                    <p className="font-medium text-foreground text-sm">Notificações</p>
                                    <p className="text-xs text-muted-foreground">Alertas e sons</p>
                                </div>
                            </button>

                            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group">
                                <Palette className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex-1">
                                    <p className="font-medium text-foreground text-sm">Aparência</p>
                                    <p className="text-xs text-muted-foreground">Tema e cores</p>
                                </div>
                            </button>

                            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group">
                                <Shield className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex-1">
                                    <p className="font-medium text-foreground text-sm">Segurança</p>
                                    <p className="text-xs text-muted-foreground">Senha e 2FA</p>
                                </div>
                            </button>

                            <button className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left group">
                                <Database className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                <div className="flex-1">
                                    <p className="font-medium text-foreground text-sm">Dados</p>
                                    <p className="text-xs text-muted-foreground">Exportar e backup</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
