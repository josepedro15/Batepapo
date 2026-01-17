'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { getUnreadMessageCount, updateLastViewedTimestamp } from '@/app/dashboard/chat/notification-actions'
import { createClient } from '@/lib/supabase/client'

// Available notification sound types
export type SoundType = 'default' | 'bell' | 'chime' | 'pop' | 'ding' | 'none'

export const SOUND_OPTIONS: { value: SoundType; label: string; description: string }[] = [
    { value: 'default', label: 'Padrão', description: 'Bip simples' },
    { value: 'bell', label: 'Sino', description: 'Dois tons melodiosos' },
    { value: 'chime', label: 'Campainha', description: 'Três tons ascendentes' },
    { value: 'pop', label: 'Pop', description: 'Tom curto e agudo' },
    { value: 'ding', label: 'Ding', description: 'Tom longo e suave' },
    { value: 'none', label: 'Sem som', description: 'Notificações silenciosas' },
]

interface NotificationContextType {
    unreadCount: number
    soundType: SoundType
    playNotificationSound: () => void
    playSoundPreview: (type: SoundType) => void
    setSoundType: (type: SoundType) => Promise<void>
    refreshUnreadCount: () => Promise<void>
    markAsRead: () => void
    setIsChatVisible: (visible: boolean) => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export function useNotification() {
    const context = useContext(NotificationContext)
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider')
    }
    return context
}

interface NotificationProviderProps {
    children: ReactNode
}

