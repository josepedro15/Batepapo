'use client'

import { useEffect, useState } from 'react'
import { Shield, Search, MoreVertical, Loader2, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

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

export default function AdminPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users')
            if (!res.ok) throw new Error('Failed to fetch users')
            const data = await res.json()
            setUsers(data)
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
                fetchUsers() // Refresh list
            }
        } catch (error) {
            console.error(error)
        }
    }

    const filteredUsers = users.filter(user =>
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                        <Shield className="h-8 w-8 text-amber-500" />
                        Admin Dashboard
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Gerenciamento total do sistema e usuários
                    </p>
                </div>
                <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-lg font-mono text-sm">
                    {users.length} Total Users | {users.filter(u => u.subscription?.status === 'active').length} Active Subs
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar usuários por nome ou email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
            </div>

            {/* Users Table */}
            <div className="glass rounded-2xl overflow-hidden border border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 text-xs uppercase text-muted-foreground font-medium">
                            <tr>
                                <th className="px-6 py-4">Usuário</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Plano</th>
                                <th className="px-6 py-4">Role</th>
                                <th className="px-6 py-4">Cadastro</th>
                                <th className="px-6 py-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {filteredUsers.map((user) => (
                                <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center font-bold text-white">
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
                                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-500/10 text-slate-500">
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
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleAdmin(user.id)}
                                            className="text-xs hover:text-amber-500 transition-colors"
                                            title="Toggle Admin"
                                        >
                                            {user.is_super_admin ? 'Revogar Admin' : 'Tornar Admin'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
