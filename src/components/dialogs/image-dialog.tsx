'use client'

import { X, Download, ExternalLink } from 'lucide-react'

interface ImageDialogProps {
    isOpen: boolean
    onClose: () => void
    imageUrl: string
    altText?: string
}

export function ImageDialog({ isOpen, onClose, imageUrl, altText = 'Imagem' }: ImageDialogProps) {
    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 bg-black/90 z-[60] flex items-center justify-center p-4 animate-in fade-in duration-200"
            onClick={onClose}
        >
            {/* Close Button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors z-50"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Image Container */}
            <div
                className="relative max-w-[90vw] max-h-[90vh]"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking image
            >
                {/* Actions Bar */}
                <div className="absolute -bottom-12 left-0 right-0 flex justify-center gap-4">
                    <a
                        href={imageUrl}
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors text-sm"
                    >
                        <Download className="h-4 w-4" />
                        Baixar
                    </a>
                    <a
                        href={imageUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-full hover:bg-slate-700 transition-colors text-sm"
                    >
                        <ExternalLink className="h-4 w-4" />
                        Abrir Original
                    </a>
                </div>

                {/* Main Image */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={imageUrl}
                    alt={altText}
                    className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl"
                />
            </div>
        </div>
    )
}
