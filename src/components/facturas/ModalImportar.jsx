"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { parsearExcelFacturas, importarFacturas } from "@/lib/facturas";
import { mostrarFecha } from "@/lib/combustible";

export default function ModalImportar({ open, onClose, onDone }) {
    const [preview, setPreview] = useState([]);
    const [error, setError] = useState("");
    const [importando, setImportando] = useState(false);
    const [archivo, setArchivo] = useState("");
    const [buffer, setBuffer] = useState(null);

    function reset() {
        setPreview([]);
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
        setPreview([]);
        const file = e.target.files?.[0];
        if (!file) return;
        setArchivo(file.name);

        try {
            const buf = await file.arrayBuffer();
            const XLSX = await import("xlsx");
            const wb = XLSX.read(buf, { cellDates: true });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
                raw: false,
                dateNF: "dd/mm/yyyy",
            });

            console.log("=== DEBUG IMPORT FACTURAS ===");
            console.log("Headers (fila 1):", rows[0]);
            console.log("Primeras 5 filas:", rows.slice(0, 5));

            const parsed = parsearExcelFacturas(buf);
            console.log("Filas parseadas:", parsed);

            if (!parsed.length) {
                setError(
                    "No se detectaron filas válidas.\n\n" +
                    "Verificá:\n" +
                    "1. La primera fila debe tener un header que diga FECHA\n" +
                    "2. Las fechas deben estar como 01/01/2026 o como fecha nativa de Excel\n" +
                    "3. Los datos deben empezar en la fila 2 (sin filas vacías arriba)\n\n" +
                    "Abrí la consola (F12) para ver los headers detectados."
                );
                return;
            }

            setBuffer(buf);
            setPreview(parsed);
        } catch (err) {
            console.error(err);
            setError("No se pudo leer el archivo. " + err.message);
        }
    }

    async function confirmar() {
        if (!preview.length) return;
        setImportando(true);
        try {
            const n = await importarFacturas(preview);
            onDone?.(n);
            reset();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Error al importar. Revisá la consola.");
        } finally {
            setImportando(false);
        }
    }

    const totalIng = preview.reduce((s, f) => s + (Number(f.ingresos) || 0), 0);
    const totalEgr = preview.reduce((s, f) => s + (Number(f.egresos) || 0), 0);

    return (
        <Modal open={open} onClose={handleClose} title="Importar libro contable desde Excel" size="lg">
            <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-800/50">
                    <input
                        id="file-facturas"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-facturas"
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
                        Columnas: FECHA · CONCEPTO · COMPROBANTE · PROVEEDOR · INGRESOS · EGRESOS · CATEGORÍA FEDERACIÓN
                    </p>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 italic">
                        También acepta DEBITOS / CREDITOS del formato viejo
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2 whitespace-pre-line">
                        {error}
                    </div>
                )}

                {preview.length > 0 && (
                    <>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="bg-sky-50 dark:bg-sky-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-sky-700 dark:text-sky-400 font-medium">Filas</p>
                                <p className="text-2xl font-bold text-sky-700 dark:text-sky-400 tabular-nums">{preview.length}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-emerald-700 dark:text-emerald-400 font-medium">Ingresos</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                    ${totalIng.toLocaleString("es-AR")}
                                </p>
                            </div>
                            <div className="bg-red-50 dark:bg-red-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-red-700 dark:text-red-400 font-medium">Egresos</p>
                                <p className="text-lg font-bold text-red-700 dark:text-red-400 tabular-nums">
                                    ${totalEgr.toLocaleString("es-AR")}
                                </p>
                            </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-80">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Concepto</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Proveedor</th>
                                        <th className="px-2 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Ingresos</th>
                                        <th className="px-2 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Egresos</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 10).map((f, i) => (
                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
                                            <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {mostrarFecha(f.fecha)}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                                                {f.concepto}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                                {f.proveedor || "—"}
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-emerald-600 dark:text-emerald-400 tabular-nums">
                                                {f.ingresos ? `$${Number(f.ingresos).toLocaleString("es-AR")}` : "—"}
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-red-600 dark:text-red-400 tabular-nums">
                                                {f.egresos ? `$${Number(f.egresos).toLocaleString("es-AR")}` : "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {preview.length > 10 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">… y {preview.length - 10} más</p>
                        )}

                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            La columna <strong>Saldo</strong> se recalcula automáticamente y se ignora la del Excel.
                        </p>
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
                        disabled={!preview.length || importando}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900 disabled:cursor-not-allowed rounded-lg transition"
                    >
                        {importando ? "Importando..." : `Importar ${preview.length} movimiento${preview.length === 1 ? "" : "s"}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}