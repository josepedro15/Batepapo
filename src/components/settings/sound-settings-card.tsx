'use client'

import { useState } from 'react'
import { HiSpeakerWave, HiSpeakerXMark, HiPlay } from 'react-icons/hi2'
import { useNotification, SOUND_OPTIONS, SoundType } from '@/components/providers/notification-provider'

export function SoundSettingsCard() {
    const { soundType, setSoundType, playSoundPreview } = useNotification()
    const [isUpdating, setIsUpdating] = useState(false)

    const handleSoundChange = async (type: SoundType) => {
        setIsUpdating(true)
        await setSoundType(type)
        setIsUpdating(false)
    }

    return (
        <div className="glass p-6 rounded-2xl">
            <div className="flex items-center gap-3 mb-6">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center border border-primary/20">
                    <HiSpeakerWave className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Som de Notificação</h3>
                    <p className="text-sm text-muted-foreground">Escolha o som para novas mensagens</p>
                </div>
            </div>

            <div className="space-y-2">
                {SOUND_OPTIONS.map((option) => (
                    <div
                        key={option.value}
                        className={`
                            flex items-center justify-between p-4 rounded-xl border transition-all duration-300 cursor-pointer group
                            ${soundType === option.value
                                ? 'bg-primary/10 border-primary/30'
                                : 'bg-muted/30 border-border/50 hover:border-primary/30 hover:bg-primary/5'
                            }
                            ${isUpdating ? 'opacity-50 pointer-events-none' : ''}
                        `}
                        onClick={() => handleSoundChange(option.value)}
                    >
                        <div className="flex items-center gap-4">
                            <div className={`
                                h-10 w-10 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-105
                                ${soundType === option.value
                                    ? 'bg-primary/20 border-primary/30'
                                    : 'bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20'
                                }
                            `}>
                                {option.value === 'none' ? (
                                    <HiSpeakerXMark className="h-5 w-5 text-primary" />
                                ) : (
                                    <HiSpeakerWave className="h-5 w-5 text-primary" />
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-foreground">{option.label}</p>
                                <p className="text-xs text-muted-foreground">{option.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {/* Preview Button */}
                            {option.value !== 'none' && (
                                <button
                                    type="button"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        playSoundPreview(option.value)
                                    }}
                                    className="h-8 w-8 rounded-full bg-background/80 border border-border/50 flex items-center justify-center hover:bg-primary/10 hover:border-primary/30 transition-all"
                                    title="Ouvir preview"
                                >
                                    <HiPlay className="h-4 w-4 text-muted-foreground" />
                                </button>
                            )}

                            {/* Radio indicator */}
                            <div className={`
                                h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all
                                ${soundType === option.value
                                    ? 'border-primary bg-primary'
                                    : 'border-muted-foreground/30'
                                }
                            `}>
                                {soundType === option.value && (
                                    <div className="h-2 w-2 rounded-full bg-white" />
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}
