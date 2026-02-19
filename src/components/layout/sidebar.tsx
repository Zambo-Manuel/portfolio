"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";
import { hasPermission } from "@/lib/permissions";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
    LayoutDashboard,
    Users,
    FolderKanban,
    Award,
    Heart,
    Trophy,
    Languages,
    Settings,
    Bell,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";

interface NavItem {
    title: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    permission?: string;
}

const navItems: NavItem[] = [
    {
        title: "Dashboard",
        href: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "Utenti",
        href: "/admin/users",
        icon: Users,
        permission: "VIEW_USERS",
    },
    {
        title: "Progetti",
        href: "/admin/projects",
        icon: FolderKanban,
    },
    {
        title: "Certificazioni",
        href: "/admin/certifications",
        icon: Award,
    },
    {
        title: "Volontariato",
        href: "/admin/volunteering",
        icon: Heart,
    },
    {
        title: "Riconoscimenti",
        href: "/admin/awards",
        icon: Trophy,
    },
    {
        title: "Lingue",
        href: "/admin/languages",
        icon: Languages,
    },
];

const settingsItems: NavItem[] = [
    {
        title: "Impostazioni",
        href: "/admin/settings",
        icon: Settings,
        permission: "VIEW_SETTINGS",
    },
    {
        title: "Avvisi Globali",
        href: "/admin/settings/notices",
        icon: Bell,
        permission: "MANAGE_NOTICE",
    },
];

interface SidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
    const pathname = usePathname();
    const { data: session } = useSession();
    const userRole = session?.user?.role;

    const isActive = (href: string) => {
        if (href === "/admin") return pathname === "/admin" || pathname === "/admin/";
        return pathname.startsWith(href);
    };

    const filterByPermission = (items: NavItem[]) => {
        return items.filter((item) => {
            if (!item.permission) return true;
            if (!userRole) return false;
            return hasPermission(userRole, item.permission as any);
        });
    };

    const filteredNavItems = filterByPermission(navItems);
    const filteredSettingsItems = filterByPermission(settingsItems);

    return (
        <aside
            className={cn(
                "fixed left-0 top-0 z-40 h-screen border-r bg-card transition-all duration-300",
                collapsed ? "w-16" : "w-64"
            )}
        >
            <div className="flex h-full flex-col">
                {/* Header */}
                <div className="flex h-16 items-center justify-between border-b px-4">
                    {!collapsed && (
                        <Link href="/admin" className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">A</span>
                            </div>
                            <span className="font-semibold text-lg">Admin</span>
                        </Link>
                    )}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onToggle}
                        className={cn("h-8 w-8", collapsed && "mx-auto")}
                    >
                        {collapsed ? (
                            <ChevronRight className="h-4 w-4" />
                        ) : (
                            <ChevronLeft className="h-4 w-4" />
                        )}
                    </Button>
                </div>

                {/* Navigation */}
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-2">
                        {filteredNavItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                    isActive(item.href)
                                        ? "bg-primary text-primary-foreground"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    collapsed && "justify-center px-2"
                                )}
                                title={collapsed ? item.title : undefined}
                            >
                                <item.icon className="h-5 w-5 shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        ))}
                    </nav>

                    {filteredSettingsItems.length > 0 && (
                        <>
                            <Separator className="my-4 mx-2" />
                            <nav className="space-y-1 px-2">
                                {!collapsed && (
                                    <p className="mb-2 px-3 text-xs font-semibold uppercase text-muted-foreground">
                                        Impostazioni
                                    </p>
                                )}
                                {filteredSettingsItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                                            isActive(item.href)
                                                ? "bg-primary text-primary-foreground"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            collapsed && "justify-center px-2"
                                        )}
                                        title={collapsed ? item.title : undefined}
                                    >
                                        <item.icon className="h-5 w-5 shrink-0" />
                                        {!collapsed && <span>{item.title}</span>}
                                    </Link>
                                ))}
                            </nav>
                        </>
                    )}
                </ScrollArea>

                {/* Version */}
                {!collapsed && (
                    <div className="border-t p-4">
                        <p className="text-xs text-muted-foreground text-center">
                            Portfolio Admin v1.0
                        </p>
                    </div>
                )}
            </div>
        </aside>
    );
}
