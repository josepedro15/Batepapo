'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, Download, ExternalLink, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ImageGalleryDialogProps {
    isOpen: boolean
    onClose: () => void
    images: string[]
    initialIndex?: number
}

export function ImageGalleryDialog({ isOpen, onClose, images, initialIndex = 0 }: ImageGalleryDialogProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)

    // Reset index when dialog opens with new images
    useEffect(() => {
        if (isOpen) {
            setCurrentIndex(initialIndex)
        }
    }, [isOpen, initialIndex])

    const goToPrevious = useCallback(() => {
        setCurrentIndex(prev => (prev === 0 ? images.length - 1 : prev - 1))
    }, [images.length])

    const goToNext = useCallback(() => {
        setCurrentIndex(prev => (prev === images.length - 1 ? 0 : prev + 1))
    }, [images.length])

    // Keyboard navigation
    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowLeft') goToPrevious()
            if (e.key === 'ArrowRight') goToNext()
            if (e.key === 'Escape') onClose()
        }

        window.addEventListener('keydown', handleKeyDown)
        return () => window.removeEventListener('keydown', handleKeyDown)
    }, [isOpen, goToPrevious, goToNext, onClose])

    if (!isOpen || images.length === 0) return null

    const currentImage = images[currentIndex]

    return (
        <div
            className="fixed inset-0 bg-black/95 z-[60] flex items-center justify-center animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2.5 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 z-50"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Navigation Arrows */}
            {images.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToPrevious() }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 z-50 hover:scale-110"
                    >
                        <ChevronLeft className="h-8 w-8" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); goToNext() }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all duration-200 z-50 hover:scale-110"
                    >
                        <ChevronRight className="h-8 w-8" />
                    </button>
                </>
            )}

            {/* Main Image */}
            <div
                className="relative max-w-[90vw] max-h-[80vh] flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    key={currentIndex} // Force re-render for animation
                    src={currentImage}
                    alt={`Imagem ${currentIndex + 1}`}
                    className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-sm rounded-xl max-w-[90vw] overflow-x-auto">
                    {images.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx) }}
                            className={cn(
                                "w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 transition-all duration-200 border-2",
                                idx === currentIndex
                                    ? "border-primary ring-2 ring-primary/50 scale-105"
                                    : "border-transparent opacity-60 hover:opacity-100"
                            )}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={img}
                                alt={`Thumbnail ${idx + 1}`}
                                className="w-full h-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            {/* Actions Bar */}
            <div className="absolute top-4 right-16 flex gap-2">
                <a
                    href={currentImage}
                    download
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 text-sm"
                >
                    <Download className="h-4 w-4" />
                </a>
                <a
                    href={currentImage}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-all duration-200 text-sm"
                >
                    <ExternalLink className="h-4 w-4" />
                </a>
            </div>
        </div>
    )
}
