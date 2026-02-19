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
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ContentStatus } from "@/lib/validations";
import { MoreHorizontal, Plus, Search, Edit, Trash2, Archive, Send, Heart } from "lucide-react";
import Link from "next/link";

interface Volunteering {
    id: string;
    organization: string;
    role: string;
    status: ContentStatus;
    startDate: Date;
    endDate: Date | null;
    isCurrent: boolean;
    updatedAt: Date;
}

interface VolunteeringDataTableProps {
    data: Volunteering[];
}

const statusConfig = {
    DRAFT: { label: "Bozza", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    PUBLISHED: { label: "Pubblicato", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    ARCHIVED: { label: "Archiviato", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

export function VolunteeringDataTable({ data }: VolunteeringDataTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [deleteEntry, setDeleteEntry] = useState<Volunteering | null>(null);

    const filteredEntries = data.filter(
        (entry) =>
            entry.organization.toLowerCase().includes(search.toLowerCase()) ||
            entry.role.toLowerCase().includes(search.toLowerCase())
    );

    const handleStatusChange = async (entry: Volunteering, newStatus: ContentStatus) => {
        try {
            const res = await fetch(`/api/volunteering/${entry.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Errore durante l'aggiornamento");

            toast.success(`Esperienza ${newStatus === "PUBLISHED" ? "pubblicata" : newStatus === "ARCHIVED" ? "archiviata" : "salvata come bozza"}`);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
        }
    };

    const handleDelete = async () => {
        if (!deleteEntry) return;

        try {
            const res = await fetch(`/api/volunteering/${deleteEntry.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Errore durante l'eliminazione");

            toast.success("Esperienza eliminata con successo");
            setDeleteEntry(null);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'eliminazione dell'esperienza");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca volontariato..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button asChild>
                    <Link href="/admin/volunteering/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuova Esperienza
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organizzazione</TableHead>
                            <TableHead>Ruolo</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Periodo</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredEntries.length > 0 ? (
                            filteredEntries.map((entry) => (
                                <TableRow key={entry.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Heart className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{entry.organization}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{entry.role}</TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[entry.status].className}>
                                            {statusConfig[entry.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(entry.startDate), "MMM yyyy", { locale: it })}
                                        {" - "}
                                        {entry.isCurrent ? "In corso" : entry.endDate ? format(new Date(entry.endDate), "MMM yyyy", { locale: it }) : "?"}
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/volunteering/${entry.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifica
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {entry.status !== "PUBLISHED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(entry, "PUBLISHED")}>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Pubblica
                                                    </DropdownMenuItem>
                                                )}
                                                {entry.status !== "ARCHIVED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(entry, "ARCHIVED")}>
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Archivia
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteEntry(entry)}
                                                >
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Elimina
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    Nessuna esperienza di volontariato trovata.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteEntry} onOpenChange={() => setDeleteEntry(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Questa azione non può essere annullata. L'esperienza presso "{deleteEntry?.organization}" sarà eliminata permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Annulla</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
                            Elimina
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
