"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children, roles }) {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading) return;

        // Sin sesión → al login
        if (!user) {
            router.replace(`/login?next=${encodeURIComponent(pathname)}`);
            return;
        }

        // Rol no permitido → a su home según rol
        if (roles && !roles.includes(user.rol)) {
            if (user.rol === "root") router.replace("/dashboard");
            else if (user.rol === "vendedor") router.replace("/farmacia");
            else router.replace("/login");
        }
    }, [user, loading, roles, router, pathname]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-100">
                <div className="text-slate-500">Cargando…</div>
            </div>
        );
    }

    if (!user) return null;
    if (roles && !roles.includes(user.rol)) return null;

    return children;
}