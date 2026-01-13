'use client'

import { useState, useEffect, useTransition, useCallback, useRef } from 'react'
import {
    Megaphone,
    Send,
    Clock,
    Zap,
    AlertTriangle,
    Info,
    Calendar,
    Target,
    BarChart3,
    Plus,
    List as ListIcon,
    Settings2,
    Loader2,
    RefreshCw
} from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    MessageBuilder,
    ContactSelector,
    CampaignCard,
    CampaignCardSkeleton,
    type MessageContent,
    type Contact,
    type Campaign,
    type Tag,
    type Stage
} from '@/components/campaigns'
import {
    createCampaign,
    getCampaigns,
    getContactsForCampaign,
    getTags,
    getStages,
    pauseCampaign,
    resumeCampaign,
    deleteCampaign,
    syncAllActiveCampaigns,
    type CreateCampaignInput
} from './actions'

type TabType = 'new' | 'list'

export default function CampaignsPage() {
    // State
    const [activeTab, setActiveTab] = useState<TabType>('new')
    const [isPending, startTransition] = useTransition()

    // Form state
    const [campaignName, setCampaignName] = useState('')
    const [messages, setMessages] = useState<MessageContent[]>([])
    const [selectedContactIds, setSelectedContactIds] = useState<string[]>([])
    const [delayMin, setDelayMin] = useState(3)
    const [delayMax, setDelayMax] = useState(6)
    const [scheduledFor, setScheduledFor] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState<string | null>(null)

    // Data state
    const [contacts, setContacts] = useState<Contact[]>([])
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [stages, setStages] = useState<Stage[]>([])
    const [loadingContacts, setLoadingContacts] = useState(false)
    const [loadingCampaigns, setLoadingCampaigns] = useState(true)
    const [contactsPage, setContactsPage] = useState(1)
    const [hasMoreContacts, setHasMoreContacts] = useState(false)
    const [currentFilters, setCurrentFilters] = useState<{ tagName?: string; stageId?: string }>({})

    // Load contacts with filters
    const loadContacts = useCallback(async (filters?: { tagName?: string; stageId?: string }) => {
        setLoadingContacts(true)
        setContactsPage(1)
        try {
            const result = await getContactsForCampaign(1, 100, filters)
            setContacts(result.contacts)
            setHasMoreContacts(result.hasMore)
        } catch (err) {
            console.error('Error loading contacts:', err)
        } finally {
            setLoadingContacts(false)
        }
    }, [])

    // Initial load
    useEffect(() => {
        loadContacts()

        // Load tags and stages
        async function loadFiltersData() {
            try {
                const [tagsData, stagesData] = await Promise.all([
                    getTags(),
                    getStages()
                ])
                setTags(tagsData)
                setStages(stagesData)
            } catch (err) {
                console.error('Error loading filters data:', err)
            }
        }
        loadFiltersData()
    }, [loadContacts])

    // Load campaigns
    useEffect(() => {
        loadCampaigns()
    }, [])

    // Poll for active campaigns status updates
    const pollingRef = useRef<NodeJS.Timeout | null>(null)
    
    // Memoize check for active campaigns to avoid dependency issues
    const hasActiveCampaigns = campaigns.some(
        c => c.status === 'sending' || c.status === 'scheduled'
    )
    
    useEffect(() => {
        // Only poll when on list tab and there are active campaigns
        if (activeTab === 'list' && hasActiveCampaigns) {
            const pollStatus = async () => {
                try {
                    const result = await syncAllActiveCampaigns()
                    if (result.success && result.campaigns) {
                        setCampaigns(result.campaigns as Campaign[])
                    }
                } catch (err) {
                    console.error('Error polling campaign status:', err)
                }
            }
            
            // Poll every 5 seconds
            pollingRef.current = setInterval(pollStatus, 5000)
            
            // Also poll immediately on first render
            pollStatus()
            
            return () => {
                if (pollingRef.current) {
                    clearInterval(pollingRef.current)
                    pollingRef.current = null
                }
            }
        } else {
            // Clear any existing polling
            if (pollingRef.current) {
                clearInterval(pollingRef.current)
                pollingRef.current = null
            }
        }
    }, [activeTab, hasActiveCampaigns])

    async function loadCampaigns() {
        setLoadingCampaigns(true)
        try {
            const data = await getCampaigns()
            setCampaigns(data as Campaign[])
        } catch (err) {
            console.error('Error loading campaigns:', err)
        } finally {
            setLoadingCampaigns(false)
        }
    }

    // Handle filter change from ContactSelector
    const handleFilterChange = useCallback((filters: { tagName?: string; stageId?: string }) => {
        setCurrentFilters(filters)
        setSelectedContactIds([]) // Clear selection when filters change
        loadContacts(filters)
    }, [loadContacts])

    // Load more contacts
    const loadMoreContacts = async () => {
        if (loadingContacts || !hasMoreContacts) return
        setLoadingContacts(true)
        try {
            const result = await getContactsForCampaign(contactsPage + 1, 100, currentFilters)
            setContacts(prev => [...prev, ...result.contacts])
            setContactsPage(prev => prev + 1)
            setHasMoreContacts(result.hasMore)
        } catch (err) {
            console.error('Error loading more contacts:', err)
        } finally {
            setLoadingContacts(false)
        }
    }

    // Handle form submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (!campaignName.trim()) {
            setError('Digite um nome para a campanha')
            return
        }

        if (messages.length === 0) {
            setError('Adicione pelo menos uma mensagem')
            return
        }

        if (selectedContactIds.length === 0) {
            setError('Selecione pelo menos um contato')
            return
        }

        const input: CreateCampaignInput = {
            name: campaignName,
            delayMin,
            delayMax,
            scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
            contactIds: selectedContactIds,
            messages: messages.map(m => ({
                type: m.type,
                text: m.text,
                file: m.file,
                docName: m.docName,
                footerText: m.footerText,
                imageButton: m.imageButton,
                listButton: m.listButton,
                choices: m.choices
            }))
        }

        startTransition(async () => {
            const result = await createCampaign(input)

            if (result.success) {
                setSuccess('Campanha criada com sucesso!')
                setCampaignName('')
                setMessages([])
                setSelectedContactIds([])
                setScheduledFor('')
                // Reload campaigns and switch to list tab
                loadCampaigns()
                setTimeout(() => setActiveTab('list'), 1500)
            } else {
                setError(result.error || 'Erro ao criar campanha')
            }
        })
    }

    // Campaign controls
    const handlePause = async (id: string) => {
        const result = await pauseCampaign(id)
        if (result.success) {
            loadCampaigns()
        } else {
            alert(result.error)
        }
    }

    const handleResume = async (id: string) => {
        const result = await resumeCampaign(id)
        if (result.success) {
            loadCampaigns()
        } else {
            alert(result.error)
        }
    }

    const handleDelete = async (id: string) => {
        const result = await deleteCampaign(id)
        if (result.success) {
            loadCampaigns()
        } else {
            alert(result.error)
        }
    }

    const features = [
        {
            icon: Clock,
            title: "Envio Gradual",
            description: `Delay de ${delayMin}-${delayMax}s entre mensagens`
        },
        {
            icon: Target,
            title: "Segmentação",
            description: "Selecione contatos específicos"
        }
    ]

    const tips = [
        "Evite palavras como 'grátis', 'promoção imperdível' ou 'dinheiro'",
        "Personalize com o nome: Use {{nome}} para inserir o nome do contato",
        "Mantenha mensagens curtas e objetivas (máx. 300 caracteres)",
        "Envie em horários comerciais (8h-18h) para melhor engajamento"
    ]

    return (
        <div className="min-h-[calc(100vh-6rem)] space-y-8">
            {/* Header com gradiente decorativo */}
            <div className="relative overflow-hidden rounded-2xl glass-heavy p-8">
                <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center shadow-lg shadow-primary/30">
                            <Megaphone className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <div>
                            <h1 className="text-display text-foreground">Campanhas em Massa</h1>
                            <p className="text-muted-foreground mt-1">Dispare mensagens para seus contatos com segurança.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-success/10 border border-success/20">
                        <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
                        <span className="text-success font-medium text-sm">Sistema Ativo</span>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setActiveTab('new')}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
                        activeTab === 'new'
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <Plus className="h-5 w-5" />
                    Nova Campanha
                </button>
                <button
                    onClick={() => {
                        setActiveTab('list')
                        loadCampaigns()
                    }}
                    className={cn(
                        "flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all",
                        activeTab === 'list'
                            ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                            : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                >
                    <ListIcon className="h-5 w-5" />
                    Minhas Campanhas
                    {campaigns.length > 0 && (
                        <span className="ml-1 px-2 py-0.5 bg-primary-foreground/20 rounded-full text-xs">
                            {campaigns.length}
                        </span>
                    )}
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'new' ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Campaign Form - Takes 2 columns */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-xl text-destructive">
                                <AlertTriangle className="h-5 w-5 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-3 p-4 bg-success/10 border border-success/20 rounded-xl text-success">
                                <Zap className="h-5 w-5 shrink-0" />
                                <p>{success}</p>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Basic Info */}
                            <div className="glass p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                        <Send className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Informações da Campanha</h2>
                                        <p className="text-sm text-muted-foreground">Configure os detalhes básicos</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-sm font-semibold text-foreground">Nome da Campanha *</label>
                                        <input
                                            value={campaignName}
                                            onChange={(e) => setCampaignName(e.target.value)}
                                            placeholder="Ex: Promoção de Natal"
                                            className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 hover:bg-muted/70"
                                            required
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-semibold text-foreground">Agendar Envio</label>
                                        <div className="relative mt-2">
                                            <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                            <input
                                                type="datetime-local"
                                                value={scheduledFor}
                                                onChange={(e) => setScheduledFor(e.target.value)}
                                                className="w-full bg-muted/50 border border-border rounded-xl p-3.5 pl-11 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all duration-200 hover:bg-muted/70"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Delay Settings */}
                                <div className="mt-4 p-4 bg-muted/30 rounded-xl">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium text-foreground">Configurações de Envio</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-xs text-muted-foreground">Delay Mínimo (seg)</label>
                                            <input
                                                type="number"
                                                value={delayMin}
                                                onChange={(e) => setDelayMin(Number(e.target.value))}
                                                min={1}
                                                max={delayMax}
                                                className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs text-muted-foreground">Delay Máximo (seg)</label>
                                            <input
                                                type="number"
                                                value={delayMax}
                                                onChange={(e) => setDelayMax(Number(e.target.value))}
                                                min={delayMin}
                                                max={60}
                                                className="w-full mt-1 bg-background border border-border rounded-lg p-2 text-sm"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Contact Selector */}
                            <div className="glass p-6 rounded-2xl">
                                <ContactSelector
                                    contacts={contacts}
                                    selectedIds={selectedContactIds}
                                    onChange={setSelectedContactIds}
                                    loading={loadingContacts}
                                    hasMore={hasMoreContacts}
                                    onLoadMore={loadMoreContacts}
                                    tags={tags}
                                    stages={stages}
                                    onFilterChange={handleFilterChange}
                                />
                            </div>

                            {/* Message Builder */}
                            <div className="glass p-6 rounded-2xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                                        <Megaphone className="h-6 w-6 text-accent" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-foreground">Mensagens</h2>
                                        <p className="text-sm text-muted-foreground">Configure o conteúdo da campanha</p>
                                    </div>
                                </div>

                                <MessageBuilder
                                    value={messages}
                                    onChange={setMessages}
                                />
                            </div>

                            {/* Warning Banner */}
                            <div className="flex items-start gap-3 p-4 bg-warning/10 border border-warning/20 rounded-xl">
                                <div className="h-8 w-8 rounded-lg bg-warning/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="h-4 w-4 text-warning" />
                                </div>
                                <div>
                                    <p className="text-warning font-medium text-sm">Atenção ao conteúdo</p>
                                    <p className="text-warning/80 text-xs mt-1">
                                        Esta campanha será enviada para <strong>{selectedContactIds.length}</strong> contato{selectedContactIds.length !== 1 ? 's' : ''}.
                                        Revise as mensagens antes de enviar.
                                    </p>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={isPending || !campaignName || messages.length === 0 || selectedContactIds.length === 0}
                                className={cn(
                                    "w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3",
                                    "bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-primary-foreground",
                                    "shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
                                    "disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none",
                                    "active:scale-[0.99]"
                                )}
                            >
                                {isPending ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Criando Campanha...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="h-5 w-5" />
                                        Iniciar Campanha
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Right Sidebar */}
                    <div className="space-y-6">
                        {/* Features Card */}
                        <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '150ms' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                                    <Megaphone className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="font-bold text-foreground">Como funciona?</h3>
                            </div>

                            <div className="space-y-4">
                                {features.map((feature, index) => (
                                    <div key={index} className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/30 transition-all duration-200">
                                        <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 border border-primary/10">
                                            <feature.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground text-sm">{feature.title}</p>
                                            <p className="text-xs text-muted-foreground">{feature.description}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Tips Card */}
                        <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '200ms' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center border border-accent/20">
                                    <Info className="h-5 w-5 text-accent" />
                                </div>
                                <h3 className="font-bold text-foreground">Dicas Importantes</h3>
                            </div>

                            <ul className="space-y-3">
                                {tips.map((tip, index) => (
                                    <li key={index} className="flex items-start gap-3 text-sm text-muted-foreground">
                                        <span className="h-6 w-6 rounded-lg bg-accent/10 text-accent text-xs flex items-center justify-center shrink-0 font-bold border border-accent/20">
                                            {index + 1}
                                        </span>
                                        <span className="pt-0.5">{tip}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Warning Alert - Best Practices */}
                        <div className="p-5 rounded-2xl bg-gradient-to-br from-warning/10 to-warning/5 border border-warning/20 animate-slide-up" style={{ animationDelay: '225ms' }}>
                            <div className="flex items-start gap-3">
                                <div className="h-10 w-10 rounded-xl bg-warning/20 flex items-center justify-center shrink-0">
                                    <AlertTriangle className="h-5 w-5 text-warning" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-warning mb-2">⚠️ Boas Práticas</h3>
                                    <p className="text-sm text-warning/90 mb-3">
                                        Para evitar bloqueio da sua conta no WhatsApp:
                                    </p>
                                    <ul className="space-y-2 text-sm text-warning/80">
                                        <li className="flex items-start gap-2">
                                            <span className="text-warning">•</span>
                                            <span>Não faça muitos envios de uma só vez</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-warning">•</span>
                                            <span>Configure um delay adequado entre mensagens (mínimo 5-10s)</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-warning">•</span>
                                            <span>Evite enviar várias vezes para o mesmo contato</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="text-warning">•</span>
                                            <span>Limite de 100-200 mensagens por dia é recomendado</span>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Stats Preview */}
                        <div className="glass p-6 rounded-2xl animate-slide-up" style={{ animationDelay: '250ms' }}>
                            <div className="flex items-center gap-3 mb-5">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-success/20 to-success/5 flex items-center justify-center border border-success/20">
                                    <BarChart3 className="h-5 w-5 text-success" />
                                </div>
                                <h3 className="font-bold text-foreground">Resumo</h3>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/20 transition-all duration-200">
                                    <p className="text-3xl font-bold text-foreground">{selectedContactIds.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Contatos</p>
                                </div>
                                <div className="text-center p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-success/20 transition-all duration-200">
                                    <p className="text-3xl font-bold text-primary">{messages.length}</p>
                                    <p className="text-xs text-muted-foreground mt-1">Mensagens</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Campaigns List */
                <div className="space-y-6">
                    {/* Header with refresh */}
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Suas Campanhas</h2>
                            <p className="text-sm text-muted-foreground">
                                {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} encontrada{campaigns.length !== 1 ? 's' : ''}
                            </p>
                        </div>
                        <button
                            onClick={loadCampaigns}
                            disabled={loadingCampaigns}
                            className="flex items-center gap-2 px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <RefreshCw className={cn("h-4 w-4", loadingCampaigns && "animate-spin")} />
                            Atualizar
                        </button>
                    </div>

                    {/* Campaigns Grid */}
                    {loadingCampaigns ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CampaignCardSkeleton />
                            <CampaignCardSkeleton />
                        </div>
                    ) : campaigns.length === 0 ? (
                        <div className="glass p-12 rounded-2xl text-center">
                            <div className="h-16 w-16 rounded-2xl bg-muted/50 mx-auto flex items-center justify-center mb-4">
                                <Megaphone className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-lg font-bold text-foreground mb-2">Nenhuma campanha ainda</h3>
                            <p className="text-muted-foreground mb-6">Crie sua primeira campanha para começar a enviar mensagens em massa.</p>
                            <button
                                onClick={() => setActiveTab('new')}
                                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                            >
                                <Plus className="h-5 w-5" />
                                Criar Campanha
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {campaigns.map((campaign) => (
                                <CampaignCard
                                    key={campaign.id}
                                    campaign={campaign}
                                    onPause={handlePause}
                                    onResume={handleResume}
                                    onDelete={handleDelete}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
