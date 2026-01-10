'use client'

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
    LayoutDashboard,
    MessageSquare,
    Megaphone,
    Settings,
    Users,
    LogOut,
    Shield
} from "lucide-react"
import { cn } from "@/lib/utils"
import { OrgSwitcher } from "./org-switcher"
import { logout } from "@/app/dashboard/logout-action"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useNotification } from "@/components/providers/notification-provider"

const navigation = [
    { name: "Kanban", href: "/dashboard/kanban", icon: LayoutDashboard },
    { name: "Chat", href: "/dashboard/chat", icon: MessageSquare },
    { name: "Campanhas", href: "/dashboard/campaigns", icon: Megaphone },
    { name: "Contatos", href: "/dashboard/contacts", icon: Users },
    { name: "Configurações", href: "/dashboard/settings", icon: Settings },
]

export function SidebarClient({
    organizations,
    currentOrgId,
    isSuperAdmin
}: {
    organizations: any[],
    currentOrgId: string,
    isSuperAdmin: boolean
}) {
    const pathname = usePathname()
    const { unreadCount } = useNotification()

    return (
        <div className={cn(
            "flex h-screen w-20 flex-col items-center py-4",
            "border-r border-border/50",
            "bg-card/50 backdrop-blur-xl",
            "transition-all duration-300 hover:w-64",
            "group z-50 fixed left-0 top-0"
        )}>
            {/* Org Switcher */}
            <div className="w-full px-2 mb-4">
                <OrgSwitcher organizations={organizations} currentOrgId={currentOrgId} />
            </div>

            {/* Navigation */}
            <nav className="flex-1 w-full px-2 space-y-2">
                {navigation.map((item) => {
                    const isActive = pathname?.startsWith(item.href)
                    const isChat = item.name === 'Chat'
                    return (
                        <Link
                            key={item.name}
                            href={item.href}
                            className={cn(
                                "flex h-12 w-full items-center justify-center rounded-xl relative",
                                "transition-all duration-200",
                                "group-hover:justify-start group-hover:px-4",
                                isActive
                                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                                    : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                            )}
                        >
                            <div className="relative">
                                <item.icon className="h-6 w-6 shrink-0" />
                                {isChat && !isActive && unreadCount > 0 && (
                                    <span className="absolute -top-2 -right-2 h-5 min-w-5 px-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold flex items-center justify-center animate-pulse">
                                        {unreadCount > 99 ? '99+' : unreadCount}
                                    </span>
                                )}
                            </div>
                            <span className="hidden group-hover:block ml-3 font-medium">
                                {item.name}
                            </span>
                        </Link>
                    )
                })}

                {isSuperAdmin && (
                    <Link
                        href="/dashboard/admin"
                        className={cn(
                            "flex h-12 w-full items-center justify-center rounded-xl",
                            "transition-all duration-200",
                            "text-amber-500 hover:bg-amber-500/10",
                            "group-hover:justify-start group-hover:px-4",
                            pathname?.startsWith('/dashboard/admin') && "bg-amber-500/10"
                        )}
                    >
                        <Shield className="h-6 w-6 shrink-0" />
                        <span className="hidden group-hover:block ml-3 font-medium">
                            Admin
                        </span>
                    </Link>
                )}
            </nav>

            {/* Theme Toggle & Logout */}
            <div className="mt-auto w-full px-2 space-y-2">
                <ThemeToggle />
                <button
                    onClick={() => logout()}
                    className={cn(
                        "flex h-12 w-full items-center justify-center rounded-xl",
                        "text-muted-foreground hover:bg-destructive/10 hover:text-destructive",
                        "transition-colors duration-200",
                        "group-hover:justify-start group-hover:px-4"
                    )}
                >
                    <LogOut className="h-6 w-6 shrink-0" />
                    <span className="hidden group-hover:block ml-3 font-medium">
                        Sair
                    </span>
                </button>
            </div>
        </div>
    )
}

