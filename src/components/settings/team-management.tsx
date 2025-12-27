'use client'

import { useState } from 'react'
import { Users, Trash2, Plus, UserPlus, X, Pencil, Shield, Crown, UserCheck } from 'lucide-react'
import { createUserAccount, updateUserAccount } from '@/app/dashboard/settings/actions'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

export function TeamManagement({ members }: { members: any[] }) {
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [editingUser, setEditingUser] = useState<any | null>(null)
    const [loading, setLoading] = useState(false)

    async function handleAddMember(formData: FormData) {
        setLoading(true)
        const result = await createUserAccount(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Usuário criado e adicionado com sucesso!')
            setIsInviteOpen(false)
        }
    }

    async function handleUpdateUser(formData: FormData) {
        setLoading(true)
        const result = await updateUserAccount(formData)
        setLoading(false)

        if (result.error) {
            toast.error(result.error)
        } else {
            toast.success('Usuário atualizado com sucesso!')
            setEditingUser(null)
        }
    }

    const getRoleInfo = (role: string) => {
        switch (role) {
            case 'owner':
                return { label: 'Gestor', icon: Crown, color: 'bg-primary/10 text-primary border-primary/20' }
            case 'manager':
                return { label: 'Manager', icon: Shield, color: 'bg-accent/10 text-accent border-accent/20' }
            default:
                return { label: 'Atendente', icon: UserCheck, color: 'bg-muted text-muted-foreground border-border' }
        }
    }

    return (
        <>
            <div className="glass p-6 rounded-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Equipe</h2>
                            <p className="text-sm text-muted-foreground">{members.length} membro{members.length !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsInviteOpen(true)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2.5 rounded-xl font-semibold shadow-lg shadow-primary/20 transition-all flex items-center gap-2 text-sm active:scale-[0.98]"
                    >
                        <UserPlus className="h-4 w-4" /> Novo Usuário
                    </button>
                </div>

                <div className="space-y-2">
                    {members?.map((member) => {
                        const roleInfo = getRoleInfo(member.role)
                        const RoleIcon = roleInfo.icon
                        return (
                            <div key={member.user_id} className="flex items-center justify-between p-4 bg-muted/30 rounded-xl border border-border/50 hover:border-primary/20 transition-all group">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-primary-foreground font-bold">
                                        {member.profiles?.name?.charAt(0) || '?'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">{member.profiles?.name || 'Usuário'}</p>
                                        <p className="text-xs text-muted-foreground">{member.profiles?.email || ''}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <span className={cn(
                                        "px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5",
                                        roleInfo.color
                                    )}>
                                        <RoleIcon className="h-3 w-3" />
                                        {roleInfo.label}
                                    </span>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingUser(member)}
                                            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                            title="Editar usuário"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>

                                        {member.role !== 'owner' && (
                                            <button
                                                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
                                                title="Remover membro"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>

                <div className="mt-4 p-4 bg-primary/5 border border-primary/10 rounded-xl">
                    <p className="text-primary text-sm flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        <span>Como gestor, você pode criar e editar contas da sua equipe.</span>
                    </p>
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="glass p-6 rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <UserPlus className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Criar Novo Usuário</h3>
                            </div>
                            <button onClick={() => setIsInviteOpen(false)} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={handleAddMember} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium text-foreground">Nome Completo</label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="João Silva"
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Email</label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="joao@empresa.com"
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Senha Inicial</label>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Nível de Acesso</label>
                                <select
                                    name="role"
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                >
                                    <option value="attendant">Atendente (Acesso Padrão)</option>
                                    <option value="manager">Manager (Acesso Expandido)</option>
                                    <option value="owner">Gestor (Acesso Total)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteOpen(false)}
                                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {loading ? 'Criando...' : <><Plus className="h-4 w-4" /> Criar Usuário</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                    <div className="glass p-6 rounded-2xl w-full max-w-md animate-in fade-in zoom-in-95 duration-200 shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Pencil className="h-5 w-5 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold text-foreground">Editar Usuário</h3>
                            </div>
                            <button onClick={() => setEditingUser(null)} className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form action={handleUpdateUser} className="space-y-4">
                            <input type="hidden" name="userId" value={editingUser.user_id} />

                            <div>
                                <label className="text-sm font-medium text-foreground">Nome Completo</label>
                                <input
                                    name="name"
                                    type="text"
                                    defaultValue={editingUser.profiles?.name || ''}
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    required
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Email (Não editável)</label>
                                <input
                                    type="email"
                                    defaultValue={editingUser.profiles?.email || ''}
                                    disabled
                                    className="w-full mt-2 bg-muted/30 border border-border rounded-xl p-3.5 text-muted-foreground cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Nova Senha (Opcional)</label>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="Deixe em branco para manter"
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium text-foreground">Nível de Acesso</label>
                                <select
                                    name="role"
                                    defaultValue={editingUser.role}
                                    className="w-full mt-2 bg-muted/50 border border-border rounded-xl p-3.5 text-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                                >
                                    <option value="attendant">Atendente (Acesso Padrão)</option>
                                    <option value="manager">Manager (Acesso Expandido)</option>
                                    <option value="owner">Gestor (Acesso Total)</option>
                                </select>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setEditingUser(null)}
                                    className="flex-1 bg-muted hover:bg-muted/80 text-foreground font-semibold py-3 rounded-xl transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-1 bg-primary hover:bg-primary/90 disabled:opacity-50 text-primary-foreground font-semibold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                                >
                                    {loading ? 'Salvando...' : <><Pencil className="h-4 w-4" /> Salvar</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </>
    )
}
