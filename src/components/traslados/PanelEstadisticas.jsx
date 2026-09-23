"use client";

import { useState } from "react";
import { calcularStats, formatDuracion, kmRecorridos, duracionMinutos } from "@/lib/traslados";
import { mostrarFecha } from "@/lib/combustible";

function Stat({ label, value, sub, accent = "sky" }) {
    const accents = {
        sky: "from-sky-500 to-sky-700",
        emerald: "from-emerald-500 to-emerald-700",
        amber: "from-amber-500 to-amber-700",
        violet: "from-violet-500 to-violet-700",
        rose: "from-rose-500 to-rose-700",
    };
    return (
        <div className={`rounded-xl p-4 bg-gradient-to-br ${accents[accent]} text-white shadow-lg`}>
            <p className="text-xs uppercase tracking-wider opacity-80 font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums leading-tight">{value}</p>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

function Barra({ valor, max, color = "sky" }) {
    const pct = max > 0 ? (valor / max) * 100 : 0;
    const colors = {
        sky: "bg-sky-500",
        emerald: "bg-emerald-500",
        violet: "bg-violet-500",
    };
    return (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${colors[color]}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

/* ============================================
   COMPARADOR A/B
   ============================================ */
function Comparador({ traslados }) {
    const choferesDisponibles = Array.from(
        new Set(traslados.map((t) => t.choferNombre).filter(Boolean))
    ).sort();

    const [a, setA] = useState("");
    const [b, setB] = useState("");

    function statsDe(nombre) {
        const arr = traslados.filter((t) => t.choferNombre === nombre);
        return calcularStats(arr);
    }

    const statsA = a ? statsDe(a) : null;
    const statsB = b ? statsDe(b) : null;

    const filas = [
        { label: "Viajes", a: statsA?.total ?? 0, b: statsB?.total ?? 0 },
        { label: "KM totales", a: statsA?.kmTotal ?? 0, b: statsB?.kmTotal ?? 0, fmt: (v) => `${v.toFixed(0)} km` },
        { label: "Litros", a: statsA?.litrosTotal ?? 0, b: statsB?.litrosTotal ?? 0, fmt: (v) => `${v.toFixed(2)} L` },
        { label: "$ combustible", a: statsA?.precioTotal ?? 0, b: statsB?.precioTotal ?? 0, fmt: (v) => `$${v.toLocaleString("es-AR")}` },
        { label: "Prom. km/viaje", a: statsA?.promedioKm ?? 0, b: statsB?.promedioKm ?? 0, fmt: (v) => `${v.toFixed(1)} km` },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                Comparar choferes
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <select
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                >
                    <option value="">Chofer A...</option>
                    {choferesDisponibles.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
                <select
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                >
                    <option value="">Chofer B...</option>
                    {choferesDisponibles.map((c) => (
                        <option key={c} value={c}>{c}</option>
                    ))}
                </select>
            </div>

            {!a || !b ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                    Elegí dos choferes para comparar.
                </p>
            ) : (
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="text-left text-[11px] uppercase text-slate-400 dark:text-slate-500 font-medium pb-2">
                                Métrica
                            </th>
                            <th className="text-right text-[11px] uppercase text-sky-600 dark:text-sky-400 font-medium pb-2 truncate">
                                {a.split(",")[0]}
                            </th>
                            <th className="text-right text-[11px] uppercase text-violet-600 dark:text-violet-400 font-medium pb-2 truncate">
                                {b.split(",")[0]}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {filas.map((f) => (
                            <tr key={f.label} className="border-t border-slate-100 dark:border-slate-800">
                                <td className="py-2 text-xs text-slate-500 dark:text-slate-400">{f.label}</td>
                                <td className="py-2 text-right text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                    {f.fmt ? f.fmt(f.a) : f.a}
                                </td>
                                <td className="py-2 text-right text-sm font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                    {f.fmt ? f.fmt(f.b) : f.b}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}

/* ============================================
   PANEL PRINCIPAL
   ============================================ */
export default function PanelEstadisticas({ traslados }) {
    const [abierto, setAbierto] = useState(false);
    const stats = calcularStats(traslados);

    if (!traslados.length) return null;

    const maxViajes = stats.topChoferesViajes[0]?.viajes || 1;
    const maxKm = stats.topChoferesKm[0]?.km || 1;

    return (
        <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
            <button
                onClick={() => setAbierto(!abierto)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-100 dark:hover:bg-slate-800/60 transition"
            >
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                        Panel de estadísticas
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500 hidden sm:inline">
                        ({traslados.length} viajes en el período)
                    </span>
                </div>
                <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${abierto ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
            </button>

            {abierto && (
                <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-5">
                    {/* RESUMEN */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <Stat label="Viajes" value={stats.total} accent="violet" />
                        <Stat
                            label="KM totales"
                            value={stats.kmTotal.toFixed(0)}
                            sub={`Prom. ${stats.promedioKm.toFixed(1)} km`}
                            accent="sky"
                        />
                        <Stat
                            label="Litros"
                            value={stats.litrosTotal.toFixed(2)}
                            sub={`Prom. ${stats.promedioLitros.toFixed(2)} L`}
                            accent="emerald"
                        />
                        <Stat
                            label="$ Combustible"
                            value={`$${stats.precioTotal.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`}
                            accent="amber"
                        />
                    </div>

                    {/* DESTACADOS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        {stats.viajeMasLargoKm && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                <p className="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-2">
                                    🏆 Viaje más largo (km)
                                </p>
                                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                                    {kmRecorridos(stats.viajeMasLargoKm)} km
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                    {mostrarFecha(stats.viajeMasLargoKm.fecha)} · {stats.viajeMasLargoKm.inicio} → {stats.viajeMasLargoKm.final}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                    {stats.viajeMasLargoKm.choferNombre}
                                </p>
                            </div>
                        )}

                        {stats.viajeMasLargoHs && (
                            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                                <p className="text-xs uppercase text-slate-400 dark:text-slate-500 font-medium mb-2">
                                    ⏱️ Viaje más largo (duración)
                                </p>
                                <p className="text-2xl font-bold text-violet-600 dark:text-violet-400 tabular-nums">
                                    {formatDuracion(stats.viajeMasLargoHs._min)}
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 truncate">
                                    {mostrarFecha(stats.viajeMasLargoHs.fecha)} · {stats.viajeMasLargoHs.horaSalida} → {stats.viajeMasLargoHs.horaLlegada}
                                </p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                    {stats.viajeMasLargoHs.choferNombre}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* RANKINGS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                                Top choferes por viajes
                            </h3>
                            <div className="space-y-3">
                                {stats.topChoferesViajes.map((c, i) => (
                                    <div key={c.nombre}>
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                                {i + 1}. {c.nombre}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums flex-shrink-0">
                                                {c.viajes}
                                            </span>
                                        </div>
                                        <Barra valor={c.viajes} max={maxViajes} color="sky" />
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                                Top choferes por KM
                            </h3>
                            <div className="space-y-3">
                                {stats.topChoferesKm.map((c, i) => (
                                    <div key={c.nombre}>
                                        <div className="flex items-center justify-between mb-1 gap-2">
                                            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                                {i + 1}. {c.nombre}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums flex-shrink-0">
                                                {c.km.toFixed(0)} km
                                            </span>
                                        </div>
                                        <Barra valor={c.km} max={maxKm} color="emerald" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* COMPARADOR */}
                    <Comparador traslados={traslados} />
                </div>
            )}
        </div>
    );
}