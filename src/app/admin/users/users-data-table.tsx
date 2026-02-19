"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABELS, ROLE_COLORS } from "@/lib/permissions";
import { UserRole, UserStatus } from "@/lib/validations";
import { MoreHorizontal, Plus, Search, Edit, Key, UserX, UserCheck } from "lucide-react";
import { CreateUserDialog } from "./create-user-dialog";
import { EditUserDialog } from "./edit-user-dialog";
import { ResetPasswordDialog } from "./reset-password-dialog";
import { cn } from "@/lib/utils";

interface User {
    id: string;
    username: string;
    email: string;
    displayName: string;
    role: UserRole;
    status: UserStatus;
    lastLoginAt: Date | null;
    createdAt: Date;
}

interface UsersDataTableProps {
    data: User[];
}

const statusConfig = {
    ACTIVE: { label: "Attivo", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    INACTIVE: { label: "Inattivo", className: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200" },
    SUSPENDED: { label: "Sospeso", className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200" },
};

export function UsersDataTable({ data }: UsersDataTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editUser, setEditUser] = useState<User | null>(null);
    const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);

    const filteredUsers = data.filter(
        (user) =>
            user.username.toLowerCase().includes(search.toLowerCase()) ||
            user.email.toLowerCase().includes(search.toLowerCase()) ||
            user.displayName.toLowerCase().includes(search.toLowerCase())
    );

    const toggleUserStatus = async (user: User) => {
        const newStatus = user.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Errore durante l'aggiornamento");

            toast.success(
                newStatus === "ACTIVE"
                    ? "Utente attivato con successo"
                    : "Utente disattivato con successo"
            );
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca utenti..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button onClick={() => setCreateDialogOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Nuovo Utente
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Utente</TableHead>
                            <TableHead>Ruolo</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Ultimo accesso</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>
                                        <div>
                                            <p className="font-medium">{user.displayName}</p>
                                            <p className="text-sm text-muted-foreground">
                                                @{user.username} · {user.email}
                                            </p>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={cn("font-medium", ROLE_COLORS[user.role])}>
                                            {ROLE_LABELS[user.role]}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[user.status].className}>
                                            {statusConfig[user.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {user.lastLoginAt
                                            ? format(new Date(user.lastLoginAt), "dd MMM yyyy, HH:mm", { locale: it })
                                            : "Mai"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setEditUser(user)}>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Modifica
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setResetPasswordUser(user)}>
                                                    <Key className="mr-2 h-4 w-4" />
                                                    Reset Password
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                                                    {user.status === "ACTIVE" ? (
                                                        <>
                                                            <UserX className="mr-2 h-4 w-4" />
                                                            Disattiva
                                                        </>
                                                    ) : (
                                                        <>
                                                            <UserCheck className="mr-2 h-4 w-4" />
                                                            Attiva
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nessun utente trovato.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <CreateUserDialog
                open={createDialogOpen}
                onOpenChange={setCreateDialogOpen}
            />

            <EditUserDialog
                user={editUser}
                open={!!editUser}
                onOpenChange={(open) => !open && setEditUser(null)}
            />

            <ResetPasswordDialog
                user={resetPasswordUser}
                open={!!resetPasswordUser}
                onOpenChange={(open) => !open && setResetPasswordUser(null)}
            />
        </div>
    );
}
