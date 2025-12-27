import { Loader2 } from 'lucide-react'

export default function Loading() {
    return (
        <div className="flex min-h-[400px] flex-col items-center justify-center gap-4">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
        </div>
    )
}
