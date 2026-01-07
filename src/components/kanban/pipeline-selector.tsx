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
        <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 border border-border/50">
            {pipelines.map(p => (
                <button
                    key={p.id}
                    onClick={() => handleChange(p.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${currentPipelineId === p.id
                            ? 'bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/20'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                        }`}
                >
                    {p.name}
                </button>
            ))}
        </div>
    )
}
