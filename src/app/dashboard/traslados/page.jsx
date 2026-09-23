"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import FormTraslado from "@/components/traslados/FormTraslado";
import ModalImportar from "@/components/traslados/ModalImportar";
import PanelEstadisticas from "@/components/traslados/PanelEstadisticas";
import {
    TRASLADO_VACIO,
    actualizarTraslado,
    crearTraslado,
    eliminarTraslado,
    exportarExcel,
    formatDuracion,
    duracionMinutos,
    kmRecorridos,
    suscribirTraslados,
} from "@/lib/traslados";
import { mostrarFecha } from "@/lib/combustible";

/* ============================================
   TAB BUTTON
   ============================================ */
function TabButton({ active, onClick, children, count }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${active
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
        >
            {children}
            {count != null && (
                <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${active
                        ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

export default function TrasladosPage() {
    const [tab, setTab] = useState("traslados");

    const [traslados, setTraslados] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroMes, setFiltroMes] = useState("");

    const [modalForm, setModalForm] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(TRASLADO_VACIO);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const unsub = suscribirTraslados((arr) => {
            setTraslados(arr);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const mesesDisponibles = useMemo(() => {
        const set = new Set();
        traslados.forEach((t) => {
            if (t.fecha && t.fecha.length >= 7) set.add(t.fecha.slice(0, 7));
        });
        return Array.from(set).sort().reverse();
    }, [traslados]);

    const filtrados = useMemo(() => {
        let arr = traslados;
        if (filtroMes) arr = arr.filter((t) => (t.fecha || "").startsWith(filtroMes));
        const q = busqueda.trim().toLowerCase();
        if (q) {
            arr = arr.filter((t) =>
                [t.id, t.choferNombre, t.enfermero, t.paciente, t.motivo, t.inicio, t.final, t.fecha]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q))
            );
        }
        return arr;
    }, [traslados, busqueda, filtroMes]);

    /* ============ HANDLERS ============ */
    function abrirNuevo() {
        setEditando(null);
        setForm(TRASLADO_VACIO);
        setModalForm(true);
    }

    function abrirEditar(t) {
        setEditando(t.id);
        setForm({
            fecha: t.fecha || "",
            horaSalida: t.horaSalida || "",
            horaLlegada: t.horaLlegada || "",
            kmInicial: t.kmInicial ?? "",
            kmFinal: t.kmFinal ?? "",
            inicio: t.inicio || "",
            final: t.final || "",
            combustibleLitros: t.combustibleLitros ?? "",
            combustiblePrecio: t.combustiblePrecio ?? "",
            choferId: t.choferId ?? null,
            choferNombre: t.choferNombre || "",
            enfermeroId: t.enfermeroId ?? null,
            enfermero: t.enfermero || "",
            paciente: t.paciente || "",
            motivo: t.motivo || "",
        });
        setModalForm(true);
    }

    function cerrarForm() {
        setModalForm(false);
        setEditando(null);
        setForm(TRASLADO_VACIO);
    }

    function onFormChange(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function guardar(e) {
        e.preventDefault();
        if (!form.fecha || !form.choferNombre) return;

        setGuardando(true);
        try {
            if (editando) {
                await actualizarTraslado(editando, form);
            } else {
                await crearTraslado(form);
            }
            cerrarForm();
        } catch (err) {
            console.error(err);
            alert("Error al guardar.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(t) {
        if (!confirm(`¿Eliminar el traslado del ${mostrarFecha(t.fecha)}?`)) return;
        try {
            await eliminarTraslado(t.id);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    function handleExportar() {
        if (!filtrados.length) {
            alert("No hay datos para exportar.");
            return;
        }
        exportarExcel(filtrados);
    }

    const formValido = form.fecha && form.choferNombre;

    /* ============ RENDER ============ */
    return (
        <div>
            {/* HEADER */}
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                            Traslados en ambulancia
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {traslados.length} viaje{traslados.length === 1 ? "" : "s"} registrado
                            {traslados.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    {tab === "traslados" && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setModalImport(true)}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                </svg>
                                <span className="hidden xs:inline">Importar</span>
                            </button>
                            <button
                                onClick={handleExportar}
                                disabled={!filtrados.length}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="hidden xs:inline">Exportar</span>
                            </button>
                            <button
                                onClick={abrirNuevo}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo traslado
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* TABS */}
            <div className="border-b border-slate-200 dark:border-slate-800 mb-5 overflow-x-auto">
                <div className="flex min-w-max">
                    <TabButton active={tab === "traslados"} onClick={() => setTab("traslados")} count={traslados.length}>
                        🚑 Traslados
                    </TabButton>
                    <TabButton active={tab === "estadisticas"} onClick={() => setTab("estadisticas")}>
                        📊 Estadísticas
                    </TabButton>
                </div>
            </div>

            {/* ============================================
          TAB TRASLADOS
          ============================================ */}
            {tab === "traslados" && (
                <>
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
                                placeholder="Buscar por chofer, enfermero, paciente, motivo..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>
                        <select
                            value={filtroMes}
                            onChange={(e) => setFiltroMes(e.target.value)}
                            className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:w-52"
                        >
                            <option value="">Todos los meses</option>
                            {mesesDisponibles.map((m) => {
                                const [y, mes] = m.split("-");
                                const nombre = new Date(Number(y), Number(mes) - 1).toLocaleDateString("es-AR", {
                                    month: "long",
                                    year: "numeric",
                                });
                                return (
                                    <option key={m} value={m}>
                                        {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                                    </option>
                                );
                            })}
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
                                {traslados.length === 0
                                    ? "Todavía no hay traslados. Cargá el primero o importá desde Excel."
                                    : "Sin resultados para tu búsqueda."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* DESKTOP: TABLA */}
                            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                            <tr>
                                                <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    Fecha / Hora
                                                </th>
                                                <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">
                                                    Ruta
                                                </th>
                                                <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    KM
                                                </th>
                                                <th className="text-left px-3 py-3 font-semibold text-sky-600 dark:text-sky-400 whitespace-nowrap">
                                                    🚑 Chofer
                                                </th>
                                                <th className="text-left px-3 py-3 font-semibold text-violet-600 dark:text-violet-400 whitespace-nowrap">
                                                    💉 Enfermero/a
                                                </th>
                                                <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                    Paciente
                                                </th>
                                                <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">
                                                    Acciones
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtrados.map((t) => {
                                                const km = kmRecorridos(t);
                                                return (
                                                    <tr
                                                        key={t.id}
                                                        className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                                    >
                                                        <td className="px-3 py-3 align-top">
                                                            <div className="text-slate-800 dark:text-slate-200 whitespace-nowrap font-mono text-xs">
                                                                {mostrarFecha(t.fecha)}
                                                            </div>
                                                            {t.horaSalida && (
                                                                <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                                                                    {t.horaSalida}
                                                                    {t.horaLlegada && ` → ${t.horaLlegada}`}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3 align-top">
                                                            <div className="text-xs text-slate-600 dark:text-slate-400 truncate max-w-[260px]">
                                                                {t.inicio || "—"}{" "}
                                                                <span className="text-slate-300 dark:text-slate-600">→</span>{" "}
                                                                {t.final || "—"}
                                                            </div>
                                                            {t.motivo && (
                                                                <div className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate max-w-[260px] mt-0.5">
                                                                    {t.motivo}
                                                                </div>
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3 text-right font-semibold text-sky-600 dark:text-sky-400 tabular-nums whitespace-nowrap align-top">
                                                            {km > 0 ? `${km} km` : "—"}
                                                        </td>

                                                        <td className="px-3 py-3 align-top">
                                                            {t.choferNombre ? (
                                                                <span className="text-slate-800 dark:text-slate-200 text-xs truncate max-w-[180px] inline-block">
                                                                    {t.choferNombre}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3 align-top">
                                                            {t.enfermero ? (
                                                                <span className="text-slate-800 dark:text-slate-200 text-xs truncate max-w-[180px] inline-block">
                                                                    {t.enfermero}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3 align-top">
                                                            {t.paciente ? (
                                                                <span className="text-slate-700 dark:text-slate-300 text-xs truncate max-w-[180px] inline-block">
                                                                    👤 {t.paciente}
                                                                </span>
                                                            ) : (
                                                                <span className="text-slate-300 dark:text-slate-600 text-xs">—</span>
                                                            )}
                                                        </td>

                                                        <td className="px-3 py-3 align-top">
                                                            <div className="flex justify-end gap-0.5">
                                                                <button
                                                                    onClick={() => abrirEditar(t)}
                                                                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                                                    title="Editar"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                    </svg>
                                                                </button>
                                                                <button
                                                                    onClick={() => borrar(t)}
                                                                    className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition"
                                                                    title="Eliminar"
                                                                >
                                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                                                    </svg>
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* MOBILE: CARDS */}
                            <div className="md:hidden space-y-2">
                                {filtrados.map((t) => {
                                    const km = kmRecorridos(t);
                                    const min = duracionMinutos(t);
                                    return (
                                        <div
                                            key={t.id}
                                            className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5"
                                        >
                                            <div className="flex items-start justify-between gap-2 mb-2">
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 font-mono">
                                                            {mostrarFecha(t.fecha)}
                                                        </span>
                                                        {t.horaSalida && (
                                                            <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                                                                {t.horaSalida}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-600 dark:text-slate-400 truncate">
                                                        {t.inicio || "—"}{" "}
                                                        <span className="text-slate-300 dark:text-slate-600">→</span>{" "}
                                                        {t.final || "—"}
                                                    </p>
                                                </div>
                                                <div className="text-right flex-shrink-0">
                                                    <p className="text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums leading-none">
                                                        {km > 0 ? km : "—"}
                                                    </p>
                                                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">
                                                        km
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-1.5 py-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                                {t.choferNombre && (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-sky-600 dark:text-sky-400 flex-shrink-0 w-4">
                                                            🚑
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-300 truncate">
                                                            {t.choferNombre}
                                                        </span>
                                                    </div>
                                                )}
                                                {t.enfermero && (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-violet-600 dark:text-violet-400 flex-shrink-0 w-4">
                                                            💉
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-300 truncate">
                                                            {t.enfermero}
                                                        </span>
                                                    </div>
                                                )}
                                                {t.paciente && (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 w-4">
                                                            👤
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-300 truncate">
                                                            {t.paciente}
                                                        </span>
                                                    </div>
                                                )}
                                                {min != null && (
                                                    <div className="flex items-start gap-2">
                                                        <span className="text-slate-400 dark:text-slate-500 flex-shrink-0 w-4">
                                                            ⏱️
                                                        </span>
                                                        <span className="text-slate-700 dark:text-slate-300">
                                                            {formatDuracion(min)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {t.motivo && (
                                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 italic truncate">
                                                    "{t.motivo}"
                                                </p>
                                            )}

                                            <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                                <button
                                                    onClick={() => abrirEditar(t)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                                                >
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => borrar(t)}
                                                    className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                                >
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ============================================
          TAB ESTADÍSTICAS
          ============================================ */}
            {tab === "estadisticas" && (
                <>
                    <div className="mb-4 flex flex-col sm:flex-row gap-2">
                        <select
                            value={filtroMes}
                            onChange={(e) => setFiltroMes(e.target.value)}
                            className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:w-56"
                        >
                            <option value="">Todos los meses</option>
                            {mesesDisponibles.map((m) => {
                                const [y, mes] = m.split("-");
                                const nombre = new Date(Number(y), Number(mes) - 1).toLocaleDateString("es-AR", {
                                    month: "long",
                                    year: "numeric",
                                });
                                return (
                                    <option key={m} value={m}>
                                        {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                                    </option>
                                );
                            })}
                        </select>
                        <p className="text-xs text-slate-500 dark:text-slate-400 self-center">
                            Mostrando estadísticas de <strong>{filtrados.length}</strong> traslado
                            {filtrados.length === 1 ? "" : "s"}
                            {filtroMes && ` · ${filtroMes}`}
                        </p>
                    </div>

                    {loading ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                            Cargando...
                        </div>
                    ) : filtrados.length === 0 ? (
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                            <p className="text-slate-400 dark:text-slate-500 text-sm">
                                {traslados.length === 0
                                    ? "Todavía no hay traslados para analizar."
                                    : "Sin datos en el período seleccionado."}
                            </p>
                        </div>
                    ) : (
                        <PanelEstadisticas traslados={filtrados} />
                    )}
                </>
            )}

            {/* MODAL FORM */}
            <Modal
                open={modalForm}
                onClose={cerrarForm}
                title={editando ? `Editar traslado #${editando}` : "Nuevo traslado"}
                size="lg"
            >
                <form onSubmit={guardar} className="space-y-5">
                    <FormTraslado values={form} onChange={onFormChange} esEdicion={Boolean(editando)} />
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={cerrarForm}
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando || !formValido}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear traslado"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL IMPORTAR */}
            <ModalImportar
                open={modalImport}
                onClose={() => setModalImport(false)}
                onDone={(n) =>
                    alert(`✅ ${n} traslado${n === 1 ? "" : "s"} importado${n === 1 ? "" : "s"}`)
                }
            />
        </div>
    );
}