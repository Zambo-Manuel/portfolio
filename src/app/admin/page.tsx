import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FolderKanban,
  Award,
  Heart,
  Trophy,
  Languages,
  Users,
  Clock,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

async function getDashboardStats() {
  try {
    const [
      projectsCount,
      certificationsCount,
      volunteeringCount,
      awardsCount,
      languagesCount,
      usersCount,
      recentProjects,
      recentCertifications,
    ] = await Promise.all([
      prisma.project.count(),
      prisma.certification.count(),
      prisma.volunteering.count(),
      prisma.award.count(),
      prisma.language.count(),
      prisma.user.count(),
      prisma.project.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
      prisma.certification.findMany({
        take: 5,
        orderBy: { updatedAt: "desc" },
        select: { id: true, title: true, status: true, updatedAt: true },
      }),
    ]);

    return {
      projectsCount,
      certificationsCount,
      volunteeringCount,
      awardsCount,
      languagesCount,
      usersCount,
      recentProjects,
      recentCertifications,
    };
  } catch (error) {
    // If DB tables are missing or another DB error occurs, return empty/default stats
    console.error("Dashboard stats load failed:", error);
    return {
      projectsCount: 0,
      certificationsCount: 0,
      volunteeringCount: 0,
      awardsCount: 0,
      languagesCount: 0,
      usersCount: 0,
      recentProjects: [],
      recentCertifications: [],
    };
  }
}

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getDashboardStats();

  const statCards = [
    {
      title: "Progetti",
      value: stats.projectsCount,
      icon: FolderKanban,
      href: "/admin/projects",
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/30",
    },
    {
      title: "Certificazioni",
      value: stats.certificationsCount,
      icon: Award,
      href: "/admin/certifications",
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/30",
    },
    {
      title: "Volontariato",
      value: stats.volunteeringCount,
      icon: Heart,
      href: "/admin/volunteering",
      color: "text-pink-600",
      bgColor: "bg-pink-100 dark:bg-pink-900/30",
    },
    {
      title: "Riconoscimenti",
      value: stats.awardsCount,
      icon: Trophy,
      href: "/admin/awards",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100 dark:bg-yellow-900/30",
    },
    {
      title: "Lingue",
      value: stats.languagesCount,
      icon: Languages,
      href: "/admin/languages",
      color: "text-purple-600",
      bgColor: "bg-purple-100 dark:bg-purple-900/30",
    },
    {
      title: "Utenti",
      value: stats.usersCount,
      icon: Users,
      href: "/admin/users",
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/30",
    },
  ];

  return (
    <DashboardShell>
      <div className="space-y-6">
        {/* Welcome Section */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Benvenuto, {session?.user?.displayName}!
          </h1>
          <p className="text-muted-foreground mt-1">
            Gestisci i contenuti del tuo portfolio da questa dashboard.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {statCards.map((stat) => (
            <Link key={stat.href} href={stat.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{stat.value}</div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Projects */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Progetti Recenti
              </CardTitle>
              <CardDescription>
                Ultimi progetti modificati
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentProjects.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentProjects.map((project) => (
                    <Link
                      key={project.id}
                      href={`/admin/projects/${project.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <span className="font-medium truncate">{project.title}</span>
                      <Badge
                        variant={
                          project.status === "PUBLISHED"
                            ? "default"
                            : project.status === "DRAFT"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {project.status === "PUBLISHED"
                          ? "Pubblicato"
                          : project.status === "DRAFT"
                            ? "Bozza"
                            : "Archiviato"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessun progetto ancora
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Certifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Certificazioni Recenti
              </CardTitle>
              <CardDescription>
                Ultime certificazioni modificate
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats.recentCertifications.length > 0 ? (
                <div className="space-y-3">
                  {stats.recentCertifications.map((cert) => (
                    <Link
                      key={cert.id}
                      href={`/admin/certifications/${cert.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted transition-colors"
                    >
                      <span className="font-medium truncate">{cert.title}</span>
                      <Badge
                        variant={
                          cert.status === "PUBLISHED"
                            ? "default"
                            : cert.status === "DRAFT"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {cert.status === "PUBLISHED"
                          ? "Pubblicato"
                          : cert.status === "DRAFT"
                            ? "Bozza"
                            : "Archiviato"}
                      </Badge>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna certificazione ancora
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardShell>
  );
}
