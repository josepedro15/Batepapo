'use client'

import {
    Megaphone,
    Pause,
    Play,
    Trash2,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    Users,
    MessageSquare,
    MoreVertical
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export type CampaignStatus = 'draft' | 'scheduled' | 'sending' | 'paused' | 'done' | 'deleting'

export interface Campaign {
    id: string
    name: string
    status: CampaignStatus
    total_contacts: number
    sent_count: number
    failed_count: number
    created_at: string
    scheduled_for?: string | null
    message_template?: string
}

interface CampaignCardProps {
    campaign: Campaign
    onPause?: (id: string) => Promise<void>
    onResume?: (id: string) => Promise<void>
    onDelete?: (id: string) => Promise<void>
}

const statusConfig: Record<CampaignStatus, {
    label: string
    color: string
    bgColor: string
    icon: typeof Clock
}> = {
    draft: {
        label: 'Rascunho',
        color: 'text-muted-foreground',
        bgColor: 'bg-muted/50',
        icon: Clock
    },
    scheduled: {
        label: 'Agendada',
        color: 'text-primary',
        bgColor: 'bg-primary/10',
        icon: Clock
    },
    sending: {
        label: 'Enviando',
        color: 'text-accent',
        bgColor: 'bg-accent/10',
        icon: Loader2
    },
    paused: {
        label: 'Pausada',
        color: 'text-warning',
        bgColor: 'bg-warning/10',
        icon: Pause
    },
    done: {
        label: 'Concluída',
        color: 'text-success',
        bgColor: 'bg-success/10',
        icon: CheckCircle2
    },
    deleting: {
        label: 'Excluindo...',
        color: 'text-destructive',
        bgColor: 'bg-destructive/10',
        icon: Loader2
    },
}

export function CampaignCard({ campaign, onPause, onResume, onDelete }: CampaignCardProps) {
    const [isActioning, setIsActioning] = useState(false)
    const [showMenu, setShowMenu] = useState(false)

    const status = statusConfig[campaign.status] || statusConfig.draft
    const StatusIcon = status.icon
    const progress = campaign.total_contacts > 0
        ? Math.round((campaign.sent_count / campaign.total_contacts) * 100)
        : 0

    const handlePause = async () => {
        if (!onPause) return
        setIsActioning(true)
        try {
            await onPause(campaign.id)
        } finally {
            setIsActioning(false)
            setShowMenu(false)
        }
    }

    const handleResume = async () => {
        if (!onResume) return
        setIsActioning(true)
        try {
            await onResume(campaign.id)
        } finally {
            setIsActioning(false)
            setShowMenu(false)
        }
    }

    const handleDelete = async () => {
        if (!onDelete) return
        if (!confirm(`Tem certeza que deseja excluir a campanha "${campaign.name}"?`)) return
        setIsActioning(true)
        try {
            await onDelete(campaign.id)
        } finally {
            setIsActioning(false)
            setShowMenu(false)
        }
    }

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr)
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="glass p-5 rounded-2xl border border-border/50 hover:border-primary/20 transition-all group">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                        <Megaphone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-bold text-foreground">{campaign.name}</h3>
                        <p className="text-xs text-muted-foreground">
                            Criada em {formatDate(campaign.created_at)}
                        </p>
                    </div>
                </div>

                {/* Status Badge */}
                <div className={cn(
                    "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium",
                    status.bgColor, status.color
                )}>
                    <StatusIcon className={cn(
                        "h-4 w-4",
                        campaign.status === 'sending' && "animate-spin"
                    )} />
                    {status.label}
                </div>
            </div>

            {/* Progress Bar */}
            {campaign.status !== 'draft' && (
                <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-muted-foreground">Progresso</span>
                        <span className="text-sm font-medium text-foreground">{progress}%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                            className={cn(
                                "h-full rounded-full transition-all duration-500",
                                campaign.status === 'done' ? "bg-success" : "bg-primary"
                            )}
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-muted/30 rounded-xl">
                    <div className="flex items-center justify-center gap-1 text-muted-foreground mb-1">
                        <Users className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-bold text-foreground">{campaign.total_contacts}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-success/5 rounded-xl border border-success/10">
                    <div className="flex items-center justify-center gap-1 text-success mb-1">
                        <CheckCircle2 className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-bold text-success">{campaign.sent_count}</p>
                    <p className="text-xs text-muted-foreground">Enviadas</p>
                </div>
                <div className="text-center p-3 bg-destructive/5 rounded-xl border border-destructive/10">
                    <div className="flex items-center justify-center gap-1 text-destructive mb-1">
                        <AlertCircle className="h-4 w-4" />
                    </div>
                    <p className="text-lg font-bold text-destructive">{campaign.failed_count}</p>
                    <p className="text-xs text-muted-foreground">Falhas</p>
                </div>
            </div>

            {/* Message Preview */}
            {campaign.message_template && (
                <div className="mb-4 p-3 bg-muted/20 rounded-xl border border-border/50">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <MessageSquare className="h-4 w-4" />
                        <span className="text-xs font-medium">Mensagem</span>
                    </div>
                    <p className="text-sm text-foreground line-clamp-2">
                        {campaign.message_template}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-2">
                {/* Show Pause for sending campaigns */}
                {campaign.status === 'sending' && onPause && (
                    <button
                        onClick={handlePause}
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-warning/10 text-warning rounded-xl font-medium text-sm hover:bg-warning/20 transition-colors disabled:opacity-50"
                    >
                        {isActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Pause className="h-4 w-4" />
                        )}
                        Pausar
                    </button>
                )}

                {/* Show Resume for paused campaigns */}
                {campaign.status === 'paused' && onResume && (
                    <button
                        onClick={handleResume}
                        disabled={isActioning}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-success/10 text-success rounded-xl font-medium text-sm hover:bg-success/20 transition-colors disabled:opacity-50"
                    >
                        {isActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Play className="h-4 w-4" />
                        )}
                        Continuar
                    </button>
                )}

                {/* Delete button for non-active campaigns */}
                {(campaign.status === 'draft' || campaign.status === 'done' || campaign.status === 'paused') && onDelete && (
                    <button
                        onClick={handleDelete}
                        disabled={isActioning}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-destructive/10 text-destructive rounded-xl font-medium text-sm hover:bg-destructive/20 transition-colors disabled:opacity-50"
                    >
                        {isActioning ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Trash2 className="h-4 w-4" />
                        )}
                    </button>
                )}

                {/* More options menu */}
                <div className="relative">
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors"
                    >
                        <MoreVertical className="h-5 w-5" />
                    </button>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-1 w-48 glass rounded-xl border border-border shadow-xl z-10">
                            <div className="p-1">
                                {campaign.status === 'sending' && onPause && (
                                    <button
                                        onClick={handlePause}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-warning hover:bg-warning/10 rounded-lg"
                                    >
                                        <Pause className="h-4 w-4" />
                                        Pausar Campanha
                                    </button>
                                )}
                                {campaign.status === 'paused' && onResume && (
                                    <button
                                        onClick={handleResume}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-success hover:bg-success/10 rounded-lg"
                                    >
                                        <Play className="h-4 w-4" />
                                        Continuar Campanha
                                    </button>
                                )}
                                {onDelete && campaign.status !== 'sending' && campaign.status !== 'deleting' && (
                                    <button
                                        onClick={handleDelete}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-lg"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                        Excluir Campanha
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Scheduled info */}
            {campaign.status === 'scheduled' && campaign.scheduled_for && (
                <div className="mt-3 pt-3 border-t border-border/50">
                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Agendada para {formatDate(campaign.scheduled_for)}
                    </p>
                </div>
            )}
        </div>
    )
}

// Skeleton loader for campaigns
export function CampaignCardSkeleton() {
    return (
        <div className="glass p-5 rounded-2xl border border-border/50 animate-pulse">
            <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-muted" />
                    <div>
                        <div className="h-5 w-32 bg-muted rounded" />
                        <div className="h-3 w-24 bg-muted rounded mt-2" />
                    </div>
                </div>
                <div className="h-7 w-20 bg-muted rounded-lg" />
            </div>
            <div className="h-2 bg-muted rounded-full mb-4" />
            <div className="grid grid-cols-3 gap-3">
                <div className="h-20 bg-muted rounded-xl" />
                <div className="h-20 bg-muted rounded-xl" />
                <div className="h-20 bg-muted rounded-xl" />
            </div>
        </div>
    )
}
