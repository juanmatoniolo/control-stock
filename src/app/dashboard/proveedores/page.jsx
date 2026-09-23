"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import CopyButton from "@/components/ui/CopyButton";
import FormProveedor from "@/components/proveedores/FormProveedor";
import ModalImportar from "@/components/proveedores/ModalImportar";
import ModalDetalle from "@/components/proveedores/ModalDetalle";
import { linkWhatsApp } from "@/lib/whatsapp";
import {
    PROVEEDOR_VACIO,
    actualizarProveedor,
    crearProveedor,
    eliminarProveedor,
    suscribirProveedores,
} from "@/lib/proveedores";

export default function ProveedoresPage() {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busqueda, setBusqueda] = useState("");

    const [modalForm, setModalForm] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(false);
    const [detalle, setDetalle] = useState(null);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(PROVEEDOR_VACIO);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const unsub = suscribirProveedores((arr) => {
            setProveedores(arr);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    /* ============ FILTRO ============ */
    const filtrados = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return proveedores;
        return proveedores.filter((p) =>
            [
                p.id,
                p.proveedor,
                p.cuit,
                p.rubro,
                p.email,
                p.telefono,
                p.alias,
                p.aliasRcel,
                p.banco,
                p.cbu,
                p.direccion,
                p.situacion,
            ]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [proveedores, busqueda]);

    /* ============ HANDLERS ============ */
    function abrirNuevo() {
        setEditando(null);
        setForm(PROVEEDOR_VACIO);
        setModalForm(true);
    }

    function abrirEditar(p) {
        setEditando(p.id);
        setForm({ ...PROVEEDOR_VACIO, ...p });
        setModalForm(true);
    }

    function abrirDetalle(p) {
        setDetalle(p);
        setModalDetalle(true);
    }

    function cerrarForm() {
        setModalForm(false);
        setEditando(null);
        setForm(PROVEEDOR_VACIO);
    }

    function onFormChange(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function guardar(e) {
        e.preventDefault();
        if (!form.proveedor?.trim()) return;

        setGuardando(true);
        try {
            if (editando) {
                await actualizarProveedor(editando, form);
            } else {
                await crearProveedor(form);
            }
            cerrarForm();
        } catch (err) {
            console.error(err);
            alert("Error al guardar. Revisá la consola.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(p) {
        if (!confirm(`¿Eliminar a "${p.proveedor}" (ID ${p.id})?`)) return;
        try {
            await eliminarProveedor(p.id);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    /* ============ RENDER ============ */
    return (
        <div>
            {/* HEADER */}
            <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                        Proveedores
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        {proveedores.length} registrado{proveedores.length === 1 ? "" : "s"}
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
                        Importar Excel
                    </button>
                    <button
                        onClick={abrirNuevo}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Nuevo proveedor
                    </button>
                </div>
            </header>

            {/* BUSCADOR */}
            <div className="mb-4">
                <div className="relative">
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
                        placeholder="Buscar por nombre, CUIT, CBU, alias, rubro, teléfono..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 transition-colors"
                    />
                </div>
            </div>

            {/* LISTADO */}
            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Cargando...
                </div>
            ) : filtrados.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                        {proveedores.length === 0
                            ? "Todavía no hay proveedores. Creá el primero o importá desde Excel."
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
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-16">ID</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Proveedor</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">CUIT</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">CBU / Alias</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Teléfono</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-44">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtrados.map((p) => {
                                        const wa = linkWhatsApp(p.telefono);
                                        return (
                                            <tr
                                                key={p.id}
                                                className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                            >
                                                <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">#{p.id}</td>

                                                <td className="px-3 py-3">
                                                    <div className="font-medium text-slate-900 dark:text-slate-100 truncate max-w-[220px]">
                                                        {p.proveedor}
                                                    </div>
                                                    {p.rubro && (
                                                        <div className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-[220px]">
                                                            {p.rubro}
                                                        </div>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs whitespace-nowrap">
                                                    {p.cuit || "—"}
                                                </td>

                                                <td className="px-3 py-3">
                                                    {p.cbu || p.alias ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <div className="min-w-0">
                                                                {p.cbu && (
                                                                    <div className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                                                                        {p.cbu}
                                                                    </div>
                                                                )}
                                                                {p.alias && (
                                                                    <div className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                                                                        {p.alias}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <CopyButton value={p.cbu || p.alias} size="sm" />
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-300 dark:text-slate-600">—</span>
                                                    )}
                                                </td>

                                                <td className="px-3 py-3">
                                                    {p.telefono ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <span className="text-slate-600 dark:text-slate-400 text-xs whitespace-nowrap">
                                                                {p.telefono}
                                                            </span>
                                                            {wa && (
                                                                <a
                                                                    href={`${wa}?text=${encodeURIComponent(
                                                                        `Hola ${p.proveedor}, te escribo desde el sistema de stock.`
                                                                    )}`}
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

                                                <td className="px-3 py-3">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => abrirDetalle(p)}
                                                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                                            title="Ver detalles"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => abrirEditar(p)}
                                                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                                            title="Editar"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => borrar(p)}
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

                    {/* ============ MOBILE: CARDS ============ */}
                    <div className="md:hidden space-y-2">
                        {filtrados.map((p) => {
                            const wa = linkWhatsApp(p.telefono);
                            return (
                                <div
                                    key={p.id}
                                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5 active:bg-slate-50 dark:active:bg-slate-800/60 transition"
                                >
                                    {/* CABECERA */}
                                    <div className="flex items-start justify-between gap-2 mb-3">
                                        <button
                                            onClick={() => abrirDetalle(p)}
                                            className="text-left min-w-0 flex-1"
                                        >
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                                    #{p.id}
                                                </span>
                                                {p.situacion && (
                                                    <span
                                                        className={`text-[10px] px-1.5 py-0.5 rounded ${/activ/i.test(p.situacion)
                                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                            : /inactiv/i.test(p.situacion)
                                                                ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                                                : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                                            }`}
                                                    >
                                                        {p.situacion}
                                                    </span>
                                                )}
                                            </div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-1.5 truncate">
                                                {p.proveedor}
                                            </h3>
                                            {p.rubro && (
                                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                    {p.rubro}
                                                </p>
                                            )}
                                        </button>
                                    </div>

                                    {/* DATOS CON ACCIONES */}
                                    <div className="space-y-1.5">
                                        {p.cbu && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 w-12 flex-shrink-0">
                                                    CBU
                                                </span>
                                                <span className="text-xs text-slate-700 dark:text-slate-300 font-mono flex-1 truncate">
                                                    {p.cbu}
                                                </span>
                                                <CopyButton value={p.cbu} size="sm" />
                                            </div>
                                        )}
                                        {p.alias && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 w-12 flex-shrink-0">
                                                    Alias
                                                </span>
                                                <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 truncate">
                                                    {p.alias}
                                                </span>
                                                <CopyButton value={p.alias} size="sm" />
                                            </div>
                                        )}
                                        {p.telefono && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] uppercase text-slate-400 dark:text-slate-500 w-12 flex-shrink-0">
                                                    Tel
                                                </span>
                                                <span className="text-xs text-slate-700 dark:text-slate-300 flex-1 truncate">
                                                    {p.telefono}
                                                </span>
                                                <CopyButton value={p.telefono} size="sm" />
                                            </div>
                                        )}
                                    </div>

                                    {/* BOTONES DE ACCIÓN */}
                                    <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => abrirDetalle(p)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                            Ver
                                        </button>

                                        {wa && (
                                            <a
                                                href={`${wa}?text=${encodeURIComponent(
                                                    `Hola ${p.proveedor}, te escribo desde el sistema de stock.`
                                                )}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                                                </svg>
                                                WhatsApp
                                            </a>
                                        )}

                                        <button
                                            onClick={() => abrirEditar(p)}
                                            className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                            Editar
                                        </button>

                                        <button
                                            onClick={() => borrar(p)}
                                            className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                            title="Eliminar"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
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
                title={editando ? `Editar proveedor #${editando}` : "Nuevo proveedor"}
                size="md"
            >
                <form onSubmit={guardar} className="space-y-4">
                    <FormProveedor values={form} onChange={onFormChange} />
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
                            disabled={guardando || !form.proveedor?.trim()}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear proveedor"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL DETALLE */}
            <ModalDetalle
                open={modalDetalle}
                onClose={() => setModalDetalle(false)}
                proveedor={detalle}
            />

            {/* MODAL IMPORTAR */}
            <ModalImportar
                open={modalImport}
                onClose={() => setModalImport(false)}
                onDone={(n) => alert(`✅ ${n} proveedores importados`)}
            />
        </div>
    );
}