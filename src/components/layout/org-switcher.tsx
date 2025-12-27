'use client'

import { useState } from 'react'
import { ChevronDown, Building2, Check } from 'lucide-react'

export function OrgSwitcher({ organizations, currentOrgId }: { organizations: any[], currentOrgId: string }) {
    const [open, setOpen] = useState(false)

    const currentOrg = organizations?.find(o => o.organization_id === currentOrgId)

    function switchOrg(orgId: string) {
        // Store in localStorage and reload page to refetch data
        localStorage.setItem('current_org_id', orgId)
        window.location.reload()
    }

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-white/5 transition-colors mb-4 text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-violet-600 rounded-xl flex items-center justify-center shrink-0">
                        <Building2 className="h-6 w-6 text-white" />
                    </div>
                    <div className="min-w-0 hidden group-hover:block">
                        <p className="text-sm font-bold text-white truncate">
                            {currentOrg?.organizations?.name || 'Organização'}
                        </p>
                        <p className="text-xs text-slate-500">
                            {organizations?.length || 0} espaço{organizations?.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 hidden group-hover:block transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <>
                    {/* Backdrop */}
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />

                    {/* Dropdown */}
                    <div className="absolute left-0 top-full mt-2 w-64 glass rounded-xl border border-white/5 shadow-2xl z-50 p-2">
                        <div className="text-xs font-bold text-slate-500 px-3 py-2">
                            MEUS ESPAÇOS
                        </div>
                        {organizations?.map((org) => (
                            <button
                                key={org.organization_id}
                                onClick={() => switchOrg(org.organization_id)}
                                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors text-left"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${org.organization_id === currentOrgId ? 'bg-violet-600' : 'bg-slate-700'
                                        }`}>
                                        <Building2 className="h-4 w-4 text-white" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-white">{org.organizations?.name}</p>
                                        <p className="text-xs text-slate-500 capitalize">{org.role}</p>
                                    </div>
                                </div>
                                {org.organization_id === currentOrgId && (
                                    <Check className="h-4 w-4 text-violet-400" />
                                )}
                            </button>
                        ))}
                    </div>
                </>
            )}
        </div>
    )
}
