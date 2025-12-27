'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'
import { Sun, Moon, Monitor, Check } from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

export function ThemeToggle() {
    const { theme, setTheme, resolvedTheme } = useTheme()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="h-12 w-full flex items-center justify-center group-hover:justify-start group-hover:px-4">
                <div className="h-6 w-6 rounded-full bg-slate-700 animate-pulse" />
            </div>
        )
    }

    return (
        <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
                <button
                    className={cn(
                        "flex h-12 w-full items-center justify-center rounded-xl",
                        "text-slate-400 hover:bg-white/5 hover:text-white dark:text-slate-400 dark:hover:bg-white/5 dark:hover:text-white",
                        "transition-all duration-200 outline-none",
                        "group-hover:justify-start group-hover:px-4"
                    )}
                    aria-label="Alternar tema"
                >
                    {resolvedTheme === 'dark' ? (
                        <Moon className="h-6 w-6" />
                    ) : (
                        <Sun className="h-6 w-6" />
                    )}
                    <span className="hidden group-hover:block ml-3 font-medium">
                        Tema
                    </span>
                </button>
            </DropdownMenu.Trigger>

            <DropdownMenu.Portal>
                <DropdownMenu.Content
                    align="end"
                    side="right"
                    sideOffset={8}
                    className={cn(
                        "w-44 p-2 rounded-xl",
                        "bg-slate-900 dark:bg-slate-900",
                        "border border-slate-800",
                        "shadow-2xl",
                        "animate-in fade-in-0 zoom-in-95",
                        "z-[100]"
                    )}
                >
                    <DropdownMenu.Item
                        onSelect={() => setTheme('light')}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                            "text-sm font-medium cursor-pointer outline-none",
                            "transition-colors duration-150",
                            theme === 'light'
                                ? "bg-violet-600/20 text-violet-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Sun className="h-4 w-4" />
                        <span>Claro</span>
                        {theme === 'light' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={() => setTheme('dark')}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                            "text-sm font-medium cursor-pointer outline-none",
                            "transition-colors duration-150",
                            theme === 'dark'
                                ? "bg-violet-600/20 text-violet-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Moon className="h-4 w-4" />
                        <span>Escuro</span>
                        {theme === 'dark' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenu.Item>

                    <DropdownMenu.Item
                        onSelect={() => setTheme('system')}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-lg",
                            "text-sm font-medium cursor-pointer outline-none",
                            "transition-colors duration-150",
                            theme === 'system'
                                ? "bg-violet-600/20 text-violet-400"
                                : "text-slate-300 hover:bg-slate-800 hover:text-white"
                        )}
                    >
                        <Monitor className="h-4 w-4" />
                        <span>Sistema</span>
                        {theme === 'system' && <Check className="ml-auto h-4 w-4" />}
                    </DropdownMenu.Item>
                </DropdownMenu.Content>
            </DropdownMenu.Portal>
        </DropdownMenu.Root>
    )
}
