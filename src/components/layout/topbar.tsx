"use client";

import { signOut, useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import {
    Moon,
    Sun,
    User,
    LogOut,
    Settings,
    Bell,
    Menu,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface TopbarProps {
    onMenuToggle?: () => void;
    sidebarCollapsed?: boolean;
}

export function Topbar({ onMenuToggle, sidebarCollapsed }: TopbarProps) {
    const { data: session } = useSession();
    const { theme, setTheme } = useTheme();

    const user = session?.user;
    const initials = user?.displayName
        ?.split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2) || "??";

    return (
        <header
            className={cn(
                "fixed top-0 right-0 z-30 h-16 border-b bg-card/80 backdrop-blur-sm transition-all duration-300",
                sidebarCollapsed ? "left-16" : "left-64"
            )}
        >
            <div className="flex h-full items-center justify-between px-4 md:px-6">
                {/* Left side */}
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={onMenuToggle}
                    >
                        <Menu className="h-5 w-5" />
                    </Button>

                    <h1 className="text-lg font-semibold hidden sm:block">
                        Portfolio Admin
                    </h1>
                </div>

                {/* Right side */}
                <div className="flex items-center gap-2">
                    {/* Notifications */}
                    <Button variant="ghost" size="icon" className="relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500" />
                    </Button>

                    {/* Theme toggle */}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                    >
                        <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                        <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                        <span className="sr-only">Cambia tema</span>
                    </Button>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="relative h-10 gap-2 pl-2 pr-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="hidden md:flex md:flex-col md:items-start">
                                    <span className="text-sm font-medium">{user?.displayName}</span>
                                    <span className="text-xs text-muted-foreground">
                                        @{user?.username}
                                    </span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col gap-1">
                                    <p className="font-medium">{user?.displayName}</p>
                                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                                    {user?.role && (
                                        <Badge
                                            variant="secondary"
                                            className={cn("w-fit mt-1", ROLE_COLORS[user.role])}
                                        >
                                            {ROLE_LABELS[user.role]}
                                        </Badge>
                                    )}
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem asChild>
                                <Link href="/admin/profile" className="flex items-center">
                                    <User className="mr-2 h-4 w-4" />
                                    Profilo
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <Link href="/admin/settings" className="flex items-center">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Impostazioni
                                </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={() => signOut({ callbackUrl: "/login" })}
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Esci
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    );
}
