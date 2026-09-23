"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { suscribirProductos } from "@/lib/stock";

/**
 * Selector de producto con búsqueda por código, nombre o marca.
 * value: { codigo, producto, marca } | null
 * onChange: (producto | null) => void
 */
export default function ProductoSelect({
    value,
    onChange,
    placeholder = "Buscar producto por código, nombre o marca...",
    soloActivos = true,
}) {
    const [productos, setProductos] = useState([]);
    const [abierto, setAbierto] = useState(false);
    const [query, setQuery] = useState("");
    const [enfocado, setEnfocado] = useState(false);
    const wrapRef = useRef(null);
    const inputRef = useRef(null);

    useEffect(() => {
        const unsub = suscribirProductos(setProductos);
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
        return soloActivos ? productos.filter((p) => p.activo !== false) : productos;
    }, [productos, soloActivos]);

    const filtrados = useMemo(() => {
        const q = query.trim().toLowerCase();
        if (!q) return disponibles.slice(0, 30);
        return disponibles
            .filter((p) => {
                const txt = `${p.codigo || ""} ${p.producto || ""} ${p.marca || ""}`.toLowerCase();
                return txt.includes(q);
            })
            .slice(0, 30);
    }, [disponibles, query]);

    const displayValue = enfocado
        ? query
        : value?.codigo
            ? `${value.codigo} · ${value.producto}`
            : "";

    function elegir(p) {
        onChange({ codigo: p.codigo, producto: p.producto, marca: p.marca });
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
                    className="w-full px-3 py-2 pr-9 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition"
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
                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                {query.trim() ? "Sin coincidencias." : "Sin productos cargados."}
                            </p>
                        </div>
                    ) : (
                        <ul>
                            {filtrados.map((p) => {
                                const seleccionado = value?.codigo === p.codigo;
                                return (
                                    <li key={p.codigo}>
                                        <button
                                            type="button"
                                            onClick={() => elegir(p)}
                                            className={`w-full text-left px-3 py-2 transition flex items-center justify-between gap-2 ${seleccionado
                                                ? "bg-sky-50 dark:bg-sky-950/40"
                                                : "hover:bg-slate-50 dark:hover:bg-slate-800/60"
                                                }`}
                                        >
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded flex-shrink-0">
                                                        {p.codigo}
                                                    </span>
                                                    <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                                        {p.producto}
                                                    </p>
                                                </div>
                                                {p.marca && (
                                                    <p className="text-xs text-slate-400 dark:text-slate-500 truncate">
                                                        {p.marca}
                                                    </p>
                                                )}
                                            </div>
                                            {seleccionado && (
                                                <svg className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
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