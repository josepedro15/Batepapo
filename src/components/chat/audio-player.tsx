'use client'

import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
    src: string
    isFromUser?: boolean
}

export function AudioPlayer({ src, isFromUser = false }: AudioPlayerProps) {
    const audioRef = useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [currentTime, setCurrentTime] = useState(0)
    const [duration, setDuration] = useState(0)
    const [isMuted, setIsMuted] = useState(false)

    useEffect(() => {
        const audio = audioRef.current
        if (!audio) return

        const handleLoadedMetadata = () => {
            setDuration(audio.duration)
        }

        const handleTimeUpdate = () => {
            setCurrentTime(audio.currentTime)
        }

        const handleEnded = () => {
            setIsPlaying(false)
            setCurrentTime(0)
        }

        audio.addEventListener('loadedmetadata', handleLoadedMetadata)
        audio.addEventListener('timeupdate', handleTimeUpdate)
        audio.addEventListener('ended', handleEnded)

        return () => {
            audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
            audio.removeEventListener('timeupdate', handleTimeUpdate)
            audio.removeEventListener('ended', handleEnded)
        }
    }, [])

    const togglePlay = () => {
        const audio = audioRef.current
        if (!audio) return

        if (isPlaying) {
            audio.pause()
        } else {
            audio.play()
        }
        setIsPlaying(!isPlaying)
    }

    const toggleMute = () => {
        const audio = audioRef.current
        if (!audio) return

        audio.muted = !isMuted
        setIsMuted(!isMuted)
    }

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current
        if (!audio) return

        const newTime = parseFloat(e.target.value)
        audio.currentTime = newTime
        setCurrentTime(newTime)
    }

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00'
        const minutes = Math.floor(time / 60)
        const seconds = Math.floor(time % 60)
        return `${minutes}:${seconds.toString().padStart(2, '0')}`
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0

    return (
        <div className={cn(
            "flex items-center gap-3 min-w-[220px] max-w-[280px] p-1",
            isFromUser ? "text-primary-foreground" : "text-foreground"
        )}>
            <audio ref={audioRef} src={src} preload="metadata" />

            {/* Play/Pause Button */}
            <button
                onClick={togglePlay}
                className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
                    isFromUser 
                        ? "bg-primary-foreground/20 hover:bg-primary-foreground/30" 
                        : "bg-primary/10 hover:bg-primary/20"
                )}
            >
                {isPlaying ? (
                    <Pause className={cn("h-4 w-4", isFromUser ? "text-primary-foreground" : "text-primary")} />
                ) : (
                    <Play className={cn("h-4 w-4 ml-0.5", isFromUser ? "text-primary-foreground" : "text-primary")} />
                )}
            </button>

            {/* Progress Section */}
            <div className="flex-1 flex flex-col gap-1.5">
                {/* Progress Bar */}
                <div className="relative h-1.5 rounded-full overflow-hidden bg-current/20">
                    <div 
                        className={cn(
                            "absolute left-0 top-0 h-full rounded-full transition-all duration-100",
                            isFromUser ? "bg-primary-foreground" : "bg-primary"
                        )}
                        style={{ width: `${progress}%` }}
                    />
                    <input
                        type="range"
                        min="0"
                        max={duration || 0}
                        step="0.1"
                        value={currentTime}
                        onChange={handleSeek}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                </div>

                {/* Time Display */}
                <div className="flex items-center justify-between text-[10px] font-mono opacity-70">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Mute Button */}
            <button
                onClick={toggleMute}
                className={cn(
                    "h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200",
                    isFromUser 
                        ? "hover:bg-primary-foreground/20" 
                        : "hover:bg-muted"
                )}
            >
                {isMuted ? (
                    <VolumeX className="h-3.5 w-3.5 opacity-60" />
                ) : (
                    <Volume2 className="h-3.5 w-3.5 opacity-60" />
                )}
            </button>
        </div>
    )
}
