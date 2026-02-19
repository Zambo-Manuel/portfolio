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
import { MoreHorizontal, Plus, Search, Edit, Trash2, Archive, Send, Trophy } from "lucide-react";
import Link from "next/link";

interface Award {
    id: string;
    title: string;
    issuer: string;
    status: ContentStatus;
    awardedAt: Date;
    updatedAt: Date;
}

interface AwardsDataTableProps {
    data: Award[];
}

const statusConfig = {
    DRAFT: { label: "Bozza", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    PUBLISHED: { label: "Pubblicato", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    ARCHIVED: { label: "Archiviato", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

export function AwardsDataTable({ data }: AwardsDataTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [deleteAward, setDeleteAward] = useState<Award | null>(null);

    const filteredAwards = data.filter(
        (award) =>
            award.title.toLowerCase().includes(search.toLowerCase()) ||
            award.issuer.toLowerCase().includes(search.toLowerCase())
    );

    const handleStatusChange = async (award: Award, newStatus: ContentStatus) => {
        try {
            const res = await fetch(`/api/awards/${award.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Errore durante l'aggiornamento");

            toast.success(`Riconoscimento ${newStatus === "PUBLISHED" ? "pubblicato" : newStatus === "ARCHIVED" ? "archiviato" : "salvato come bozza"}`);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
        }
    };

    const handleDelete = async () => {
        if (!deleteAward) return;

        try {
            const res = await fetch(`/api/awards/${deleteAward.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Errore durante l'eliminazione");

            toast.success("Riconoscimento eliminato con successo");
            setDeleteAward(null);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'eliminazione del riconoscimento");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca riconoscimenti..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button asChild>
                    <Link href="/admin/awards/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuovo Riconoscimento
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Riconoscimento</TableHead>
                            <TableHead>Ente</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredAwards.length > 0 ? (
                            filteredAwards.map((award) => (
                                <TableRow key={award.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Trophy className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{award.title}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{award.issuer}</TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[award.status].className}>
                                            {statusConfig[award.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(award.awardedAt), "dd MMM yyyy", { locale: it })}
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
                                                    <Link href={`/awards/${award.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifica
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {award.status !== "PUBLISHED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(award, "PUBLISHED")}>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Pubblica
                                                    </DropdownMenuItem>
                                                )}
                                                {award.status !== "ARCHIVED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(award, "ARCHIVED")}>
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Archivia
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteAward(award)}
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
                                    Nessun riconoscimento trovato.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteAward} onOpenChange={() => setDeleteAward(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Questa azione non può essere annullata. Il riconoscimento "{deleteAward?.title}" sarà eliminato permanentemente.
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
