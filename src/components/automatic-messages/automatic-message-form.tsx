'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { createAutomaticMessageRule, updateAutomaticMessageRule } from '@/app/dashboard/automatic-messages/actions'
import { toast } from 'sonner'
import { Plus, Pencil } from 'lucide-react'

interface Rule {
    id: string
    organization_id: string
    name: string
    message: string
    start_time: string
    end_time: string
    is_active: boolean
}

interface AutomaticMessageFormProps {
    organizationId: string
    rule?: Rule
    trigger?: React.ReactNode
}

export function AutomaticMessageForm({ organizationId, rule, trigger }: AutomaticMessageFormProps) {
    const [open, setOpen] = useState(false)
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: rule?.name || '',
        message: rule?.message || '',
        start_time: rule?.start_time || '09:00',
        end_time: rule?.end_time || '18:00',
        is_active: rule?.is_active ?? true
    })

    // Ensure time format is HH:MM
    const formatTime = (timeString: string) => {
        if (!timeString) return '00:00';
        return timeString.substring(0, 5);
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            if (rule) {
                await updateAutomaticMessageRule(rule.id, formData)
                toast.success('Regra atualizada com sucesso!')
            } else {
                await createAutomaticMessageRule({
                    organization_id: organizationId,
                    ...formData
                })
                toast.success('Regra criada com sucesso!')
            }
            setOpen(false)
            if (!rule) {
                setFormData({
                    name: '',
                    message: '',
                    start_time: '09:00',
                    end_time: '18:00',
                    is_active: true
                })
            }
        } catch (error) {
            console.error(error)
            toast.error('Erro ao salvar regra')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {trigger || (
                    <Button>
                        <Plus className="w-4 h-4 mr-2" />
                        Nova Regra
                    </Button>
                )}
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{rule ? 'Editar Regra' : 'Nova Regra de Mensagem Automática'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Regra</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: Mensagem Fora do Horário"
                            required
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="start_time">Horário Início</Label>
                            <Input
                                id="start_time"
                                type="time"
                                value={formatTime(formData.start_time)}
                                onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="end_time">Horário Fim</Label>
                            <Input
                                id="end_time"
                                type="time"
                                value={formatTime(formData.end_time)}
                                onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="message">Mensagem</Label>
                        <Textarea
                            id="message"
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            placeholder="Digite a mensagem que será enviada..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="flex items-center space-x-2">
                        <Switch
                            id="is_active"
                            checked={formData.is_active}
                            onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        />
                        <Label htmlFor="is_active">Regra Ativa</Label>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
