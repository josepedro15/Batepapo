'use client'

import { toggleAutomaticMessageRule } from './actions'
import { Switch } from '@/components/ui/switch'
import { toast } from 'sonner'
import { useState } from 'react'

export function ToggleSwitch({ id, isActive }: { id: string, isActive: boolean }) {
    const [loading, setLoading] = useState(false)

    const handleToggle = async (checked: boolean) => {
        setLoading(true)
        try {
            await toggleAutomaticMessageRule(id, checked)
            toast.success(checked ? 'Regra ativada.' : 'Regra desativada.')
        } catch (error) {
            toast.error('Erro ao atualizar status.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Switch
            checked={isActive}
            onCheckedChange={handleToggle}
            disabled={loading}
        />
    )
}
