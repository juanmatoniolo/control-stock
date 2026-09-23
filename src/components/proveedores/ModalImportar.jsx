"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import Modal from "@/components/ui/Modal";
import { importarProveedores } from "@/lib/proveedores";

function normalizar(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

const MAPA = {
    proveedor: "proveedor",
    cuit: "cuit",
    situacion: "situacion",
    banco: "banco",
    cbu: "cbu",
    alias: "alias",
    email: "email",
    correo: "email",
    telefono: "telefono",
    tel: "telefono",
    direccion: "direccion",
    rubro: "rubro",
    rubroconcepto: "rubro",
    conceptorubro: "rubro",
    aliasrcel: "aliasRcel",
    rcel: "aliasRcel",
};

export default function ModalImportar({ open, onClose, onDone }) {
    const [filas, setFilas] = useState([]);
    const [headers, setHeaders] = useState([]);
    const [error, setError] = useState("");
    const [importando, setImportando] = useState(false);
    const [archivo, setArchivo] = useState("");

    function reset() {
        setFilas([]);
        setHeaders([]);
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
        setHeaders([]);
        const file = e.target.files?.[0];
        if (!file) return;
        setArchivo(file.name);

        try {
            const buffer = await file.arrayBuffer();
            const wb = XLSX.read(buffer);
            const sheet = wb.Sheets[wb.SheetNames[0]];
            const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });

            if (rows.length < 2) {
                setError("El archivo no tiene datos.");
                return;
            }

            const rawHeaders = rows[0].map((h) => String(h || "").trim());
            const mappedHeaders = rawHeaders.map((h) => MAPA[normalizar(h)] || null);

            if (!mappedHeaders.includes("proveedor")) {
                setError("No se encontró la columna PROVEEDOR en el archivo.");
                return;
            }

            const parsed = rows.slice(1)
                .filter((r) => r.some((c) => String(c || "").trim() !== ""))
                .map((row) => {
                    const obj = {};
                    mappedHeaders.forEach((key, i) => {
                        if (!key) return;
                        obj[key] = String(row[i] ?? "").trim();
                    });
                    return obj;
                })
                .filter((o) => o.proveedor);

            setHeaders(rawHeaders);
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
            await importarProveedores(filas);
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

    return (
        <Modal open={open} onClose={handleClose} title="Importar proveedores desde Excel" size="lg">
            <div className="space-y-4">
                <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50">
                    <input
                        id="file-input"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-input"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg cursor-pointer transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Elegir archivo
                    </label>
                    <p className="text-xs text-slate-500 mt-2">
                        {archivo || "Formatos: .xlsx, .xls, .csv"}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {filas.length > 0 && (
                    <>
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-slate-600">
                                <strong>{filas.length}</strong> filas detectadas
                            </p>
                            <p className="text-xs text-slate-400">Vista previa (primeras 5)</p>
                        </div>

                        <div className="border border-slate-200 rounded-lg overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600">Proveedor</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600">CUIT</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600">Rubro</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600">Teléfono</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filas.slice(0, 5).map((f, i) => (
                                        <tr key={i} className="border-t border-slate-100">
                                            <td className="px-2 py-1.5 truncate max-w-[150px]">{f.proveedor}</td>
                                            <td className="px-2 py-1.5 text-slate-500">{f.cuit || "—"}</td>
                                            <td className="px-2 py-1.5 text-slate-500 truncate max-w-[120px]">{f.rubro || "—"}</td>
                                            <td className="px-2 py-1.5 text-slate-500">{f.telefono || "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <p className="text-xs text-slate-400">
                            Los IDs se asignarán automáticamente empezando desde el último registrado.
                        </p>
                    </>
                )}

                <div className="flex flex-col sm:flex-row gap-2 sm:justify-end pt-2">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={confirmar}
                        disabled={!filas.length || importando}
                        className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 disabled:cursor-not-allowed rounded-lg transition"
                    >
                        {importando ? "Importando..." : `Importar ${filas.length} proveedores`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}