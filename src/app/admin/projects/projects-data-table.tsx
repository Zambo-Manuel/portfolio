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
import { MoreHorizontal, Plus, Search, Edit, Trash2, Eye, Star, Archive, Send } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface Project {
    id: string;
    slug: string;
    title: string;
    mainLink: string;
    status: ContentStatus;
    featured: boolean;
    tags: string[];
    updatedAt: Date;
    createdBy: { displayName: string };
}

interface ProjectsDataTableProps {
    data: Project[];
}

const statusConfig = {
    DRAFT: { label: "Bozza", className: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200" },
    PUBLISHED: { label: "Pubblicato", className: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200" },
    ARCHIVED: { label: "Archiviato", className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200" },
};

export function ProjectsDataTable({ data }: ProjectsDataTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState("");
    const [deleteProject, setDeleteProject] = useState<Project | null>(null);

    const filteredProjects = data.filter(
        (project) =>
            project.title.toLowerCase().includes(search.toLowerCase()) ||
            project.slug.toLowerCase().includes(search.toLowerCase()) ||
            project.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()))
    );

    const handleStatusChange = async (project: Project, newStatus: ContentStatus) => {
        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: newStatus }),
            });

            if (!res.ok) throw new Error("Errore durante l'aggiornamento");

            toast.success(`Progetto ${newStatus === "PUBLISHED" ? "pubblicato" : newStatus === "ARCHIVED" ? "archiviato" : "salvato come bozza"}`);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento dello stato");
        }
    };

    const handleDelete = async () => {
        if (!deleteProject) return;

        try {
            const res = await fetch(`/api/projects/${deleteProject.id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Errore durante l'eliminazione");

            toast.success("Progetto eliminato con successo");
            setDeleteProject(null);
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'eliminazione del progetto");
        }
    };

    const toggleFeatured = async (project: Project) => {
        try {
            const res = await fetch(`/api/projects/${project.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ featured: !project.featured }),
            });

            if (!res.ok) throw new Error("Errore");

            toast.success(project.featured ? "Rimosso dai preferiti" : "Aggiunto ai preferiti");
            router.refresh();
        } catch (error) {
            toast.error("Errore durante l'aggiornamento");
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cerca progetti..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9"
                    />
                </div>
                <Button asChild>
                    <Link href="/admin/projects/new">
                        <Plus className="mr-2 h-4 w-4" />
                        Nuovo Progetto
                    </Link>
                </Button>
            </div>

            <div className="rounded-lg border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Progetto</TableHead>
                            <TableHead>Stato</TableHead>
                            <TableHead>Tags</TableHead>
                            <TableHead>Aggiornato</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredProjects.length > 0 ? (
                            filteredProjects.map((project) => (
                                <TableRow key={project.id}>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            {project.featured && (
                                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                            )}
                                            <div>
                                                <p className="font-medium">{project.title}</p>
                                                <p className="text-sm text-muted-foreground">/{project.slug}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge className={statusConfig[project.status].className}>
                                            {statusConfig[project.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-wrap gap-1">
                                            {project.tags.slice(0, 3).map((tag) => (
                                                <Badge key={tag} variant="outline" className="text-xs">
                                                    {tag}
                                                </Badge>
                                            ))}
                                            {project.tags.length > 3 && (
                                                <Badge variant="outline" className="text-xs">
                                                    +{project.tags.length - 3}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground">
                                        {format(new Date(project.updatedAt), "dd MMM yyyy", { locale: it })}
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
                                                    <Link href={`/projects/${project.id}`}>
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Modifica
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <a href={project.mainLink} target="_blank" rel="noopener noreferrer">
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Visualizza
                                                    </a>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => toggleFeatured(project)}>
                                                    <Star className={cn("mr-2 h-4 w-4", project.featured && "fill-current")} />
                                                    {project.featured ? "Rimuovi preferito" : "Aggiungi preferito"}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {project.status !== "PUBLISHED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(project, "PUBLISHED")}>
                                                        <Send className="mr-2 h-4 w-4" />
                                                        Pubblica
                                                    </DropdownMenuItem>
                                                )}
                                                {project.status !== "ARCHIVED" && (
                                                    <DropdownMenuItem onClick={() => handleStatusChange(project, "ARCHIVED")}>
                                                        <Archive className="mr-2 h-4 w-4" />
                                                        Archivia
                                                    </DropdownMenuItem>
                                                )}
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => setDeleteProject(project)}
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
                                    Nessun progetto trovato.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={!!deleteProject} onOpenChange={() => setDeleteProject(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Sei sicuro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Questa azione non può essere annullata. Il progetto "{deleteProject?.title}" sarà eliminato permanentemente.
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
