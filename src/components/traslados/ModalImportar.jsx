"use client";

import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Modal from "@/components/ui/Modal";
import { importarTraslados } from "@/lib/traslados";
import { normalizarFecha, normalizarHora, mostrarFecha } from "@/lib/combustible";
import { suscribirChoferes, nombreCompleto } from "@/lib/choferes";

function normalizar(str) {
    return String(str || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/g, "");
}

const MAPA = {
    fecha: "fecha",
    horasalida: "horaSalida",
    hora: "horaSalida",
    kmi: "kmInicial",
    kminicial: "kmInicial",
    kmf: "kmFinal",
    kmfinal: "kmFinal",
    inicio: "inicio",
    origen: "inicio",
    final: "final",
    destino: "final",
    combustible: "combustibleRaw",
    combustiblelt: "combustibleRaw",
    combustiblelts: "combustibleRaw",
    combustibleltss: "combustibleRaw",
    combustibleprecio: "combustiblePrecio",
    chofer: "choferRaw",
    enfermero: "enfermero",
    enfermera: "enfermero",
    paciente: "paciente",
    motivo: "motivo",
};

function parsearCombustible(str) {
    if (!str) return { litros: 0, precio: 0 };
    const s = String(str);
    const m = s.split("/").map((p) => p.trim());
    if (m.length === 2) {
        const l = Number(m[0].replace(",", ".").replace(/[^\d.]/g, ""));
        const p = Number(m[1].replace(",", ".").replace(/[^\d.]/g, ""));
        return { litros: isNaN(l) ? 0 : l, precio: isNaN(p) ? 0 : p };
    }
    const num = Number(s.replace(",", ".").replace(/[^\d.]/g, ""));
    if (isNaN(num)) return { litros: 0, precio: 0 };
    if (s.includes("$") || num > 500) return { litros: 0, precio: num };
    return { litros: num, precio: 0 };
}