export function NotificationProvider({ children }: NotificationProviderProps) {
    const [unreadCount, setUnreadCount] = useState(0)
    const [soundType, setSoundTypeState] = useState<SoundType>('default')
    const [orgId, setOrgId] = useState<string | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const isChatVisibleRef = useRef(false)

    // Load sound preference on mount
    useEffect(() => {
        const loadSoundPreference = async () => {
            const supabase = createClient()
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) return

            const { data: membership } = await supabase
                .from('organization_members')
                .select('organization_id')
                .eq('user_id', user.id)
                .single()

            if (!membership) return
            setOrgId(membership.organization_id)

            const { data: org } = await supabase
                .from('organizations')
                .select('notification_sound')
                .eq('id', membership.organization_id)
                .single()

            if (org?.notification_sound) {
                setSoundTypeState(org.notification_sound as SoundType)
            }
        }

        loadSoundPreference()
    }, [])

    // Initialize audio context on first user interaction
    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return audioContextRef.current
    }, [])

    // Play a specific sound pattern
    const playSoundPattern = useCallback((type: SoundType) => {
        if (type === 'none') return

        try {
            const audioContext = initAudioContext()
            const now = audioContext.currentTime

            switch (type) {
                case 'default': {
                    // Simple beep - A5 (880Hz)
                    const osc = audioContext.createOscillator()
                    const gain = audioContext.createGain()
                    osc.connect(gain)
                    gain.connect(audioContext.destination)
                    osc.frequency.setValueAtTime(880, now)
                    osc.type = 'sine'
                    gain.gain.setValueAtTime(0, now)
                    gain.gain.linearRampToValueAtTime(0.3, now + 0.01)
                    gain.gain.linearRampToValueAtTime(0, now + 0.15)
                    osc.start(now)
                    osc.stop(now + 0.15)
                    break
                }
                case 'bell': {
                    // Two melodious tones - C5 (523Hz) + E5 (659Hz)
                    const notes = [523, 659]
                    notes.forEach((freq, i) => {
                        const osc = audioContext.createOscillator()
                        const gain = audioContext.createGain()
                        osc.connect(gain)
                        gain.connect(audioContext.destination)
                        osc.frequency.setValueAtTime(freq, now)
                        osc.type = 'sine'
                        const startTime = now + i * 0.12
                        gain.gain.setValueAtTime(0, startTime)
                        gain.gain.linearRampToValueAtTime(0.25, startTime + 0.01)
                        gain.gain.linearRampToValueAtTime(0, startTime + 0.2)
                        osc.start(startTime)
                        osc.stop(startTime + 0.2)
                    })
                    break
                }
                case 'chime': {
                    // Three ascending tones - C5, E5, G5
                    const notes = [523, 659, 784]
                    notes.forEach((freq, i) => {
                        const osc = audioContext.createOscillator()
                        const gain = audioContext.createGain()
                        osc.connect(gain)
                        gain.connect(audioContext.destination)
                        osc.frequency.setValueAtTime(freq, now)
                        osc.type = 'sine'
                        const startTime = now + i * 0.1
                        gain.gain.setValueAtTime(0, startTime)
                        gain.gain.linearRampToValueAtTime(0.2, startTime + 0.01)
                        gain.gain.linearRampToValueAtTime(0, startTime + 0.18)
                        osc.start(startTime)
                        osc.stop(startTime + 0.18)
                    })
                    break
                }
                case 'pop': {
                    // Short high-pitched pop (1000Hz)
                    const osc = audioContext.createOscillator()
                    const gain = audioContext.createGain()
                    osc.connect(gain)
                    gain.connect(audioContext.destination)
                    osc.frequency.setValueAtTime(1000, now)
                    osc.frequency.exponentialRampToValueAtTime(600, now + 0.08)
                    osc.type = 'sine'
                    gain.gain.setValueAtTime(0.4, now)
                    gain.gain.linearRampToValueAtTime(0, now + 0.08)
                    osc.start(now)
                    osc.stop(now + 0.08)
                    break
                }
                case 'ding': {
                    // Long soft tone (660Hz - E5)
                    const osc = audioContext.createOscillator()
                    const gain = audioContext.createGain()
                    osc.connect(gain)
                    gain.connect(audioContext.destination)
                    osc.frequency.setValueAtTime(660, now)
                    osc.type = 'sine'
                    gain.gain.setValueAtTime(0, now)
                    gain.gain.linearRampToValueAtTime(0.25, now + 0.02)
                    gain.gain.linearRampToValueAtTime(0, now + 0.4)
                    osc.start(now)
                    osc.stop(now + 0.4)
                    break
                }
            }
        } catch (err) {
            console.log('Audio play failed:', err)
        }
    }, [initAudioContext])

    // Play the configured notification sound
    const playNotificationSound = useCallback(() => {
        playSoundPattern(soundType)
    }, [playSoundPattern, soundType])

    // Play a specific sound for preview
    const playSoundPreview = useCallback((type: SoundType) => {
        playSoundPattern(type)
    }, [playSoundPattern])

    // Update sound preference in database
    const setSoundType = useCallback(async (type: SoundType) => {
        setSoundTypeState(type)
        if (!orgId) return

        const supabase = createClient()
        await supabase
            .from('organizations')
            .update({ notification_sound: type })
            .eq('id', orgId)
    }, [orgId])

    // Set chat visibility
    const setIsChatVisible = useCallback((visible: boolean) => {
        isChatVisibleRef.current = visible
    }, [])

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadMessageCount()
            setUnreadCount(prev => {
                if (count > prev && prev >= 0 && !isChatVisibleRef.current) {
                    playNotificationSound()
                }
                return count
            })
        } catch (error) {
            console.error('Error fetching unread count:', error)
        }
    }, [playNotificationSound])

    const markAsRead = useCallback(async () => {
        setUnreadCount(0)
        try {
            await updateLastViewedTimestamp()
        } catch (error) {
            console.error('Error updating last viewed timestamp:', error)
        }
    }, [])

    // Poll for unread messages every 10 seconds
    useEffect(() => {
        refreshUnreadCount()
        const interval = setInterval(refreshUnreadCount, 10000)
        return () => clearInterval(interval)
    }, [refreshUnreadCount])

    return (
        <NotificationContext.Provider value={{
            unreadCount,
            soundType,
            playNotificationSound,
            playSoundPreview,
            setSoundType,
            refreshUnreadCount,
            markAsRead,
            setIsChatVisible
        }}>
            {children}
        </NotificationContext.Provider>
    )
}
