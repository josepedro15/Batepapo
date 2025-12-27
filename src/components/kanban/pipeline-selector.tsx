'use client'

import { useRouter, useSearchParams } from 'next/navigation'

export function PipelineSelector({ pipelines, currentPipelineId }: { pipelines: any[], currentPipelineId: string }) {
    const router = useRouter()
    const searchParams = useSearchParams()

    function handleChange(pipelineId: string) {
        const params = new URLSearchParams(searchParams)
        params.set('pipelineId', pipelineId)
        router.push(`?${params.toString()}`)
    }

    if (!pipelines || pipelines.length <= 1) return null

    return (
        <div className="flex items-center gap-2 bg-slate-800 rounded-lg p-1 border border-slate-700">
            {pipelines.map(p => (
                <button
                    key={p.id}
                    onClick={() => handleChange(p.id)}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${currentPipelineId === p.id
                            ? 'bg-violet-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-700'
                        }`}
                >
                    {p.name}
                </button>
            ))}
        </div>
    )
}
