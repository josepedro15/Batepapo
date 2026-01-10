'use client'

import { useEffect, useState } from 'react'
import { 
    Shield, Search, Loader2, CheckCircle, XCircle, Crown, Zap,
    Package, Plus, Edit2, Trash2, Save, X, Users, Phone, Layers, DollarSign
} from 'lucide-react'

type User = {
    id: string
    email: string
    name: string
    avatar_url: string
    created_at: string
    is_super_admin: boolean
    subscription: {
        status: string
        planName: string
        currentPeriodEnd: string
    } | null
}

type Plan = {
    id: string
    name: string
    description: string
    active: boolean
    created_at: string
    price_id: string | null
    price_amount: number
    price_currency: string
    price_interval: string
    max_users: number
    max_contacts: number
    max_pipelines: number
    features: string[]
}

export default function AdminPage() {
    const [activeTab, setActiveTab] = useState<'users' | 'plans'>('users')
    const [users, setUsers] = useState<User[]>([])
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    // Plan editing state
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)
    const [isCreatingPlan, setIsCreatingPlan] = useState(false)
    const [planForm, setPlanForm] = useState({
        name: '',
        description: '',
        price_amount: 0,
        max_users: 1,
        max_contacts: 100,
        max_pipelines: 1,
        features: [] as string[],
        newFeature: ''
    })

    useEffect(() => {
        if (activeTab === 'users') {
            fetchUsers()
        } else {
            fetchPlans()
        }
    }, [activeTab])

    const fetchUsers = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/users?t=${Date.now()}`, {
                cache: 'no-store',
                next: { revalidate: 0 }
            })
            if (!res.ok) throw new Error('Failed to fetch users')
            const data = await res.json()
            setUsers(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const fetchPlans = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/admin/plans?t=${Date.now()}`, {
                cache: 'no-store'
            })
            if (!res.ok) throw new Error('Failed to fetch plans')
            const data = await res.json()
            setPlans(data)
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    const toggleAdmin = async (userId: string) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'toggle_admin' })
            })
            if (res.ok) {
                await fetchUsers()
            }
        } catch (error) {
            console.error(error)
        }
    }

    const updateUserPlan = async (userId: string, priceId: string) => {
        if (!confirm(`Tem certeza que deseja mudar o plano deste usuário?`)) return

        setLoading(true)
        try {
            const res = await fetch('/api/admin/users', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, action: 'update_plan', priceId })
            })

            if (res.ok) {
                await fetchUsers()
                alert('Plano atualizado com sucesso!')
            } else {
                const data = await res.json()
                alert('Erro ao atualizar plano: ' + (data.error || 'Erro desconhecido'))
            }
        } catch (error) {
            console.error(error)
            alert('Erro ao processar requisição')
        } finally {
            setLoading(false)
        }
    }

    const startEditPlan = (plan: Plan) => {
        setEditingPlan(plan)
        setPlanForm({
            name: plan.name,
            description: plan.description || '',
            price_amount: plan.price_amount,
            max_users: plan.max_users,
            max_contacts: plan.max_contacts,
            max_pipelines: plan.max_pipelines,
            features: plan.features || [],
            newFeature: ''
        })
    }

    const startCreatePlan = () => {
        setIsCreatingPlan(true)
        setEditingPlan(null)
        setPlanForm({
            name: '',
            description: '',
            price_amount: 0,
            max_users: 1,
            max_contacts: 100,
            max_pipelines: 1,
            features: [],
            newFeature: ''
        })
    }

    const cancelEdit = () => {
        setEditingPlan(null)
        setIsCreatingPlan(false)
    }

    const addFeature = () => {
        if (planForm.newFeature.trim()) {
            setPlanForm(prev => ({
                ...prev,
                features: [...prev.features, prev.newFeature.trim()],
                newFeature: ''
            }))
        }
    }

    const removeFeature = (index: number) => {
        setPlanForm(prev => ({
            ...prev,
            features: prev.features.filter((_, i) => i !== index)
        }))
    }

    const savePlan = async () => {
        setLoading(true)
        try {
            if (isCreatingPlan) {
                const res = await fetch('/api/admin/plans', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: planForm.name,
                        description: planForm.description,
                        price_amount: planForm.price_amount,
                        max_users: planForm.max_users,
                        max_contacts: planForm.max_contacts,
                        max_pipelines: planForm.max_pipelines,
                        features: planForm.features
                    })
                })
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error)
                }
                alert('Plano criado com sucesso!')
            } else if (editingPlan) {
                const res = await fetch('/api/admin/plans', {
                    method: 'PATCH',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        product_id: editingPlan.id,
                        price_id: editingPlan.price_id,
                        name: planForm.name,
                        description: planForm.description,
                        active: editingPlan.active,
                        price_amount: planForm.price_amount,
                        max_users: planForm.max_users,
                        max_contacts: planForm.max_contacts,
                        max_pipelines: planForm.max_pipelines,
                        features: planForm.features
                    })
                })
                if (!res.ok) {
                    const data = await res.json()
                    throw new Error(data.error)
                }
                alert('Plano atualizado com sucesso!')
            }
            cancelEdit()
            await fetchPlans()
        } catch (error: any) {
            console.error(error)
            alert('Erro: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const deletePlan = async (productId: string) => {
        if (!confirm('Tem certeza que deseja excluir este plano? Esta ação não pode ser desfeita.')) return

        setLoading(true)
        try {
            const res = await fetch(`/api/admin/plans?product_id=${productId}`, {
                method: 'DELETE'
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error)
            }
            alert('Plano excluído com sucesso!')
            await fetchPlans()
        } catch (error: any) {
            console.error(error)
            alert('Erro: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading && users.length === 0 && plans.length === 0) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Shield className="h-8 w-8 text-amber-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gerenciamento total do sistema, usuários e planos
                    </p>
                </div>
                <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-lg font-mono text-sm">
                    {users.length} Usuários | {plans.length} Planos
                </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 border-b border-border">
                <button
                    onClick={() => setActiveTab('users')}
                    className={`px-6 py-3 font-medium transition-all border-b-2 -mb-px ${
                        activeTab === 'users'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Users className="h-4 w-4 inline mr-2" />
                    Usuários
                </button>
                <button
                    onClick={() => setActiveTab('plans')}
                    className={`px-6 py-3 font-medium transition-all border-b-2 -mb-px ${
                        activeTab === 'plans'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                >
                    <Package className="h-4 w-4 inline mr-2" />
                    Planos
                </button>
            </div>

            {/* Users Tab */}
            {activeTab === 'users' && (
                <>
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <input
                            type="text"
                            placeholder="Buscar usuários por nome ou email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-12 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                        />
                    </div>

                    {/* Users Table */}
                    <div className="glass rounded-2xl overflow-hidden border border-border/50">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-muted/30 text-xs uppercase text-muted-foreground font-medium">
                                    <tr>
                                        <th className="px-6 py-4">Usuário</th>
                                        <th className="px-6 py-4">Status</th>
                                        <th className="px-6 py-4">Plano</th>
                                        <th className="px-6 py-4">Role</th>
                                        <th className="px-6 py-4">Cadastro</th>
                                        <th className="px-6 py-4 text-right">Ações</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-border/50">
                                    {filteredUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-muted/10 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center font-bold text-primary-foreground">
                                                        {user.name?.[0] || user.email?.[0]?.toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-foreground">{user.name || 'Sem nome'}</p>
                                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.subscription?.status === 'active' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-success/10 text-success">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Ativo
                                                    </span>
                                                ) : user.subscription?.status === 'trialing' ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                                                        <CheckCircle className="h-3 w-3" />
                                                        Trial
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-muted-foreground">
                                                        <XCircle className="h-3 w-3" />
                                                        Inativo
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-sm text-foreground font-medium capitalize">
                                                    {user.subscription?.planName || '-'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {user.is_super_admin ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-bold bg-amber-500 text-black">
                                                        <Shield className="h-3 w-3 fill-current" />
                                                        SUPER ADMIN
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-muted-foreground">User</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-muted-foreground">
                                                {new Date(user.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col gap-2 items-end">
                                                    <button
                                                        onClick={() => toggleAdmin(user.id)}
                                                        className={`
                                                            flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border
                                                            ${user.is_super_admin
                                                                ? 'bg-red-500/10 text-red-500 border-red-500/20 hover:bg-red-500/20'
                                                                : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'}
                                                        `}
                                                    >
                                                        <Shield className="h-3 w-3" />
                                                        {user.is_super_admin ? 'Revogar Admin' : 'Tornar Admin'}
                                                    </button>

                                                    {/* Plan Selector */}
                                                    {plans.length > 0 && (
                                                        <select
                                                            value={user.subscription?.planName || ''}
                                                            onChange={(e) => {
                                                                const plan = plans.find(p => p.name === e.target.value)
                                                                if (plan?.price_id) updateUserPlan(user.id, plan.price_id)
                                                            }}
                                                            className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-xs font-medium text-foreground"
                                                        >
                                                            <option value="">Selecionar Plano</option>
                                                            {plans.map(plan => (
                                                                <option key={plan.id} value={plan.name}>
                                                                    {plan.name} - R${(plan.price_amount / 100).toFixed(2)}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {/* Plans Tab */}
            {activeTab === 'plans' && (
                <>
                    {/* Create Button */}
                    {!isCreatingPlan && !editingPlan && (
                        <button
                            onClick={startCreatePlan}
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors"
                        >
                            <Plus className="h-4 w-4" />
                            Novo Plano
                        </button>
                    )}

                    {/* Plan Form */}
                    {(isCreatingPlan || editingPlan) && (
                        <div className="glass rounded-2xl p-6 border border-border/50">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-lg font-semibold text-foreground">
                                    {isCreatingPlan ? 'Criar Novo Plano' : `Editar: ${editingPlan?.name}`}
                                </h2>
                                <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Nome do Plano
                                    </label>
                                    <input
                                        type="text"
                                        value={planForm.name}
                                        onChange={(e) => setPlanForm(prev => ({ ...prev, name: e.target.value }))}
                                        className="w-full bg-muted/30 border border-border rounded-xl py-2.5 px-4 text-foreground"
                                        placeholder="Ex: Pro, Enterprise..."
                                    />
                                </div>

                                {/* Price */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Preço Mensal (centavos)
                                    </label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <input
                                            type="number"
                                            value={planForm.price_amount}
                                            onChange={(e) => setPlanForm(prev => ({ ...prev, price_amount: parseInt(e.target.value) || 0 }))}
                                            className="w-full bg-muted/30 border border-border rounded-xl py-2.5 pl-10 pr-4 text-foreground"
                                            placeholder="15000 = R$150,00"
                                        />
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">
                                        = R$ {(planForm.price_amount / 100).toFixed(2)}/mês
                                    </p>
                                </div>

                                {/* Description */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Descrição
                                    </label>
                                    <input
                                        type="text"
                                        value={planForm.description}
                                        onChange={(e) => setPlanForm(prev => ({ ...prev, description: e.target.value }))}
                                        className="w-full bg-muted/30 border border-border rounded-xl py-2.5 px-4 text-foreground"
                                        placeholder="Descrição do plano..."
                                    />
                                </div>

                                {/* Limits */}
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        <Users className="h-4 w-4 inline mr-1" />
                                        Máximo de Usuários
                                    </label>
                                    <input
                                        type="number"
                                        value={planForm.max_users}
                                        onChange={(e) => setPlanForm(prev => ({ ...prev, max_users: parseInt(e.target.value) || 1 }))}
                                        className="w-full bg-muted/30 border border-border rounded-xl py-2.5 px-4 text-foreground"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        <Phone className="h-4 w-4 inline mr-1" />
                                        Máximo de Contatos
                                    </label>
                                    <input
                                        type="number"
                                        value={planForm.max_contacts}
                                        onChange={(e) => setPlanForm(prev => ({ ...prev, max_contacts: parseInt(e.target.value) || 100 }))}
                                        className="w-full bg-muted/30 border border-border rounded-xl py-2.5 px-4 text-foreground"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        <Layers className="h-4 w-4 inline mr-1" />
                                        Máximo de Pipelines
                                    </label>
                                    <input
                                        type="number"
                                        value={planForm.max_pipelines}
                                        onChange={(e) => setPlanForm(prev => ({ ...prev, max_pipelines: parseInt(e.target.value) || 1 }))}
                                        className="w-full bg-muted/30 border border-border rounded-xl py-2.5 px-4 text-foreground"
                                    />
                                </div>

                                {/* Features */}
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-2">
                                        Features do Plano
                                    </label>
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            value={planForm.newFeature}
                                            onChange={(e) => setPlanForm(prev => ({ ...prev, newFeature: e.target.value }))}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                                            className="flex-1 bg-muted/30 border border-border rounded-xl py-2.5 px-4 text-foreground"
                                            placeholder="Adicionar feature..."
                                        />
                                        <button
                                            onClick={addFeature}
                                            className="px-4 py-2 bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-colors"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        {planForm.features.map((feature, i) => (
                                            <span
                                                key={i}
                                                className="inline-flex items-center gap-1 px-3 py-1 bg-muted/50 text-foreground rounded-lg text-sm"
                                            >
                                                {feature}
                                                <button onClick={() => removeFeature(i)} className="text-muted-foreground hover:text-destructive">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Save Button */}
                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={cancelEdit}
                                    className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={savePlan}
                                    disabled={loading || !planForm.name}
                                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                    Salvar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Plans List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {plans.map(plan => (
                            <div key={plan.id} className="glass rounded-2xl p-6 border border-border/50 hover:border-primary/30 transition-all">
                                <div className="flex items-start justify-between mb-4">
                                    <div>
                                        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                            {plan.name}
                                            {plan.active ? (
                                                <span className="px-2 py-0.5 bg-success/10 text-success text-xs rounded-full">Ativo</span>
                                            ) : (
                                                <span className="px-2 py-0.5 bg-muted text-muted-foreground text-xs rounded-full">Inativo</span>
                                            )}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                                    </div>
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => startEditPlan(plan)}
                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => deletePlan(plan.id)}
                                            className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="text-3xl font-bold text-foreground mb-4">
                                    R$ {(plan.price_amount / 100).toFixed(2)}
                                    <span className="text-sm font-normal text-muted-foreground">/mês</span>
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm">
                                        <Users className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">{plan.max_users} usuários</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">{plan.max_contacts.toLocaleString()} contatos</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm">
                                        <Layers className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-foreground">{plan.max_pipelines} pipelines</span>
                                    </div>
                                </div>

                                {plan.features && plan.features.length > 0 && (
                                    <div className="pt-4 border-t border-border/50">
                                        <p className="text-xs text-muted-foreground uppercase font-medium mb-2">Features</p>
                                        <div className="flex flex-wrap gap-1">
                                            {plan.features.map((feature, i) => (
                                                <span key={i} className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded">
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {plans.length === 0 && !isCreatingPlan && (
                        <div className="text-center py-12">
                            <Package className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                            <p className="text-muted-foreground">Nenhum plano cadastrado</p>
                            <button
                                onClick={startCreatePlan}
                                className="mt-4 text-primary hover:underline"
                            >
                                Criar primeiro plano
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}
