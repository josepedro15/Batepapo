'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react'
import { getUnreadMessageCount, updateLastViewedTimestamp } from '@/app/dashboard/chat/notification-actions'

interface NotificationContextType {
    unreadCount: number
    playNotificationSound: () => void
    refreshUnreadCount: () => Promise<void>
    markAsRead: () => void
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
    const audioContextRef = useRef<AudioContext | null>(null)

    // Initialize audio context on first user interaction
    const initAudioContext = useCallback(() => {
        if (!audioContextRef.current) {
            audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        return audioContextRef.current
    }, [])

    // Play a simple notification beep using Web Audio API
    const playNotificationSound = useCallback(() => {
        try {
            const audioContext = initAudioContext()
            
            // Create oscillator for the beep
            const oscillator = audioContext.createOscillator()
            const gainNode = audioContext.createGain()
            
            oscillator.connect(gainNode)
            gainNode.connect(audioContext.destination)
            
            // Configure sound: pleasant notification beep
            oscillator.frequency.setValueAtTime(880, audioContext.currentTime) // A5 note
            oscillator.type = 'sine'
            
            // Volume envelope: quick fade in and fade out
            gainNode.gain.setValueAtTime(0, audioContext.currentTime)
            gainNode.gain.linearRampToValueAtTime(0.3, audioContext.currentTime + 0.01)
            gainNode.gain.linearRampToValueAtTime(0, audioContext.currentTime + 0.15)
            
            oscillator.start(audioContext.currentTime)
            oscillator.stop(audioContext.currentTime + 0.15)
        } catch (err) {
            console.log('Audio play failed:', err)
        }
    }, [initAudioContext])

    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await getUnreadMessageCount()
            setUnreadCount(prev => {
                // If count increased, play sound
                if (count > prev && prev >= 0) {
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
            playNotificationSound,
            refreshUnreadCount,
            markAsRead
        }}>
            {children}
        </NotificationContext.Provider>
    )
}
