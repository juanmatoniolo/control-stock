"use client";

import { useEffect, useMemo, useState } from "react";
import { ESTADOS, calcularStock, suscribirMovimientos, suscribirProductos } from "@/lib/stock";

function StatCard({ label, value, sub, accent = "sky" }) {
    const accents = {
        sky: "from-sky-500 to-sky-700",
        emerald: "from-emerald-500 to-emerald-700",
        amber: "from-amber-500 to-amber-700",
        red: "from-red-500 to-red-700",
        violet: "from-violet-500 to-violet-700",
    };
    return (
        <div className={`rounded-xl p-4 bg-gradient-to-br ${accents[accent]} text-white shadow-lg`}>
            <p className="text-xs uppercase tracking-wider opacity-80 font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function InventarioPage() {
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | normal | bajo | sin-stock

    useEffect(() => {
        const u1 = suscribirProductos(setProductos);
        const u2 = suscribirMovimientos((arr) => {
            setMovimientos(arr);
            setLoading(false);
        });
        return () => {
            u1();
            u2();
        };
    }, []);

    const stock = useMemo(() => calcularStock(productos, movimientos), [productos, movimientos]);

    const filtrados = useMemo(() => {
        let arr = stock.filter((s) => s.activo !== false);

        if (filtroEstado !== "todos") {
            arr = arr.filter((s) => s.estado === filtroEstado);
        }

        const q = busqueda.trim().toLowerCase();
        if (q) {
            arr = arr.filter((s) =>
                [s.codigo, s.producto]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q))
            );
        }
        return arr;
    }, [stock, busqueda, filtroEstado]);

    const resumen = useMemo(() => {
        const activos = stock.filter((s) => s.activo !== false);
        return {
            total: activos.length,
            normales: activos.filter((s) => s.estado === "normal").length,
            bajos: activos.filter((s) => s.estado === "bajo").length,
            sinStock: activos.filter((s) => s.estado === "sin-stock").length,
        };
    }, [stock]);

    return (
        <div>
            {/* HEADER */}
            <header className="mb-6">
                <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                    Inventario
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                    Consultá la disponibilidad de productos
                </p>
            </header>

            {/* RESUMEN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatCard label="Productos" value={resumen.total} sub="En catálogo activo" accent="sky" />
                <StatCard label="Normal" value={resumen.normales} sub="Con stock suficiente" accent="emerald" />
                <StatCard label="Stock bajo" value={resumen.bajos} sub="Requieren reposición" accent="amber" />
                <StatCard label="Sin stock" value={resumen.sinStock} sub="No disponibles" accent="red" />
            </div>

            {/* FILTROS */}
            <div className="mb-4 flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                    <svg
                        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por código o producto..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                </div>
                <select
                    value={filtroEstado}
                    onChange={(e) => setFiltroEstado(e.target.value)}
                    className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:w-56"
                >
                    <option value="todos">Todos los estados ({resumen.total})</option>
                    <option value="normal">Solo normal ({resumen.normales})</option>
                    <option value="bajo">Solo stock bajo ({resumen.bajos})</option>
                    <option value="sin-stock">Solo sin stock ({resumen.sinStock})</option>
                </select>
            </div>

            {/* LISTADO */}
            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Cargando...
                </div>
            ) : filtrados.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                        {resumen.total === 0
                            ? "Todavía no hay productos cargados."
                            : "Sin resultados para tu búsqueda."}
                    </p>
                </div>
            ) : (
                <>
                    {/* DESKTOP */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Código</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Producto</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Disponible</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Mínimo</th>
                                        <th className="text-center px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-40">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map((p) => (
                                        <tr
                                            key={p.codigo}
                                            className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                        >
                                            <td className="px-3 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">
                                                {p.codigo}
                                            </td>
                                            <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[320px]">
                                                {p.producto}
                                            </td>
                                            <td
                                                className={`px-3 py-3 text-right font-bold tabular-nums text-base ${p.stockActual <= 0
                                                    ? "text-red-600 dark:text-red-400"
                                                    : p.stockActual <= (p.stockMinimo || 0)
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-emerald-600 dark:text-emerald-400"
                                                    }`}
                                            >
                                                {p.stockActual}
                                            </td>
                                            <td className="px-3 py-3 text-right text-slate-500 dark:text-slate-400 tabular-nums text-xs">
                                                {p.stockMinimo || 0}
                                            </td>
                                            <td className="px-3 py-3 text-center">
                                                <span
                                                    className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ESTADOS[p.estado].color}`}
                                                >
                                                    {p.estadoLabel}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MOBILE */}
                    <div className="md:hidden space-y-2">
                        {filtrados.map((p) => (
                            <div
                                key={p.codigo}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5"
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                            {p.codigo}
                                        </span>
                                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-1.5 text-sm leading-tight">
                                            {p.producto}
                                        </h3>
                                        <span
                                            className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mt-1.5 ${ESTADOS[p.estado].color}`}
                                        >
                                            {p.estadoLabel}
                                        </span>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p
                                            className={`text-3xl font-bold tabular-nums leading-none ${p.stockActual <= 0
                                                ? "text-red-600 dark:text-red-400"
                                                : p.stockActual <= (p.stockMinimo || 0)
                                                    ? "text-amber-600 dark:text-amber-400"
                                                    : "text-emerald-600 dark:text-emerald-400"
                                                }`}
                                        >
                                            {p.stockActual}
                                        </p>
                                        <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500 mt-1">
                                            mínimo {p.stockMinimo || 0}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}