export default function ModalImportar({ open, onClose, onDone }) {
    const [filas, setFilas] = useState([]);
    const [error, setError] = useState("");
    const [importando, setImportando] = useState(false);
    const [archivo, setArchivo] = useState("");
    const [choferes, setChoferes] = useState([]);

    useEffect(() => {
        const unsub = suscribirChoferes(setChoferes);
        return () => unsub();
    }, []);

    function reset() {
        setFilas([]);
        setError("");
        setArchivo("");
    }

    function handleClose() {
        reset();
        onClose();
    }

    function matchChofer(texto) {
        if (!texto) return null;
        const q = normalizar(texto);
        if (!q) return null;
        for (const c of choferes) {
            const full = normalizar(nombreCompleto(c));
            const ape = normalizar(c.apellido);
            const nom = normalizar(c.nombre);
            const combos = [full, `${ape}${nom}`, `${nom}${ape}`, ape];
            if (combos.includes(q)) return c;
        }
        for (const c of choferes) {
            const full = normalizar(nombreCompleto(c));
            if (full.includes(q) || q.includes(normalizar(c.apellido))) return c;
        }
        return null;
    }

    async function handleFile(e) {
        setError("");
        setFilas([]);
        const file = e.target.files?.[0];
        if (!file) return;
        setArchivo(file.name);

        try {
            const buffer = await file.arrayBuffer();
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
                setError("No se encontró la columna 'Fecha'.");
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

                    obj.fecha = normalizarFecha(obj.fecha);
                    if (obj.horaSalida) obj.horaSalida = normalizarHora(obj.horaSalida);

                    let litros = Number(obj.combustibleLitros) || 0;
                    let precio = Number(obj.combustiblePrecio) || 0;
                    if (obj.combustibleRaw) {
                        const par = parsearCombustible(obj.combustibleRaw);
                        if (par.litros) litros = par.litros;
                        if (par.precio) precio = par.precio;
                    }

                    const choferTexto = String(obj.choferRaw || "").trim();
                    const match = matchChofer(choferTexto);

                    return {
                        fecha: obj.fecha,
                        horaSalida: obj.horaSalida || "",
                        horaLlegada: "",
                        kmInicial: Number(obj.kmInicial) || 0,
                        kmFinal: Number(obj.kmFinal) || 0,
                        inicio: String(obj.inicio || "").trim(),
                        final: String(obj.final || "").trim(),
                        combustibleLitros: litros,
                        combustiblePrecio: precio,
                        choferId: match?.id ?? null,
                        choferNombre: match ? nombreCompleto(match) : choferTexto,
                        enfermero: String(obj.enfermero || "").trim(),
                        paciente: String(obj.paciente || "").trim(),
                        motivo: String(obj.motivo || "").trim(),
                        _match: match ? "ok" : choferTexto ? "manual" : "vacio",
                    };
                })
                .filter((o) => o.fecha);

            if (!parsed.length) {
                setError("No se encontraron filas válidas.");
                return;
            }

            setFilas(parsed);
        } catch (err) {
            console.error(err);
            setError("No se pudo leer el archivo.");
        }
    }

    async function confirmar() {
        if (!filas.length) return;
        setImportando(true);
        try {
            const limpias = filas.map(({ _match, ...rest }) => rest);
            await importarTraslados(limpias);
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

    const conMatch = filas.filter((f) => f._match === "ok").length;

    return (
        <Modal open={open} onClose={handleClose} title="Importar traslados" size="lg">
            <div className="space-y-4">
                {/* DROPZONE */}
                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-5 text-center bg-slate-50 dark:bg-slate-800/50">
                    <input
                        id="file-traslados"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFile}
                        className="hidden"
                    />
                    <label
                        htmlFor="file-traslados"
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-sm font-medium rounded-lg cursor-pointer transition"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Elegir archivo
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        {archivo || "Formatos: .xlsx, .xls, .csv"}
                    </p>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
                        Columnas: Fecha · Hora Salida · KM Inicial · KM Final · Inicio · Final · Combustible (Lts/$) · Chofer · Enfermero · Paciente · Motivo
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-400 text-sm rounded-lg px-3 py-2">
                        {error}
                    </div>
                )}

                {filas.length > 0 && (
                    <>
                        <div className="flex flex-wrap items-center gap-3 text-sm">
                            <span className="text-slate-600 dark:text-slate-400">
                                <strong>{filas.length}</strong> filas
                            </span>
                            {conMatch > 0 && (
                                <span className="text-emerald-600 dark:text-emerald-400">
                                    ✓ {conMatch} chofer{conMatch === 1 ? "" : "es"} vinculado{conMatch === 1 ? "" : "s"}
                                </span>
                            )}
                            {filas.length - conMatch > 0 && (
                                <span className="text-amber-600 dark:text-amber-400">
                                    ⚠ {filas.length - conMatch} sin vincular
                                </span>
                            )}
                        </div>

                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-x-auto max-h-80">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">Fecha</th>
                                        <th className="px-2 py-2 text-right font-medium text-slate-600 dark:text-slate-400">KM</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Ruta</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Chofer</th>
                                        <th className="px-2 py-2 text-center font-medium text-slate-600 dark:text-slate-400">Match</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filas.slice(0, 10).map((f, i) => (
                                        <tr key={i} className="border-t border-slate-100 dark:border-slate-800/60">
                                            <td className="px-2 py-1.5 text-slate-800 dark:text-slate-200 whitespace-nowrap">
                                                {mostrarFecha(f.fecha)}
                                            </td>
                                            <td className="px-2 py-1.5 text-right text-slate-600 dark:text-slate-400 tabular-nums">
                                                {Math.max(0, (f.kmFinal || 0) - (f.kmInicial || 0))}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[180px]">
                                                {f.inicio || "—"} → {f.final || "—"}
                                            </td>
                                            <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                                                {f.choferNombre || "—"}
                                            </td>
                                            <td className="px-2 py-1.5 text-center">
                                                {f._match === "ok" ? (
                                                    <span className="text-emerald-600 dark:text-emerald-400">✓</span>
                                                ) : f._match === "manual" ? (
                                                    <span className="text-amber-600 dark:text-amber-400">⚠</span>
                                                ) : (
                                                    <span className="text-slate-300 dark:text-slate-600">—</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {filas.length > 10 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                … y {filas.length - 10} más
                            </p>
                        )}

                        <p className="text-xs text-slate-400 dark:text-slate-500">
                            Los choferes con ⚠ no se encontraron en tu lista. Se guardarán como texto libre.
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
                        {importando ? "Importando..." : `Importar ${filas.length}`}
                    </button>
                </div>
            </div>
        </Modal>
    );
}