"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { parsearExcelStock, importarExcelStock } from "@/lib/stock";
import { mostrarFecha } from "@/lib/combustible";

export default function ModalImportar({ open, onClose, onDone }) {
    const [preview, setPreview] = useState(null); // { productos, movimientos }
    const [error, setError] = useState("");
    const [importando, setImportando] = useState(false);
    const [archivo, setArchivo] = useState("");
    const [buffer, setBuffer] = useState(null);
    const [crearFaltantes, setCrearFaltantes] = useState(true);

    function reset() {
        setPreview(null);
        setError("");
        setArchivo("");
        setBuffer(null);
    }

    function handleClose() {
        reset();
        onClose();
    }

    async function handleFile(e) {
        setError("");
        setPreview(null);
        const file = e.target.files?.[0];
        if (!file) return;
        setArchivo(file.name);

        try {
            const buf = await file.arrayBuffer();
            const parsed = parsearExcelStock(buf);

            if (!parsed.productos.length && !parsed.movimientos.length) {
                setError("No se detectaron hojas de PRODUCTOS, ENTRADAS o SALIDAS.");
                return;
            }

            setBuffer(buf);
            setPreview(parsed);
        } catch (err) {
            console.error(err);
            setError("No se pudo leer el archivo.");
        }
    }

    async function confirmar() {
        if (!buffer) return;
        setImportando(true);
        try {
            const res = await importarExcelStock(buffer, {
                crearProductosFaltantes: crearFaltantes,
            });
            onDone?.(res);
            reset();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Error al importar. Revisá la consola.");
        } finally {
            setImportando(false);
        }
    }

    const totalEntradas = preview?.movimientos.filter((m) => m.tipo === "entrada").length || 0;
    const totalSalidas = preview?.movimientos.filter((m) => m.tipo === "salida").length || 0;

    return (
        <Modal open={open} onClose={handleClose} title="Importar stock desde Excel" size="lg">
            <div className="space-y-4">
                {/* DROPZONE */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-800/50">
                    <input
                        id="file-stock"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-stock"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg cursor-pointer transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Elegir archivo Excel
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {archivo || "Formatos: .xlsx, .xls, .csv"}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Detecta automáticamente las hojas PRODUCTOS, ENTRADAS y SALIDAS
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {preview && (
                    <>
                        {/* RESUMEN */}
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-sky-50 dark:bg-sky-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-sky-700 dark:text-sky-400 font-medium">Productos</p>
                                <p className="text-2xl font-bold text-sky-700 dark:text-sky-400 tabular-nums">
                                    {preview.productos.length}
                                </p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-emerald-700 dark:text-emerald-400 font-medium">Entradas</p>
                                <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                    {totalEntradas}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-red-700 dark:text-red-400 font-medium">Salidas</p>
                                <p className="text-2xl font-bold text-red-700 dark:text-red-400 tabular-nums">
                                    {totalSalidas}
                                </p>
                            </div>
                        </div>

                        {/* VISTA PREVIA PRODUCTOS */}
                        {preview.productos.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Muestra de productos ({preview.productos.length})
                                </p>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-40">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Código</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Producto</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Marca</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.productos.slice(0, 5).map((p, i) => (
                                                <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
                                                    <td className="px-2 py-1.5 font-mono text-slate-700 dark:text-slate-300">{p.codigo}</td>
                                                    <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 truncate max-w-[200px]">{p.producto}</td>
                                                    <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">{p.marca || "—"}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* VISTA PREVIA MOVIMIENTOS */}
                        {preview.movimientos.length > 0 && (
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                                    Muestra de movimientos ({preview.movimientos.length})
                                </p>
                                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-40">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                            <tr>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Tipo</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Fecha</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Código</th>
                                                <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Producto</th>
                                                <th className="px-2 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Cant.</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {preview.movimientos.slice(0, 5).map((m, i) => (
                                                <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
                                                    <td className="px-2 py-1.5">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${m.tipo === "entrada"
                                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                                            }`}>
                                                            {m.tipo === "entrada" ? "ENT" : "SAL"}
                                                        </span>
                                                    </td>
                                                    <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">{mostrarFecha(m.fecha)}</td>
                                                    <td className="px-2 py-1.5 font-mono text-slate-700 dark:text-slate-300">{m.codigo}</td>
                                                    <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">{m.producto}</td>
                                                    <td className="px-2 py-1.5 text-right text-slate-700 dark:text-slate-300 tabular-nums">{m.cantidad}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* OPCIÓN */}
                        <label className="flex items-start gap-2 cursor-pointer select-none p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                            <input
                                type="checkbox"
                                checked={crearFaltantes}
                                onChange={(e) => setCrearFaltantes(e.target.checked)}
                                className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
                            />
                            <div>
                                <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                                    Crear productos huérfanos
                                </p>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Si hay movimientos con códigos que no están en la hoja PRODUCTOS, se crean automáticamente.
                                </p>
                            </div>
                        </label>
                    </>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmar}
                        disabled={!preview || importando}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900 disabled:cursor-not-allowed rounded-lg transition"
                    >
                        {importando ? "Importando..." : "Confirmar importación"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}