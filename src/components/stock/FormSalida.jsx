"use client";

import { useMemo, useState } from "react";
import ProductoSelect from "./ProductoSelect";
import { MOVIMIENTOS_FRECUENTES } from "@/lib/stock";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

const ITEM_VACIO = {
    codigo: "",
    producto: "",
    marca: "",
    cantidad: "",
    numeroLote: "",
    vencimiento: "",
    precioUnitario: "",
    precioTotal: "",
};

export default function FormSalida({ values, onChange, esEdicion = false, mapaStock }) {
    const [itemEnEdicion, setItemEnEdicion] = useState(null); // null = no editando; { idx } = editando item existente
    const [borrador, setBorrador] = useState(ITEM_VACIO);

    const items = values.items || [];

    // Datos del producto seleccionado en el borrador
    const productoBorrador = useMemo(() => {
        if (!borrador.codigo) return null;
        return mapaStock?.[borrador.codigo] || null;
    }, [borrador.codigo, mapaStock]);

    /* ============ BORRADOR ============ */
    function onBorrador(name, value) {
        setBorrador((b) => {
            const next = { ...b, [name]: value };

            // Auto-completar cuando se elige producto
            if (name === "codigo" && value) {
                const st = mapaStock?.[value];
                if (st) {
                    next.producto = st.producto || "";
                    next.marca = st.ultimaMarca || "";
                    next.numeroLote = st.ultimoLote || "";
                    next.vencimiento = st.ultimoVencimiento || "";
                    next.precioUnitario = st.ultimoPrecioUnitario || "";
                }
            }

            // Recalcular precio total cuando cambia cantidad o precio unitario
            if (name === "cantidad" || name === "precioUnitario") {
                const cant = Number(next.cantidad) || 0;
                const pu = Number(next.precioUnitario) || 0;
                next.precioTotal = cant && pu ? (cant * pu).toFixed(2) : "";
            }

            return next;
        });
    }

    function onProductoSeleccionado(p) {
        if (!p) {
            setBorrador((b) => ({ ...b, codigo: "", producto: "" }));
            return;
        }
        onBorrador("codigo", p.codigo);
    }

    function agregarItem() {
        if (!borrador.codigo || !borrador.cantidad || Number(borrador.cantidad) <= 0) return;

        const nuevo = { ...borrador, cantidad: Number(borrador.cantidad) };
        const nuevosItems = [...items];

        if (itemEnEdicion != null) {
            nuevosItems[itemEnEdicion] = nuevo;
        } else {
            nuevosItems.push(nuevo);
        }

        onChange("items", nuevosItems);
        setBorrador(ITEM_VACIO);
        setItemEnEdicion(null);
    }

    function editarItem(idx) {
        setItemEnEdicion(idx);
        setBorrador({ ...items[idx] });
    }

    function quitarItem(idx) {
        const nuevos = items.filter((_, i) => i !== idx);
        onChange("items", nuevos);
        if (itemEnEdicion === idx) {
            setItemEnEdicion(null);
            setBorrador(ITEM_VACIO);
        }
    }

    function cancelarEdicion() {
        setItemEnEdicion(null);
        setBorrador(ITEM_VACIO);
    }

    /* ============ RESUMEN ============ */
    const totales = useMemo(() => {
        return items.reduce(
            (acc, it) => {
                acc.cantidad += Number(it.cantidad) || 0;
                acc.precio += Number(it.precioTotal) || 0;
                return acc;
            },
            { cantidad: 0, precio: 0 }
        );
    }, [items]);

    const puedeAgregar =
        borrador.codigo && Number(borrador.cantidad) > 0 && borrador.movimiento !== "__editing__";

    return (
        <div className="space-y-5">
            {/* FECHA Y MOVIMIENTO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className={labelClass}>
                        Fecha <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="date"
                        value={values.fecha ?? ""}
                        onChange={(e) => onChange("fecha", e.target.value)}
                        className={inputClass}
                        required
                    />
                </div>
                <div>
                    <label className={labelClass}>
                        Movimiento / Destino <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={values.movimiento ?? ""}
                        onChange={(e) => onChange("movimiento", e.target.value)}
                        placeholder="¿A dónde va?"
                        list="movimientos-frecuentes"
                        className={inputClass}
                        required
                    />
                    <datalist id="movimientos-frecuentes">
                        {MOVIMIENTOS_FRECUENTES.map((d) => (
                            <option key={d} value={d} />
                        ))}
                    </datalist>
                </div>
            </div>

            {/* OBSERVACIONES */}
            <div>
                <label className={labelClass}>Observaciones</label>
                <textarea
                    value={values.observaciones ?? ""}
                    onChange={(e) => onChange("observaciones", e.target.value)}
                    rows={2}
                    placeholder="Paciente, receta, DNI, notas adicionales..."
                    className={`${inputClass} resize-none`}
                />
            </div>

            {/* ============================================
          ITEMS
          ============================================ */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
                <div className="flex items-center justify-between mb-3">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Productos del egreso
                    </h4>
                    {items.length > 0 && (
                        <span className="text-xs text-slate-500 dark:text-slate-400">
                            {items.length} item{items.length === 1 ? "" : "s"} · {totales.cantidad} unidades
                        </span>
                    )}
                </div>

                {/* AGREGAR / EDITAR ITEM */}
                <div
                    className={`rounded-xl border-2 p-3 space-y-3 ${itemEnEdicion != null
                        ? "border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                        }`}
                >
                    {itemEnEdicion != null && (
                        <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-amber-700 dark:text-amber-400">
                                Editando item #{itemEnEdicion + 1}
                            </span>
                            <button
                                type="button"
                                onClick={cancelarEdicion}
                                className="text-amber-700 dark:text-amber-400 hover:underline"
                            >
                                Cancelar edición
                            </button>
                        </div>
                    )}

                    {/* PRODUCTO */}
                    <div>
                        <label className={labelClass}>Producto</label>
                        <ProductoSelect
                            value={borrador.codigo ? { codigo: borrador.codigo, producto: borrador.producto } : null}
                            onChange={onProductoSeleccionado}
                        />
                    </div>

                    {/* DATOS AUTO */}
                    {productoBorrador && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-sky-50 dark:bg-sky-950/30 rounded-lg p-2.5">
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 uppercase text-[10px] mb-0.5">Disponible</p>
                                <p className={`font-bold tabular-nums ${productoBorrador.stockActual <= 0
                                    ? "text-red-600 dark:text-red-400"
                                    : productoBorrador.stockActual <= productoBorrador.stockMinimo
                                        ? "text-amber-600 dark:text-amber-400"
                                        : "text-emerald-600 dark:text-emerald-400"
                                    }`}>
                                    {productoBorrador.stockActual}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 uppercase text-[10px] mb-0.5">Marca</p>
                                <p className="font-medium text-slate-700 dark:text-slate-300 truncate">
                                    {productoBorrador.ultimaMarca || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 uppercase text-[10px] mb-0.5">Últ. lote</p>
                                <p className="font-medium text-slate-700 dark:text-slate-300 truncate font-mono">
                                    {productoBorrador.ultimoLote || "—"}
                                </p>
                            </div>
                            <div>
                                <p className="text-slate-400 dark:text-slate-500 uppercase text-[10px] mb-0.5">Últ. precio</p>
                                <p className="font-medium text-slate-700 dark:text-slate-300 tabular-nums">
                                    {productoBorrador.ultimoPrecioUnitario
                                        ? `$${Number(productoBorrador.ultimoPrecioUnitario).toLocaleString("es-AR")}`
                                        : "—"}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CANTIDAD / LOTE / VTO / PRECIOS */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                        <div>
                            <label className={labelClass}>Cantidad</label>
                            <input
                                type="number"
                                min="1"
                                step="1"
                                value={borrador.cantidad}
                                onChange={(e) => onBorrador("cantidad", e.target.value)}
                                placeholder="0"
                                className={inputClass}
                            />
                        </div>
                        <div className="col-span-1">
                            <label className={labelClass}>
                                Nº lote <span className="text-slate-400 text-[10px]">(opc.)</span>
                            </label>
                            <input
                                type="text"
                                value={borrador.numeroLote}
                                onChange={(e) => onBorrador("numeroLote", e.target.value)}
                                placeholder="—"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>
                                Vto <span className="text-slate-400 text-[10px]">(opc.)</span>
                            </label>
                            <input
                                type="date"
                                value={borrador.vencimiento}
                                onChange={(e) => onBorrador("vencimiento", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>P. unit.</label>
                            <input
                                type="number"
                                step="0.01"
                                value={borrador.precioUnitario}
                                onChange={(e) => onBorrador("precioUnitario", e.target.value)}
                                placeholder="0.00"
                                className={inputClass}
                            />
                        </div>
                        <div>
                            <label className={labelClass}>P. total</label>
                            <input
                                type="number"
                                step="0.01"
                                value={borrador.precioTotal}
                                readOnly
                                placeholder="0.00"
                                className={`${inputClass} bg-slate-100 dark:bg-slate-800/60 cursor-not-allowed text-sky-600 dark:text-sky-400 font-semibold`}
                            />
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={agregarItem}
                        disabled={!puedeAgregar}
                        className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition ${puedeAgregar
                            ? "bg-sky-600 hover:bg-sky-700 text-white"
                            : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        {itemEnEdicion != null ? "Guardar cambios del item" : "Agregar producto"}
                    </button>
                </div>

                {/* LISTA DE ITEMS */}
                {items.length > 0 && (
                    <div className="mt-3 space-y-2">
                        {items.map((it, idx) => (
                            <div
                                key={idx}
                                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-3"
                            >
                                <div className="flex items-start justify-between gap-2 mb-1.5">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-900 text-slate-500 dark:text-slate-400 rounded">
                                                {it.codigo}
                                            </span>
                                            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
                                                {it.producto}
                                            </span>
                                        </div>
                                        {it.marca && (
                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                                                {it.marca}
                                                {it.numeroLote && ` · Lote ${it.numeroLote}`}
                                            </p>
                                        )}
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-lg font-bold text-red-600 dark:text-red-400 tabular-nums leading-none">
                                            −{it.cantidad}
                                        </p>
                                        {it.precioUnitario > 0 && (
                                            <p className="text-[10px] text-slate-500 dark:text-slate-400 tabular-nums">
                                                ${Number(it.precioUnitario).toLocaleString("es-AR")} c/u
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center justify-between gap-2">
                                    {it.precioTotal > 0 && (
                                        <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                                            Subtotal: <strong className="text-slate-700 dark:text-slate-300">
                                                ${Number(it.precioTotal).toLocaleString("es-AR")}
                                            </strong>
                                        </span>
                                    )}
                                    <div className="flex gap-1 ml-auto">
                                        <button
                                            type="button"
                                            onClick={() => editarItem(idx)}
                                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                            title="Editar"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => quitarItem(idx)}
                                            className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition"
                                            title="Quitar"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {/* TOTALES */}
                        <div className="bg-gradient-to-br from-slate-900 to-slate-800 dark:from-slate-900 dark:to-slate-950 rounded-lg p-3 flex items-center justify-between text-white">
                            <div>
                                <p className="text-[10px] uppercase tracking-wider opacity-70 font-medium">Total egreso</p>
                                <p className="text-sm opacity-90">
                                    {totales.cantidad} unidad{totales.cantidad === 1 ? "" : "es"} en {items.length} producto{items.length === 1 ? "" : "s"}
                                </p>
                            </div>
                            {totales.precio > 0 && (
                                <p className="text-2xl font-bold tabular-nums">
                                    ${totales.precio.toLocaleString("es-AR", { maximumFractionDigits: 2 })}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* FIRMA */}
            <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-lg p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-sm font-bold uppercase text-white flex-shrink-0">
                    {values.usuarioNombre?.[0] || "?"}
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-wider text-sky-700 dark:text-sky-400 font-semibold">
                        Firma del egreso
                    </p>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {values.usuarioNombre || "—"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Se guarda automáticamente con tu usuario
                    </p>
                </div>
            </div>
        </div>
    );
}