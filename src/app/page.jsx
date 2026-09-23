"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace("/login");
    else if (user.rol === "root") router.replace("/dashboard");
    else router.replace("/farmacia");
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="text-slate-500">Cargando…</div>
    </div>
  );
}