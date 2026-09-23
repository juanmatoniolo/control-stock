"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";
import { mostrarFecha } from "@/lib/combustible";
import {
    parsearExcelFacturas,
    importarFacturasPago,
    descargarPlantilla,
    formatMoneda,
} from "@/lib/facturas-pago";

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
            const parsed = parsearExcelFacturas(buf);

            if (!parsed.length) {
                setError(
                    "No se detectaron facturas válidas.\n\n" +
                    "Verificá que la primera fila tenga headers: FECHA · PROVEEDOR · Nº FACTURA · MONTO · ESTADO DE PAGO"
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
            const n = await importarFacturasPago(preview);
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

    const totalMonto = preview.reduce((s, f) => s + (Number(f.monto) || 0), 0);
    const totalPendiente = preview
        .filter((f) => f.estadoPago === "pendiente")
        .reduce((s, f) => s + (Number(f.monto) || 0), 0);
    const totalPago = preview
        .filter((f) => f.estadoPago === "pago")
        .reduce((s, f) => s + (Number(f.monto) || 0), 0);

    return (
        <Modal open={open} onClose={handleClose} title="Importar facturas desde Excel" size="lg">
            <div className="space-y-4">
                {/* DROPZONE */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-800/50">
                    <input
                        id="file-facturas-pago"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-facturas-pago"
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
                        Columnas: FECHA · PROVEEDOR · Nº FACTURA · MONTO · ESTADO DE PAGO · FECHA DE PAGO · NOTAS
                    </p>
                    <button
                        type="button"
                        onClick={descargarPlantilla}
                        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-sky-600 dark:text-sky-400 hover:underline"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        ¿No tenés el formato? Descargá la plantilla
                    </button>
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
                                <p className="text-xs uppercase text-sky-700 dark:text-sky-400 font-medium">Facturas</p>
                                <p className="text-2xl font-bold text-sky-700 dark:text-sky-400 tabular-nums">{preview.length}</p>
                            </div>
                            <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-emerald-700 dark:text-emerald-400 font-medium">Pagadas</p>
                                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                                    {formatMoneda(totalPago)}
                                </p>
                            </div>
                            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-lg p-3 text-center">
                                <p className="text-xs uppercase text-amber-700 dark:text-amber-400 font-medium">Pendientes</p>
                                <p className="text-lg font-bold text-amber-700 dark:text-amber-400 tabular-nums">
                                    {formatMoneda(totalPendiente)}
                                </p>
                            </div>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-80">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Proveedor</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Nº Fact.</th>
                                        <th className="px-2 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Monto</th>
                                        <th className="px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Estado</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {preview.slice(0, 10).map((f, i) => (
                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
                                            <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                {mostrarFecha(f.fecha)}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 truncate max-w-[180px]">
                                                {f.proveedor}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[140px] font-mono">
                                                {f.numeroFactura || "—"}
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-slate-700 dark:text-slate-300 tabular-nums">
                                                {formatMoneda(f.monto)}
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                <span
                                                    className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${f.estadoPago === "pago"
                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                        : "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                                        }`}
                                                >
                                                    {f.estadoPago === "pago" ? "Pago" : "Pendiente"}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {preview.length > 10 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                … y {preview.length - 10} más
                            </p>
                        )}

                        <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-3 flex items-center justify-between">
                            <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">
                                Total a importar
                            </span>
                            <span className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {formatMoneda(totalMonto)}
                            </span>
                        </div>
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
                        {importando
                            ? "Importando..."
                            : `Importar ${preview.length} factura${preview.length === 1 ? "" : "s"}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}