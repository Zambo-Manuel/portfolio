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
import { MoreHorizontal, Plus, Search, Edit, Trash2, Eye, Archive, Send, Award } from "lucide-react";
import Link from "next/link";

interface Certification {
    id: string;
    title: string;
    issuer: string;
    status: ContentStatus;
    issuedAt: Date;
    updatedAt: Date;
    createdBy: { displayName: string };
}

interface CertificationsDataTableProps {
    data: Certification[];
}

const statusConfig = {
    DRAFT: { label: "Bozza", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    PUBLISHED: { label: "Pubblicato", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    ARCHIVED: { label: "Archiviato", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

export function CertificationsDataTable({ data }: CertificationsDataTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [deleteCert, setDeleteCert] = useState<Certification | null>(null);

    const filteredCertifications = data.filter(
        (cert) =>
            cert.title.toLowerCase().includes(search.toLowerCase()) ||
            cert.issuer.toLowerCase().includes(search.toLowerCase())
    );

    const handleStatusChange = async (cert: Certification, newStatus: ContentStatus) => {
        try {
            const res = await fetch(`/api/certifications/${cert.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Errore durante l'aggiornamento");

            toast.success(`Certificazione ${newStatus === "PUBLISHED" ? "pubblicata" : newStatus === "ARCHIVED" ? "archiviata" : "salvata come bozza"}`);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
        }
    };

    const handleDelete = async () => {
        if (!deleteCert) return;

        try {
            const res = await fetch(`/api/certifications/${deleteCert.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Errore durante l'eliminazione");

            toast.success("Certificazione eliminata con successo");
            setDeleteCert(null);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'eliminazione della certificazione");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca certificazioni..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button asChild>
                    <Link href="/admin/certifications/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuova Certificazione
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Certificazione</TableHead>
                            <TableHead>Ente</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Data Conseguimento</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCertifications.length > 0 ? (
                            filteredCertifications.map((cert) => (
                                <TableRow key={cert.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Award className="h-4 w-4 text-muted-foreground" />
                                            <div>
                                                <p className="font-medium">{cert.title}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>{cert.issuer}</TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[cert.status].className}>
                                            {statusConfig[cert.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(cert.issuedAt), "dd MMM yyyy", { locale: it })}
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
                                                    <Link href={`/certifications/${cert.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifica
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {cert.status !== "PUBLISHED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(cert, "PUBLISHED")}>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Pubblica
                                                    </DropdownMenuItem>
                                                )}
                                                {cert.status !== "ARCHIVED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(cert, "ARCHIVED")}>
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Archivia
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteCert(cert)}
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
                                    Nessuna certificazione trovata.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteCert} onOpenChange={() => setDeleteCert(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Questa azione non può essere annullata. La certificazione "{deleteCert?.title}" sarà eliminata permanentemente.
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
