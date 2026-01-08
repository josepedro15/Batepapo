'use client'

import { cn } from '@/lib/utils'
import { Images } from 'lucide-react'

interface MessageImageGroupProps {
    images: string[]
    onOpenGallery: (index: number) => void
    isFromUser: boolean
}

export function MessageImageGroup({ images, onOpenGallery, isFromUser }: MessageImageGroupProps) {
    if (images.length === 0) return null

    // Limit to show 4 images in grid, rest hidden
    const maxVisible = 4
    const visibleImages = images.slice(0, maxVisible)
    const remainingCount = images.length - maxVisible

    // Different layouts based on image count
    const getGridLayout = () => {
        switch (visibleImages.length) {
            case 1:
                return 'grid-cols-1'
            case 2:
                return 'grid-cols-2'
            case 3:
                return 'grid-cols-2'
            default:
                return 'grid-cols-2'
        }
    }

    return (
        <div className={cn(
            "grid gap-1 rounded-xl overflow-hidden max-w-[300px]",
            getGridLayout()
        )}>
            {visibleImages.map((imageUrl, idx) => {
                const isLastWithMore = idx === maxVisible - 1 && remainingCount > 0
                const isLargeImage = visibleImages.length === 1
                const isThirdInTriple = visibleImages.length === 3 && idx === 2

                return (
                    <div
                        key={idx}
                        className={cn(
                            "relative cursor-pointer overflow-hidden group",
                            isLargeImage ? "h-[200px]" : "h-[100px]",
                            isThirdInTriple && "col-span-2"
                        )}
                        onClick={() => onOpenGallery(idx)}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={imageUrl}
                            alt={`Imagem ${idx + 1}`}
                            className={cn(
                                "w-full h-full object-cover transition-all duration-200",
                                "group-hover:scale-105 group-hover:brightness-90"
                            )}
                            loading="lazy"
                        />

                        {/* Overlay for "+X more" */}
                        {isLastWithMore && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-[2px] transition-all duration-200 group-hover:bg-black/70">
                                <div className="text-center text-white">
                                    <Images className="h-6 w-6 mx-auto mb-1" />
                                    <span className="text-lg font-bold">+{remainingCount}</span>
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}
