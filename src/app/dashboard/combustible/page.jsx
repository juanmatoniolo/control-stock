"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import FormCombustible from "@/components/combustible/FormCombustible";
import ModalImportar from "@/components/combustible/ModalImportar";
import {
    CARGA_VACIA,
    actualizarCarga,
    crearCarga,
    eliminarCarga,
    exportarExcel,
    mostrarFecha,
    suscribirCombustible,
} from "@/lib/combustible";

/* ============================================
   STAT CARD
   ============================================ */
function StatCard({ label, value, sub, accent = "sky" }) {
    const accents = {
        sky: "from-sky-500 to-sky-700 text-white",
        emerald: "from-emerald-500 to-emerald-700 text-white",
        amber: "from-amber-500 to-amber-700 text-white",
        violet: "from-violet-500 to-violet-700 text-white",
    };
    return (
        <div className={`rounded-xl p-4 bg-gradient-to-br ${accents[accent]} shadow-lg`}>
            <p className="text-xs uppercase tracking-wider opacity-80 font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function CombustiblePage() {
    const [cargas, setCargas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtroMes, setFiltroMes] = useState(""); // "YYYY-MM"

    const [modalForm, setModalForm] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(CARGA_VACIA);
    const [guardando, setGuardando] = useState(false);

    /* ============ SUSCRIPCIÓN ============ */
    useEffect(() => {
        const unsub = suscribirCombustible((arr) => {
            setCargas(arr);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /* ============ MESES DISPONIBLES ============ */
    const mesesDisponibles = useMemo(() => {
        const set = new Set();
        cargas.forEach((c) => {
            if (c.fecha && c.fecha.length >= 7) set.add(c.fecha.slice(0, 7));
        });
        return Array.from(set).sort().reverse();
    }, [cargas]);

    /* ============ FILTRO ============ */
    const filtrados = useMemo(() => {
        let arr = cargas;
        if (filtroMes) {
            arr = arr.filter((c) => (c.fecha || "").startsWith(filtroMes));
        }
        const q = busqueda.trim().toLowerCase();
        if (q) {
            arr = arr.filter((c) =>
                [c.id, c.numeroRemito, c.chofer, c.fecha, c.hora]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q))
            );
        }
        return arr;
    }, [cargas, busqueda, filtroMes]);

    /* ============ RESUMEN ============ */
    const resumen = useMemo(() => {
        const total = filtrados.reduce((s, c) => s + (Number(c.litros) || 0), 0);
        const remitos = filtrados.length;
        const choferes = new Set(filtrados.map((c) => c.chofer).filter(Boolean)).size;
        const promedio = remitos > 0 ? total / remitos : 0;
        return { total, remitos, choferes, promedio };
    }, [filtrados]);

    /* ============ HANDLERS ============ */
    function abrirNuevo() {
        setEditando(null);
        setForm(CARGA_VACIA);
        setModalForm(true);
    }

    function abrirEditar(c) {
        setEditando(c.id);
        setForm({
            fecha: c.fecha || "",
            hora: c.hora || "",
            numeroRemito: c.numeroRemito || "",
            litros: c.litros ?? "",
            choferId: c.choferId ?? null,
            chofer: c.chofer || "",
        });
        setModalForm(true);
    }

    function cerrarForm() {
        setModalForm(false);
        setEditando(null);
        setForm(CARGA_VACIA);
    }

    function onFormChange(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function guardar(e) {
        e.preventDefault();
        if (!form.fecha || !form.numeroRemito?.trim() || form.litros === "" || !form.chofer?.trim()) {
            return;
        }

        setGuardando(true);
        try {
            if (editando) {
                await actualizarCarga(editando, form);
            } else {
                await crearCarga(form);
            }
            cerrarForm();
        } catch (err) {
            console.error(err);
            alert("Error al guardar. Revisá la consola.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(c) {
        if (!confirm(`¿Eliminar el remito "${c.numeroRemito}" del ${mostrarFecha(c.fecha)}?`)) return;
        try {
            await eliminarCarga(c.id);
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

    const formValido =
        form.fecha && form.numeroRemito?.trim() && form.litros !== "" && form.chofer?.trim();

    /* ============ RENDER ============ */
    return (
        <div>
            {/* HEADER */}
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                            Combustible
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            Control de cargas por remito
                        </p>
                    </div>
                    <div className="flex flex-col xs:flex-row gap-2">
                        <button
                            onClick={() => setModalImport(true)}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Importar
                        </button>
                        <button
                            onClick={handleExportar}
                            disabled={!filtrados.length}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar
                        </button>
                        <button
                            onClick={abrirNuevo}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva carga
                        </button>
                    </div>
                </div>
            </header>

            {/* RESUMEN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatCard
                    label="Total litros"
                    value={resumen.total.toFixed(2)}
                    sub={filtroMes ? `Mes ${filtroMes}` : "Todos los remitos"}
                    accent="sky"
                />
                <StatCard
                    label="Remitos"
                    value={resumen.remitos}
                    sub={resumen.remitos === 1 ? "1 carga" : `${resumen.remitos} cargas`}
                    accent="violet"
                />
                <StatCard
                    label="Promedio"
                    value={`${resumen.promedio.toFixed(2)} L`}
                    sub="Por remito"
                    accent="amber"
                />
                <StatCard
                    label="Choferes"
                    value={resumen.choferes}
                    sub={resumen.choferes === 1 ? "1 chofer" : `${resumen.choferes} choferes`}
                    accent="emerald"
                />
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
                        placeholder="Buscar por N° remito, chofer, fecha..."
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
                        {cargas.length === 0
                            ? "Todavía no hay remitos. Cargá el primero o importá desde Excel."
                            : "Sin resultados para tu búsqueda."}
                    </p>
                </div>
            ) : (
                <>
                    {/* ============ DESKTOP: TABLA ============ */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-14">#</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Hora</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">N° Remito</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Litros</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Chofer</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map((c) => (
                                        <tr
                                            key={c.id}
                                            className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                        >
                                            <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                #{c.id}
                                            </td>
                                            <td className="px-3 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {mostrarFecha(c.fecha)}
                                            </td>
                                            <td className="px-3 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap">
                                                {c.hora || "—"}
                                            </td>
                                            <td className="px-3 py-3 font-mono text-xs text-slate-700 dark:text-slate-300">
                                                {c.numeroRemito || "—"}
                                            </td>
                                            <td className="px-3 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                                {Number(c.litros || 0).toFixed(2)} L
                                            </td>
                                            <td className="px-3 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                                                {c.chofer || "—"}
                                            </td>
                                            <td className="px-3 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <button
                                                        onClick={() => abrirEditar(c)}
                                                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                                        title="Editar"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                        </svg>
                                                    </button>
                                                    <button
                                                        onClick={() => borrar(c)}
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
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/50 border-t-2 border-slate-200 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                                            Total
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                                            {resumen.total.toFixed(2)} L
                                        </td>
                                        <td colSpan={2} className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            {resumen.remitos} remito{resumen.remitos === 1 ? "" : "s"}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* ============ MOBILE: CARDS ============ */}
                    <div className="md:hidden space-y-2">
                        {filtrados.map((c) => (
                            <div
                                key={c.id}
                                className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5"
                            >
                                <div className="flex items-start justify-between gap-2 mb-2">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                                #{c.id}
                                            </span>
                                            <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                                {mostrarFecha(c.fecha)}
                                            </span>
                                            {c.hora && (
                                                <span className="text-xs text-slate-500 dark:text-slate-400">
                                                    {c.hora}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-1 truncate">
                                            {c.numeroRemito}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-bold text-sky-600 dark:text-sky-400 tabular-nums leading-none">
                                            {Number(c.litros || 0).toFixed(2)}
                                        </p>
                                        <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">litros</p>
                                    </div>
                                </div>

                                {c.chofer && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-3 truncate">
                                        👤 {c.chofer}
                                    </p>
                                )}

                                <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                    <button
                                        onClick={() => abrirEditar(c)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Editar
                                    </button>
                                    <button
                                        onClick={() => borrar(c)}
                                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                        </svg>
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* TOTAL MOBILE */}
                        <div className="bg-gradient-to-br from-sky-500 to-sky-700 text-white rounded-xl p-4 shadow-lg">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium">Total del período</span>
                                <span className="text-2xl font-bold tabular-nums">
                                    {resumen.total.toFixed(2)} L
                                </span>
                            </div>
                            <p className="text-xs opacity-80 mt-1">
                                {resumen.remitos} remito{resumen.remitos === 1 ? "" : "s"}
                            </p>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL CREAR/EDITAR */}
            <Modal
                open={modalForm}
                onClose={cerrarForm}
                title={editando ? `Editar carga #${editando}` : "Nueva carga de combustible"}
                size="md"
            >
                <form onSubmit={guardar} className="space-y-4">
                    <FormCombustible
                        values={form}
                        onChange={onFormChange}
                        esEdicion={Boolean(editando)}
                    />
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
                            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear carga"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL IMPORTAR */}
            <ModalImportar
                open={modalImport}
                onClose={() => setModalImport(false)}
                onDone={(n) =>
                    alert(`✅ ${n} carga${n === 1 ? "" : "s"} importada${n === 1 ? "" : "s"}`)
                }
            />
        </div>
    );
}