import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Bell, Shield, Database } from "lucide-react";

export default async function SettingsPage() {
    await auth();

    const settingsCards = [
        {
            title: "Avviso Globale",
            description: "Configura un avviso visibile a tutti i visitatori del portfolio.",
            href: "/settings/notices",
            icon: Bell,
        },
    ];

    return (
        <DashboardShell>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Impostazioni</h1>
                    <p className="text-muted-foreground mt-1">
                        Configura le impostazioni della dashboard.
                    </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {settingsCards.map((card) => (
                        <Link key={card.href} href={card.href}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                                <CardHeader>
                                    <div className="p-2 w-fit rounded-lg bg-primary/10 mb-2">
                                        <card.icon className="h-5 w-5 text-primary" />
                                    </div>
                                    <CardTitle className="text-lg">{card.title}</CardTitle>
                                    <CardDescription>{card.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </DashboardShell>
    );
}
