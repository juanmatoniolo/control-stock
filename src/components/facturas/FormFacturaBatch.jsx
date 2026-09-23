"use client";

import { useMemo, useState } from "react";
import MonedaInput from "@/components/ui/MonedaInput";
import { CATEGORIAS, ASIENTO_VACIO_BATCH, formatInputMoneda } from "@/lib/facturas";

const inputClass =
    "w-full px-2.5 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition";

const labelClass =
    "block text-[10px] font-medium text-slate-500 dark:text-slate-400 mb-0.5 uppercase tracking-wider";

export default function FormFacturaBatch({ asientos, onChange, proveedores = [] }) {
    const [borrador, setBorrador] = useState(ASIENTO_VACIO_BATCH);
    const [itemEnEdicion, setItemEnEdicion] = useState(null);

    const totales = useMemo(() => {
        return asientos.reduce(
            (acc, a) => {
                acc.ingresos += Number(a.ingresos) || 0;
                acc.egresos += Number(a.egresos) || 0;
                return acc;
            },
            { ingresos: 0, egresos: 0 }
        );
    }, [asientos]);

    const netoBorrador = (Number(borrador.ingresos) || 0) - (Number(borrador.egresos) || 0);

    function onBorrador(name, value) {
        setBorrador((b) => {
            const next = { ...b, [name]: value };
            if (name === "ingresos" && Number(value) > 0) next.egresos = "";
            if (name === "egresos" && Number(value) > 0) next.ingresos = "";
            return next;
        });
    }

    const borradorValido =
        borrador.fecha &&
        borrador.concepto?.trim() &&
        (Number(borrador.ingresos) > 0 || Number(borrador.egresos) > 0);

    function agregar() {
        if (!borradorValido) return;
        const nuevo = { ...borrador };
        const nuevos = [...asientos];

        if (itemEnEdicion != null) {
            nuevos[itemEnEdicion] = nuevo;
        } else {
            nuevos.push(nuevo);
        }

        onChange(nuevos);
        setBorrador({ ...ASIENTO_VACIO_BATCH, fecha: borrador.fecha });
        setItemEnEdicion(null);
    }

    function editar(idx) {
        setItemEnEdicion(idx);
        setBorrador({ ...asientos[idx] });
    }

    function quitar(idx) {
        const nuevos = asientos.filter((_, i) => i !== idx);
        onChange(nuevos);
        if (itemEnEdicion === idx) {
            setItemEnEdicion(null);
            setBorrador(ASIENTO_VACIO_BATCH);
        }
    }

    function cancelarEdicion() {
        setItemEnEdicion(null);
        setBorrador(ASIENTO_VACIO_BATCH);
    }

    return (
        <div className="space-y-4">
            {/* INFO */}
            <div className="bg-sky-50 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-900 rounded-lg p-3 flex items-start gap-2">
                <svg className="w-4 h-4 text-sky-600 dark:text-sky-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="text-[11px] text-sky-800 dark:text-sky-300">
                    <p className="font-semibold mb-0.5">Carga múltiple</p>
                    <p>Cada movimiento que agregues se guardará como <strong>asiento contable independiente</strong> con su propio ID y saldo corrido.</p>
                </div>
            </div>

            {/* BORRADOR */}
            <div
                className={`rounded-xl border-2 p-3 space-y-2.5 ${itemEnEdicion != null
                    ? "border-amber-400 dark:border-amber-600 bg-amber-50/50 dark:bg-amber-950/20"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20"
                    }`}
            >
                {itemEnEdicion != null && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-medium text-amber-700 dark:text-amber-400">
                            Editando asiento #{itemEnEdicion + 1}
                        </span>
                        <button
                            type="button"
                            onClick={cancelarEdicion}
                            className="text-amber-700 dark:text-amber-400 hover:underline text-[11px]"
                        >
                            Cancelar edición
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={labelClass}>Fecha (dd/mm/aaaa) *</label>
                        <input
                            type="date"
                            value={borrador.fecha}
                            onChange={(e) => onBorrador("fecha", e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Comprobante</label>
                        <input
                            type="text"
                            value={borrador.comprobante}
                            onChange={(e) => onBorrador("comprobante", e.target.value)}
                            placeholder="Fact nº ..."
                            className={inputClass}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Concepto *</label>
                    <input
                        type="text"
                        value={borrador.concepto}
                        onChange={(e) => onBorrador("concepto", e.target.value)}
                        placeholder="Ej: Insumos médicos y de enfermería"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Proveedor</label>
                    <input
                        type="text"
                        value={borrador.proveedor}
                        onChange={(e) => onBorrador("proveedor", e.target.value)}
                        placeholder="Tipeá para autocompletar..."
                        list="proveedores-batch"
                        className={inputClass}
                        autoComplete="off"
                    />
                    <datalist id="proveedores-batch">
                        {proveedores.map((p) => (
                            <option key={p} value={p} />
                        ))}
                    </datalist>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className={labelClass}>Ingresos (créditos)</label>
                        <MonedaInput
                            value={borrador.ingresos}
                            onChange={(v) => onBorrador("ingresos", v)}
                            placeholder="0,00"
                            colorClass="text-emerald-600 dark:text-emerald-400 font-semibold"
                            className={inputClass.replace("text-slate-900 dark:text-slate-100", "")}
                        />
                    </div>
                    <div>
                        <label className={labelClass}>Egresos (débitos)</label>
                        <MonedaInput
                            value={borrador.egresos}
                            onChange={(v) => onBorrador("egresos", v)}
                            placeholder="0,00"
                            colorClass="text-red-600 dark:text-red-400 font-semibold"
                            className={inputClass.replace("text-slate-900 dark:text-slate-100", "")}
                        />
                    </div>
                </div>

                <div>
                    <label className={labelClass}>Categoría Federación</label>
                    <select
                        value={borrador.categoria}
                        onChange={(e) => onBorrador("categoria", e.target.value)}
                        className={inputClass}
                    >
                        {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>
                                {c.length > 70 ? c.slice(0, 67) + "..." : c}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className={labelClass}>Notas</label>
                    <input
                        type="text"
                        value={borrador.notas}
                        onChange={(e) => onBorrador("notas", e.target.value)}
                        placeholder="Observaciones..."
                        className={inputClass}
                    />
                </div>

                {(Number(borrador.ingresos) > 0 || Number(borrador.egresos) > 0) && (
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                        Movimiento del asiento:{" "}
                        <strong
                            className={
                                netoBorrador >= 0
                                    ? "text-emerald-600 dark:text-emerald-400"
                                    : "text-red-600 dark:text-red-400"
                            }
                        >
                            {netoBorrador >= 0 ? "+" : ""}
                            {formatInputMoneda(netoBorrador)}
                        </strong>
                    </div>
                )}

                <button
                    type="button"
                    onClick={agregar}
                    disabled={!borradorValido}
                    className={`w-full flex items-center justify-center gap-2 py-2.5 text-sm font-medium rounded-lg transition ${borradorValido
                        ? "bg-sky-600 hover:bg-sky-700 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                        }`}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    </svg>
                    {itemEnEdicion != null ? "Guardar cambios del asiento" : "Agregar asiento a la lista"}
                </button>
            </div>

            {/* LISTA */}
            {asientos.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                            Asientos a registrar ({asientos.length})
                        </span>
                        <span className="text-slate-400 dark:text-slate-500">Se guardarán por separado</span>
                    </div>

                    {asientos.map((a, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-2.5">
                            <div className="flex items-start gap-2">
                                <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-[10px] font-bold text-slate-500 dark:text-slate-400 flex-shrink-0">
                                    {idx + 1}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                                            {a.fecha}
                                        </span>
                                        {a.comprobante && (
                                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                                                {a.comprobante}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate mt-0.5">
                                        {a.concepto}
                                    </p>
                                    {a.proveedor && (
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                                            {a.proveedor}
                                        </p>
                                    )}
                                </div>
                                <div className="text-right flex-shrink-0">
                                    {Number(a.ingresos) > 0 && (
                                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                            +{formatInputMoneda(a.ingresos)}
                                        </p>
                                    )}
                                    {Number(a.egresos) > 0 && (
                                        <p className="text-xs font-bold text-red-600 dark:text-red-400 tabular-nums">
                                            −{formatInputMoneda(a.egresos)}
                                        </p>
                                    )}
                                </div>
                                <div className="flex gap-0.5 flex-shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => editar(idx)}
                                        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => quitar(idx)}
                                        className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}

                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-3">
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="opacity-80">Total ingresos</span>
                            <span className="font-mono tabular-nums text-emerald-300 font-bold">
                                ${formatInputMoneda(totales.ingresos)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-xs mb-1">
                            <span className="opacity-80">Total egresos</span>
                            <span className="font-mono tabular-nums text-red-300 font-bold">
                                ${formatInputMoneda(totales.egresos)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-white/20 text-sm">
                            <span className="font-semibold">Neto del lote</span>
                            <span className="font-mono tabular-nums font-bold">
                                ${formatInputMoneda(totales.ingresos - totales.egresos)}
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}