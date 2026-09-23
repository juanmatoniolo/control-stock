"use client";

import { useState } from "react";
import { calcularStats, formatDuracion, kmRecorridos } from "@/lib/traslados";
import { mostrarFecha } from "@/lib/combustible";

/* ============================================
   STAT
   ============================================ */
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

/* ============================================
   BARRA
   ============================================ */
function Barra({ valor, max, color = "sky" }) {
    const pct = max > 0 ? (valor / max) * 100 : 0;
    const colors = {
        sky: "bg-sky-500",
        emerald: "bg-emerald-500",
        violet: "bg-violet-500",
        amber: "bg-amber-500",
    };
    return (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${colors[color]}`} style={{ width: `${pct}%` }} />
        </div>
    );
}

/* ============================================
   COMPARADOR (choferes o enfermeros)
   ============================================ */
function Comparador({ traslados, tipo = "chofer" }) {
    const esChofer = tipo === "chofer";
    const campo = esChofer ? "choferNombre" : "enfermero";
    const titulo = esChofer ? "Comparar choferes" : "Comparar enfermeros/as";

    const disponibles = Array.from(
        new Set(traslados.map((t) => t[campo]).filter(Boolean))
    ).sort();

    const [a, setA] = useState("");
    const [b, setB] = useState("");

    function statsDe(nombre) {
        const arr = traslados.filter((t) => t[campo] === nombre);
        return calcularStats(arr);
    }

    const statsA = a ? statsDe(a) : null;
    const statsB = b ? statsDe(b) : null;

    const filas = [
        { label: "Viajes", a: statsA?.total ?? 0, b: statsB?.total ?? 0 },
        {
            label: "KM totales",
            a: statsA?.kmTotal ?? 0,
            b: statsB?.kmTotal ?? 0,
            fmt: (v) => `${v.toFixed(0)} km`,
        },
        {
            label: "Litros",
            a: statsA?.litrosTotal ?? 0,
            b: statsB?.litrosTotal ?? 0,
            fmt: (v) => `${v.toFixed(2)} L`,
        },
        {
            label: "$ combustible",
            a: statsA?.precioTotal ?? 0,
            b: statsB?.precioTotal ?? 0,
            fmt: (v) => `$${v.toLocaleString("es-AR")}`,
        },
        {
            label: "Prom. km/viaje",
            a: statsA?.promedioKm ?? 0,
            b: statsB?.promedioKm ?? 0,
            fmt: (v) => `${v.toFixed(1)} km`,
        },
    ];

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                {titulo}
            </h3>
            <div className="grid grid-cols-2 gap-3 mb-4">
                <select
                    value={a}
                    onChange={(e) => setA(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                >
                    <option value="">{esChofer ? "Chofer A..." : "Enfermero A..."}</option>
                    {disponibles.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
                <select
                    value={b}
                    onChange={(e) => setB(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-sky-500"
                >
                    <option value="">{esChofer ? "Chofer B..." : "Enfermero B..."}</option>
                    {disponibles.map((c) => (
                        <option key={c} value={c}>
                            {c}
                        </option>
                    ))}
                </select>
            </div>

            {!a || !b ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                    Elegí dos personas para comparar.
                </p>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr>
                                <th className="text-left text-[11px] uppercase text-slate-400 dark:text-slate-500 font-medium pb-2">
                                    Métrica
                                </th>
                                <th className="text-right text-[11px] uppercase text-sky-600 dark:text-sky-400 font-medium pb-2 truncate max-w-[120px]">
                                    {a.split(",")[0]}
                                </th>
                                <th className="text-right text-[11px] uppercase text-violet-600 dark:text-violet-400 font-medium pb-2 truncate max-w-[120px]">
                                    {b.split(",")[0]}
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {filas.map((f) => (
                                <tr key={f.label} className="border-t border-slate-100 dark:border-slate-800">
                                    <td className="py-2 text-xs text-slate-500 dark:text-slate-400">
                                        {f.label}
                                    </td>
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
                </div>
            )}
        </div>
    );
}

/* ============================================
   RANKING
   ============================================ */
function Ranking({ titulo, icono, color, data, keyLabel = "viajes" }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                    {icono} {titulo}
                </h3>
                <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                    Sin datos.
                </p>
            </div>
        );
    }

    const max = data[0][keyLabel] || 1;

    return (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-3">
                {icono} {titulo}
            </h3>
            <div className="space-y-3">
                {data.map((c, i) => (
                    <div key={c.nombre}>
                        <div className="flex items-center justify-between mb-1 gap-2">
                            <span className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                {i + 1}. {c.nombre}
                            </span>
                            <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 tabular-nums flex-shrink-0">
                                {keyLabel === "km" ? `${c.km.toFixed(0)} km` : c.viajes}
                            </span>
                        </div>
                        <Barra valor={c[keyLabel]} max={max} color={color} />
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ============================================
   CONTENIDO REUTILIZABLE (todo el dashboard)
   ============================================ */
function ContenidoEstadisticas({ traslados, stats }) {
    return (
        <>
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
                            🚑 {stats.viajeMasLargoKm.choferNombre}
                            {stats.viajeMasLargoKm.enfermero && ` · 💉 ${stats.viajeMasLargoKm.enfermero}`}
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
                            🚑 {stats.viajeMasLargoHs.choferNombre}
                            {stats.viajeMasLargoHs.enfermero && ` · 💉 ${stats.viajeMasLargoHs.enfermero}`}
                        </p>
                    </div>
                )}
            </div>

            {/* RANKING CHOFERES */}
            <div>
                <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                    🚑 Ranking de choferes
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <Ranking
                        titulo="Top choferes por viajes"
                        icono="🏆"
                        color="sky"
                        data={stats.topChoferesViajes}
                        keyLabel="viajes"
                    />
                    <Ranking
                        titulo="Top choferes por KM"
                        icono="🛣️"
                        color="emerald"
                        data={stats.topChoferesKm}
                        keyLabel="km"
                    />
                </div>
            </div>

            {/* RANKING ENFERMEROS */}
            {stats.topEnfermerosViajes && stats.topEnfermerosViajes.length > 0 && (
                <div>
                    <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        💉 Ranking de enfermeros/as
                    </h3>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                        <Ranking
                            titulo="Top enfermeros por viajes"
                            icono="🏆"
                            color="violet"
                            data={stats.topEnfermerosViajes}
                            keyLabel="viajes"
                        />
                        <Ranking
                            titulo="Top enfermeros por KM"
                            icono="🛣️"
                            color="amber"
                            data={stats.topEnfermerosKm}
                            keyLabel="km"
                        />
                    </div>
                </div>
            )}

            {/* COMPARADOR CHOFERES */}
            <Comparador traslados={traslados} tipo="chofer" />

            {/* COMPARADOR ENFERMEROS */}
            {stats.topEnfermerosViajes && stats.topEnfermerosViajes.length > 0 && (
                <Comparador traslados={traslados} tipo="enfermero" />
            )}
        </>
    );
}

/* ============================================
   PANEL PRINCIPAL
   ============================================ */
export default function PanelEstadisticas({ traslados, forceOpen = false }) {
    const [abierto, setAbierto] = useState(forceOpen);
    const stats = calcularStats(traslados);

    if (!traslados.length) return null;

    /* ---------- MODO ABIERTO (para tab de estadísticas) ---------- */
    if (forceOpen) {
        return (
            <div className="space-y-5">
                <ContenidoEstadisticas traslados={traslados} stats={stats} />
            </div>
        );
    }

    /* ---------- MODO COLAPSABLE (default) ---------- */
    return (

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 space-y-5">
            <ContenidoEstadisticas traslados={traslados} stats={stats} />
        </div>

    );
}