"use client";

import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function resolverDestino(user, next) {
    if (next) {
        if (user.rol === "root" && next.startsWith("/dashboard")) return next;
        if (user.rol === "vendedor" && next.startsWith("/farmacia")) return next;
    }
    return user.rol === "root" ? "/dashboard" : "/farmacia";
}

function LoginContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, loading, login } = useAuth();

    const [usuario, setUsuario] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (loading || !user) return;
        const next = searchParams.get("next");
        router.replace(resolverDestino(user, next));
    }, [user, loading, router, searchParams]);

    async function handleSubmit(e) {
        e.preventDefault();
        setError("");
        setEnviando(true);

        const res = await login(usuario, password);
        setEnviando(false);

        if (!res.ok) {
            setError(res.error);
            return;
        }

        const next = searchParams.get("next");
        router.replace(resolverDestino(res.user, next));
    }

    return (
        <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 to-slate-700 p-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900">Control de Stock</h1>
                    <p className="text-sm text-slate-500 mt-1">Iniciá sesión para continuar</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label htmlFor="usuario" className="block text-sm font-medium text-slate-700 mb-1">
                            Usuario
                        </label>
                        <input
                            id="usuario"
                            type="text"
                            value={usuario}
                            onChange={(e) => setUsuario(e.target.value)}
                            autoComplete="username"
                            autoFocus
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition text-slate-900"
                            placeholder="root"
                        />
                    </div>

                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
                            Contraseña
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none transition text-slate-900"
                            placeholder="••••••••"
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                            {error}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={enviando}
                        className="w-full bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-medium py-2.5 rounded-lg transition"
                    >
                        {enviando ? "Ingresando…" : "Ingresar"}
                    </button>
                </form>

                <p className="text-xs text-slate-400 text-center mt-6">
                    Sistema interno · v0.1
                </p>
            </div>
        </main>
    );
}

export default function LoginPage() {
    return (
        <Suspense
            fallback={
                <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
                    Cargando…
                </div>
            }
        >
            <LoginContent />
        </Suspense>
    );
}