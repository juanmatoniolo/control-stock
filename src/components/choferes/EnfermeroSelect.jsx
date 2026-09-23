"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { suscribirChoferes, nombreCompleto, esEnfermero } from "@/lib/choferes";

/**
 * Selector de enfermero/a con búsqueda.
 * Solo muestra personal que puede asistir como enfermero.
 */
export default function EnfermeroSelect({
    value,
    onChange,
    soloActivos = true,
    placeholder = "Buscar enfermero/a...",
    allowFreeText = true,
}) {
    const [personal, setPersonal] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const [query, setQuery] = useState("");
    const [enfocado, setEnfocado] = useState(false);
    const wrapRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const unsub = suscribirChoferes((arr) => {
            // Solo los que pueden asistir como enfermeros
            setPersonal(arr.filter(esEnfermero));
        });
        return () => unsub();
    }, []);

    useEffect(() => {
        function onClick(e) {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) {
                setAbierto(false);
                setEnfocado(false);
            }
        }
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const disponibles = useMemo(() => {
        return soloActivos ? personal.filter((c) => c.activo !== false) : personal;
    }, [personal, soloActivos]);

    const filtrados = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return disponibles.slice(0, 30);
        return disponibles
            .filter((c) => {
                const txt = `${c.apellido || ""} ${c.nombre || ""} ${c.dni || ""} ${c.matricula || ""}`.toLowerCase();
                return txt.includes(q);
            })
            .slice(0, 30);
    }, [disponibles, query]);

    const displayValue = enfocado
        ? query
        : value?.nombre || value?.apellido
            ? nombreCompleto(value)
            : "";

    function elegir(c) {
        onChange({
            id: c.id,
            nombre: nombreCompleto(c),
            apellido: c.apellido,
            name: c.nombre,
        });
        setQuery("");
        setAbierto(false);
        setEnfocado(false);
        inputRef.current?.blur();
    }

    function limpiar() {
        onChange(null);
        setQuery("");
    }

    return (
        <div ref={wrapRef} className="relative">
            <div className="relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={displayValue}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setAbierto(true);
                        if (value) onChange(null);
                    }}
                    onFocus={() => {
                        setEnfocado(true);
                        setQuery("");
                        setAbierto(true);
                    }}
                    placeholder={placeholder}
                    className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-violet-500 focus:ring-2 focus:ring-violet-100 dark:focus:ring-violet-900/50 outline-none transition"
                />
                {value && !enfocado ? (
                    <button
                        type="button"
                        onClick={limpiar}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center rounded-md text-slate-400 dark:text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                        aria-label="Limpiar"
                    >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                ) : (
                    <svg
                        className="w-4 h-4 absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                )}
            </div>

            {abierto && (
                <div className="absolute z-30 mt-1 left-0 right-0 max-h-72 overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl">
                    {filtrados.length === 0 ? (
                        <div className="px-3 py-4 text-center">
                            {allowFreeText && query.trim() ? (
                                <button
                                    type="button"
                                    onClick={() => {
                                        onChange({ id: null, nombre: query.trim(), libre: true });
                                        setAbierto(false);
                                        setEnfocado(false);
                                    }}
                                    className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                                >
                                    Usar &quot;{query.trim()}&quot; como texto libre
                                </button>
                            ) : (
                                <p className="text-xs text-slate-400 dark:text-slate-500">
                                    {personal.length === 0
                                        ? "No hay enfermeros cargados en Personal."
                                        : soloActivos
                                            ? "No hay enfermeros activos que coincidan."
                                            : "Sin coincidencias."}
                                </p>
                            )}
                        </div>
                    ) : (
                        <ul>
                            {filtrados.map((c) => {
                                const seleccionado = value?.id === c.id;
                                const inactivo = c.activo === false;
                                return (
                                    <li key={c.id}>
                                        <button
                                            type="button"
                                            onClick={() => elegir(c)}
                                            className={`w-full text-left px-3 py-2 transition flex items-center justify-between gap-2 ${seleccionado
                                                ? "bg-violet-50 dark:bg-violet-950/40"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                        {nombreCompleto(c)}
                                                    </p>
                                                    {inactivo && (
                                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 font-medium flex-shrink-0">
                                                            BAJA
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                                    #{c.id} {c.matricula ? `· Mat. ${c.matricula}` : c.dni ? `· DNI ${c.dni}` : ""}
                                                </p>
                                            </div>
                                            {seleccionado && (
                                                <svg className="w-4 h-4 text-violet-600 dark:text-violet-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                                </svg>
                                            )}
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}