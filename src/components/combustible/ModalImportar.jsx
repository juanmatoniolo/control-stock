"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import Modal from "@/components/ui/Modal";
import { importarCargas, normalizarFecha, normalizarHora, mostrarFecha } from "@/lib/combustible";

/* ============================================
   MAPEO DE HEADERS (normalizado)
   ============================================ */
function normalizar(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

const MAPA = {
    fechadecarga: "fecha",
    fecha: "fecha",
    dia: "fecha",
    hora: "hora",
    numeroderemito: "numeroRemito",
    numeroremoto: "numeroRemito",
    remito: "numeroRemito",
    nremito: "numeroRemito",
    nroremito: "numeroRemito",
    litroscargados: "litros",
    litros: "litros",
    cantidad: "litros",
    chofer: "chofer",
    conductor: "chofer",
};

export default function ModalImportar({ open, onClose, onDone }) {
    const [filas, setFilas] = useState([]);
    const [error, setError] = useState("");
    const [importando, setImportando] = useState(false);
    const [archivo, setArchivo] = useState("");

    function reset() {
        setFilas([]);
        setError("");
        setArchivo("");
    }

    function handleClose() {
        reset();
        onClose();
    }

    async function handleFile(e) {
        setError("");
        setFilas([]);
        const file = e.target.files?.[0];
        if (!file) return;
        setArchivo(file.name);

        try {
            const buffer = await file.arrayBuffer();
            // cellDates: true → fechas como Date object
            const wb = XLSX.read(buffer, { cellDates: true });
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, {
                header: 1,
                defval: "",
                raw: false,
                dateNF: "dd/mm/yyyy",
            });

            if (rows.length < 2) {
                setError("El archivo no tiene datos.");
                return;
            }

            const rawHeaders = rows[0].map((h) => String(h || "").trim());
            const mappedHeaders = rawHeaders.map((h) => MAPA[normalizar(h)] || null);

            if (!mappedHeaders.includes("fecha")) {
                setError("No se encontró la columna 'Fecha de Carga'.");
                return;
            }

            const parsed = rows
                .slice(1)
                .filter((r) => r.some((c) => String(c || "").trim() !== ""))
                .map((row) => {
                    const obj = {};
                    mappedHeaders.forEach((key, i) => {
                        if (!key) return;
                        obj[key] = row[i];
                    });
                    // Normalizar fecha y hora
                    if (obj.fecha) obj.fecha = normalizarFecha(obj.fecha);
                    if (obj.hora) obj.hora = normalizarHora(obj.hora);
                    // Normalizar litros
                    if (obj.litros != null) {
                        const n = Number(String(obj.litros).replace(",", "."));
                        obj.litros = isNaN(n) ? 0 : n;
                    }
                    // Trim strings
                    ["numeroRemito", "chofer"].forEach((k) => {
                        if (obj[k] != null) obj[k] = String(obj[k]).trim();
                    });
                    return obj;
                })
                .filter((o) => o.fecha);

            if (!parsed.length) {
                setError("No se encontraron filas válidas con fecha.");
                return;
            }

            setFilas(parsed);
        } catch (err) {
            console.error(err);
            setError("No se pudo leer el archivo. ¿Es un .xlsx o .xls válido?");
        }
    }

    async function confirmar() {
        if (!filas.length) return;
        setImportando(true);
        try {
            await importarCargas(filas);
            onDone?.(filas.length);
            reset();
            onClose();
        } catch (err) {
            console.error(err);
            setError("Error al importar. Revisá la consola.");
        } finally {
            setImportando(false);
        }
    }

    const totalLitros = filas.reduce((s, f) => s + (Number(f.litros) || 0), 0);

    return (
        <Modal open={open} onClose={handleClose} title="Importar remitos de combustible" size="lg">
            <div className="space-y-4">
                {/* DROPZONE */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-800/50">
                    <input
                        id="file-combustible"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-combustible"
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
                        Columnas esperadas: Fecha de Carga · Hora · Número de Remito · Litros Cargados · Chofer
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {filas.length > 0 && (
                    <>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
                            <p className="text-slate-600 dark:text-slate-400">
                                <strong>{filas.length}</strong> filas detectadas
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                                Total: <strong>{totalLitros.toFixed(2)} L</strong>
                            </p>
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Hora</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">N° Remito</th>
                                        <th className="px-2 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Litros</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Chofer</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filas.slice(0, 5).map((f, i) => (
                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
                                            <td className="px-2 py-1.5 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {mostrarFecha(f.fecha) || "—"}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400">{f.hora || "—"}</td>
                                            <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                                {f.numeroRemito || "—"}
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-slate-700 dark:text-slate-300 font-mono">
                                                {Number(f.litros || 0).toFixed(2)}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[140px]">
                                                {f.chofer || "—"}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filas.length > 5 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                … y {filas.length - 5} fila{filas.length - 5 === 1 ? "" : "s"} más
                            </p>
                        )}

                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Los IDs se asignarán automáticamente empezando desde el último registrado.
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
                        disabled={!filas.length || importando}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900 disabled:cursor-not-allowed rounded-lg transition"
                    >
                        {importando ? "Importando..." : `Importar ${filas.length} carga${filas.length === 1 ? "" : "s"}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}