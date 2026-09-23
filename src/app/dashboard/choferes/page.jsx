"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import FormChofer from "@/components/choferes/FormChofer";
import ModalDetalleChofer from "@/components/choferes/ModalDetalleChofer";
import { linkWhatsApp } from "@/lib/whatsapp";
import {
    CHOFER_VACIO,
    actualizarChofer,
    crearChofer,
    eliminarChofer,
    nombreCompleto,
    suscribirChoferes,
    toggleActivoChofer,
} from "@/lib/choferes";

export default function ChoferesPage() {
    const [choferes, setChoferes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");
    const [filtro, setFiltro] = useState("activos"); // activos | bajas | todos

    const [modalForm, setModalForm] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(false);
    const [detalle, setDetalle] = useState(null);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(CHOFER_VACIO);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const unsub = suscribirChoferes((arr) => {
            setChoferes(arr);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const filtrados = useMemo(() => {
        let arr = choferes;
        if (filtro === "activos") arr = arr.filter((c) => c.activo !== false);
        if (filtro === "bajas") arr = arr.filter((c) => c.activo === false);

        const q = busqueda.trim().toLowerCase();
        if (q) {
            arr = arr.filter((c) =>
                [c.id, c.nombre, c.apellido, c.dni, c.telefono, c.email, c.licencia]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q))
            );
        }
        return arr;
    }, [choferes, busqueda, filtro]);

    const totalActivos = choferes.filter((c) => c.activo !== false).length;
    const totalBajas = choferes.length - totalActivos;

    function abrirNuevo() {
        setEditando(null);
        setForm(CHOFER_VACIO);
        setModalForm(true);
    }

    function abrirEditar(c) {
        setEditando(c.id);
        setForm({ ...CHOFER_VACIO, ...c });
        setModalForm(true);
    }

    function abrirDetalle(c) {
        setDetalle(c);
        setModalDetalle(true);
    }

    function cerrarForm() {
        setModalForm(false);
        setEditando(null);
        setForm(CHOFER_VACIO);
    }

    function onFormChange(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function guardar(e) {
        e.preventDefault();
        if (!form.nombre?.trim() || !form.apellido?.trim()) return;

        setGuardando(true);
        try {
            if (editando) {
                await actualizarChofer(editando, form);
            } else {
                await crearChofer(form);
            }
            cerrarForm();
        } catch (err) {
            console.error(err);
            alert("Error al guardar. Revisá la consola.");
        } finally {
            setGuardando(false);
        }
    }

    async function toggleActivo(c) {
        const accion = c.activo === false ? "reactivar" : "marcar como baja";
        if (!confirm(`¿${accion[0].toUpperCase() + accion.slice(1)} a "${nombreCompleto(c)}"?`)) return;
        try {
            await toggleActivoChofer(c.id, c.activo === false);
        } catch (err) {
            console.error(err);
            alert("Error al cambiar estado.");
        }
    }

    async function borrar(c) {
        if (!confirm(`¿ELIMINAR PERMANENTEMENTE a "${nombreCompleto(c)}"?\n\nEsta acción no se puede deshacer.`)) return;
        try {
            await eliminarChofer(c.id);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    const formValido = form.nombre?.trim() && form.apellido?.trim();

    return (
        <div>
            {/* HEADER */}
            <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                        Choferes
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {totalActivos} activo{totalActivos === 1 ? "" : "s"}
                        {totalBajas > 0 && ` · ${totalBajas} en baja`}
                    </p>
                </div>
                <button
                    onClick={abrirNuevo}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo chofer
                </button>
            </header>

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
                        placeholder="Buscar por nombre, DNI, teléfono, licencia..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                </div>
                <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value)}
                    className="px-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 sm:w-48"
                >
                    <option value="activos">Solo activos ({totalActivos})</option>
                    <option value="bajas">Solo bajas ({totalBajas})</option>
                    <option value="todos">Todos ({choferes.length})</option>
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
                        {choferes.length === 0
                            ? "Todavía no hay choferes cargados."
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
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-14">#</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Nombre</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">DNI</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Teléfono</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Licencia</th>
                                        <th className="text-center px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-20">Estado</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-44">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map((c) => {
                                        const wa = linkWhatsApp(c.telefono);
                                        const inactivo = c.activo === false;
                                        return (
                                            <tr
                                                key={c.id}
                                                className={`border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition ${inactivo ? "opacity-60" : ""
                                                    }`}
                                            >
                                                <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                    #{c.id}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                                                        {nombreCompleto(c)}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                                    {c.dni || "—"}
                                                </td>
                                                <td className="px-3 py-3">
                                                    {c.telefono ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                                                                {c.telefono}
                                                            </span>
                                                            {wa && (
                                                                <a
                                                                    href={wa}
                                                                    target="_blank"
                                                                    rel="noreferrer"
                                                                    className="w-7 h-7 flex items-center justify-center rounded-lg text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition flex-shrink-0"
                                                                    title="Enviar WhatsApp"
                                                                >
                                                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                                                                    </svg>
                                                                </a>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600">—</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs">
                                                    {c.licencia || "—"}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <span
                                                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${inactivo
                                                            ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                                                            : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                            }`}
                                                    >
                                                        {inactivo ? "BAJA" : "ACTIVO"}
                                                    </span>
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => abrirDetalle(c)}
                                                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                                            title="Ver detalles"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => toggleActivo(c)}
                                                            className={`p-2 rounded-lg transition ${inactivo
                                                                ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                                : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                                }`}
                                                            title={inactivo ? "Reactivar" : "Marcar como baja"}
                                                        >
                                                            {inactivo ? (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                                </svg>
                                                            ) : (
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                                                </svg>
                                                            )}
                                                        </button>
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
                                                            title="Eliminar permanentemente"
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
                        {filtrados.map((c) => {
                            const wa = linkWhatsApp(c.telefono);
                            const inactivo = c.activo === false;
                            return (
                                <div
                                    key={c.id}
                                    className={`bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 ${inactivo ? "opacity-70" : ""
                                        }`}
                                >
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-sm font-bold uppercase text-white flex-shrink-0">
                                            {c.nombre?.[0] || "?"}
                                            {c.apellido?.[0] || ""}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                                    #{c.id}
                                                </span>
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded ${inactivo
                                                        ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                                                        : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                        }`}
                                                >
                                                    {inactivo ? "BAJA" : "ACTIVO"}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-1 truncate">
                                                {nombreCompleto(c)}
                                            </h3>
                                        </div>
                                    </div>

                                    <dl className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs mb-3">
                                        {c.dni && (<><dt className="text-slate-400 dark:text-slate-500">DNI</dt><dd className="text-slate-700 dark:text-slate-300 font-mono truncate">{c.dni}</dd></>)}
                                        {c.telefono && (<><dt className="text-slate-400 dark:text-slate-500">Tel</dt><dd className="text-slate-700 dark:text-slate-300 truncate">{c.telefono}</dd></>)}
                                        {c.licencia && (<><dt className="text-slate-400 dark:text-slate-500">Licencia</dt><dd className="text-slate-700 dark:text-slate-300 font-mono truncate">{c.licencia}</dd></>)}
                                    </dl>

                                    <div className="flex items-center gap-1.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => abrirDetalle(c)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition"
                                        >
                                            Ver
                                        </button>
                                        {wa && (
                                            <a
                                                href={wa}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                                            >
                                                WhatsApp
                                            </a>
                                        )}
                                        <button
                                            onClick={() => toggleActivo(c)}
                                            className={`p-2 rounded-lg transition ${inactivo
                                                ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                                                : "text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/40"
                                                }`}
                                            title={inactivo ? "Reactivar" : "Dar de baja"}
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => abrirEditar(c)}
                                            className="p-2 text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* MODAL CREAR/EDITAR */}
            <Modal
                open={modalForm}
                onClose={cerrarForm}
                title={editando ? `Editar chofer #${editando}` : "Nuevo chofer"}
                size="md"
            >
                <form onSubmit={guardar} className="space-y-4">
                    <FormChofer values={form} onChange={onFormChange} />
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
                            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear chofer"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL DETALLE */}
            <ModalDetalleChofer
                open={modalDetalle}
                onClose={() => setModalDetalle(false)}
                chofer={detalle}
            />
        </div>
    );
}