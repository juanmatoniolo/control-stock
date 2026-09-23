"use client";

import { useAuth } from "@/hooks/useAuth";

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div>
            <header className="mb-6 sm:mb-8">
                <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">Inicio</h1>
                <p className="text-sm sm:text-base text-slate-500 dark:text-slate-400 mt-1">
                    Bienvenido, <strong>{user?.nombre}</strong>
                </p>
            </header>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Módulo</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        Stock
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Próximamente</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Módulo</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        Combustible
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Próximamente</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">Módulo</p>
                    <p className="text-base sm:text-lg font-semibold text-slate-900 dark:text-slate-100 mt-1">
                        Proveedores
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">Próximamente</p>
                </div>
            </div>
        </div>
    );
}