import { Suspense } from "react";

export default function LoginLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="animate-pulse text-white">Caricamento...</div></div>}>{children}</Suspense>;
}
