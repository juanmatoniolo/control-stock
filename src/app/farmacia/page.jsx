"use client";

import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";

export default function FarmaciaPage() {
    const { user } = useAuth();

    return (
        <div>
            <header className="mb-8">
                <h1 className="text-2xl font-bold text-slate-900 mt-3">Farmacia</h1>
                <p className="text-slate-500 mt-1">
                    Bienvenido, <strong>{user?.nombre}</strong>
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link
                    href="/farmacia/egresos"
                    className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:border-sky-400 hover:shadow-md transition"
                >
                    <p className="text-sm text-slate-500">Acción rápida</p>
                    <p className="text-lg font-semibold text-slate-900 mt-1">
                        Registrar egreso
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                        Dar salida a medicación
                    </p>
                </Link>
            </div>
        </div>
    );
}