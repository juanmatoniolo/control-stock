"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { ESTADOS, calcularStock, suscribirMovimientos, suscribirProductos } from "@/lib/stock";

export default function FarmaciaPage() {
    const { user } = useAuth();
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);

    useEffect(() => {
        const u1 = suscribirProductos(setProductos);
        const u2 = suscribirMovimientos(setMovimientos);
        return () => {
            u1();
            u2();
        };
    }, []);

    const resumen = useMemo(() => {
        const stock = calcularStock(productos, movimientos).filter((s) => s.activo !== false);
        return {
            total: stock.length,
            bajos: stock.filter((s) => s.estado === "bajo").length,
            sinStock: stock.filter((s) => s.estado === "sin-stock").length,
        };
    }, [productos, movimientos]);

    return (
        <div>
            <header className="mb-6 sm:mb-8">
                <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                    Farmacia
                </h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                    Bienvenido, <strong>{user?.nombre}</strong>
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* REGISTRAR EGRESO */}
                <Link
                    href="/farmacia/egresos"
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:border-red-400 dark:hover:border-red-600 hover:shadow-md transition group"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Acción rápida</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Registrar egreso
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Dar salida a medicación con tu firma
                    </p>
                </Link>

                {/* VER INVENTARIO */}
                <Link
                    href="/farmacia/inventario"
                    className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 hover:border-sky-400 dark:hover:border-sky-600 hover:shadow-md transition group"
                >
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-white shadow-lg">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Consulta</p>
                            <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                                Inventario
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Ver stock disponible y alertas
                    </p>
                </Link>
            </div>

            {/* ALERTAS */}
            {(resumen.bajos > 0 || resumen.sinStock > 0) && (
                <div className="mt-5 space-y-2">
                    {resumen.sinStock > 0 && (
                        <Link
                            href="/farmacia/inventario"
                            className="block bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg p-3 hover:bg-red-100 dark:hover:bg-red-950/60 transition"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-sm text-red-700 dark:text-red-400">
                                    <strong>{resumen.sinStock}</strong> producto{resumen.sinStock === 1 ? "" : "s"} sin stock
                                </p>
                            </div>
                        </Link>
                    )}
                    {resumen.bajos > 0 && (
                        <Link
                            href="/farmacia/inventario"
                            className="block bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3 hover:bg-amber-100 dark:hover:bg-amber-950/60 transition"
                        >
                            <div className="flex items-center gap-2">
                                <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <p className="text-sm text-amber-700 dark:text-amber-400">
                                    <strong>{resumen.bajos}</strong> producto{resumen.bajos === 1 ? "" : "s"} con stock bajo
                                </p>
                            </div>
                        </Link>
                    )}
                </div>
            )}
        </div>
    );
}