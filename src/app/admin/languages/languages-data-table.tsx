"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
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
import { MoreHorizontal, Plus, Search, Edit, Trash2, Eye, EyeOff, Languages as LanguagesIcon } from "lucide-react";
import Link from "next/link";

interface Language {
    id: string;
    name: string;
    level: string;
    visible: boolean;
    order: number;
    updatedAt: string | Date;
}

interface LanguagesDataTableProps {
    data: Language[];
}

export function LanguagesDataTable({ data }: LanguagesDataTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [deleteLanguage, setDeleteLanguage] = useState<Language | null>(null);

    const filteredLanguages = data.filter(
        (lang) =>
            lang.name.toLowerCase().includes(search.toLowerCase()) ||
            lang.level.toLowerCase().includes(search.toLowerCase())
    );

    const handleVisibilityToggle = async (lang: Language) => {
        try {
            const res = await fetch(`/api/languages/${lang.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ visible: !lang.visible }),
            });

            if (!res.ok) throw new Error("Errore durante l'aggiornamento");

            toast.success(`Lingua ${!lang.visible ? "resa visibile" : "nascosta"}`);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento della visibilità");
        }
    };

    const handleDelete = async () => {
        if (!deleteLanguage) return;

        try {
            const res = await fetch(`/api/languages/${deleteLanguage.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Errore durante l'eliminazione");

            toast.success("Lingua eliminata con successo");
            setDeleteLanguage(null);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'eliminazione della lingua");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca lingue..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button asChild>
                    <Link href="/admin/languages/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuova Lingua
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lingua</TableHead>
                            <TableHead>Livello</TableHead>
                            <TableHead>Visibilità</TableHead>
                            <TableHead>Ordine</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredLanguages.length > 0 ? (
                            filteredLanguages.map((lang) => (
                                <TableRow key={lang.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <LanguagesIcon className="h-4 w-4 text-muted-foreground" />
                                            <p className="font-medium">{lang.name}</p>
                                        </div>
                                    </TableCell>
                                    <TableCell>{lang.level}</TableCell>
                                    <TableCell>
                                        <Badge className={lang.visible ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                                            {lang.visible ? "Visibile" : "Nascosto"}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{lang.order}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/languages/${lang.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifica
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleVisibilityToggle(lang)}>
                                                    {lang.visible ? (
                                                        <>
                                                            <EyeOff className="mr-2 h-4 w-4" />
                                                            Nascondi
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            Mostra
                                                        </>
                                                    )}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteLanguage(lang)}
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
                                    Nessuna lingua trovata.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteLanguage} onOpenChange={() => setDeleteLanguage(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Questa azione non può essere annullata. La lingua "{deleteLanguage?.name}" sarà eliminata permanentemente.
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
