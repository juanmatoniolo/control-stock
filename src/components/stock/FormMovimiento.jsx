"use client";

import ProductoSelect from "./ProductoSelect";
import { MOVIMIENTOS_FRECUENTES } from "@/lib/stock";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

function Field({ label, name, value, onChange, type = "text", placeholder, required, step }) {
    return (
        <div>
            <label className={labelClass}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                step={step}
                value={value ?? ""}
                onChange={(e) => onChange(name, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
                required={required}
            />
        </div>
    );
}

export default function FormMovimiento({ values, onChange, esEdicion = false }) {
    const esEntrada = values.tipo === "entrada";

    return (
        <div className="space-y-5">
            {/* TIPO */}
            <div>
                <label className={labelClass}>Tipo de movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={() => onChange("tipo", "entrada")}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition ${esEntrada
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        Entrada
                    </button>
                    <button
                        type="button"
                        onClick={() => onChange("tipo", "salida")}
                        className={`flex items-center justify-center gap-2 py-3 rounded-lg border-2 text-sm font-medium transition ${!esEntrada
                            ? "border-red-500 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                            : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                        Salida
                    </button>
                </div>
            </div>

            {/* PRODUCTO */}
            <div>
                <label className={labelClass}>
                    Producto <span className="text-red-500">*</span>
                </label>
                <ProductoSelect
                    value={values.codigo ? { codigo: values.codigo, producto: values.producto } : null}
                    onChange={(p) => {
                        if (!p) {
                            onChange("codigo", "");
                            onChange("producto", "");
                        } else {
                            onChange("codigo", p.codigo);
                            onChange("producto", p.producto);
                        }
                    }}
                />
            </div>

            {/* FECHA Y CANTIDAD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Field
                    label="Fecha"
                    name="fecha"
                    type="date"
                    value={values.fecha}
                    onChange={onChange}
                    required
                />
                <Field
                    label="Cantidad"
                    name="cantidad"
                    type="number"
                    step="1"
                    value={values.cantidad}
                    onChange={onChange}
                    placeholder="0"
                    required
                />
            </div>

            {/* IDENTIFICADOR: FACTURA (entrada) o MOVIMIENTO (salida) */}
            {esEntrada ? (
                <Field
                    label="Nº de factura"
                    name="numeroFactura"
                    value={values.numeroFactura}
                    onChange={onChange}
                    placeholder="Ej: A-0001-00012345"
                />
            ) : (
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
            )}

            {/* DATOS DEL LOTE — comunes a entrada y salida */}
            <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Datos del lote
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field label="Marca" name="marca" value={values.marca} onChange={onChange} placeholder="Laboratorio / fabricante" />
                    <Field label="Nº de lote" name="numeroLote" value={values.numeroLote} onChange={onChange} placeholder="L-2025-001" />
                    <Field label="Vencimiento" name="vencimiento" type="date" value={values.vencimiento} onChange={onChange} />
                    <Field label="Precio unitario" name="precioUnitario" type="number" step="0.01" value={values.precioUnitario} onChange={onChange} placeholder="0.00" />
                    <div className="sm:col-span-2">
                        <Field label="Precio total" name="precioTotal" type="number" step="0.01" value={values.precioTotal} onChange={onChange} placeholder="0.00" />
                    </div>
                </div>
            </div>

            {/* OBSERVACIONES — solo salida */}
            {!esEntrada && (
                <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Detalle
                    </h4>
                    <div>
                        <label className={labelClass}>Observaciones</label>
                        <textarea
                            value={values.observaciones ?? ""}
                            onChange={(e) => onChange("observaciones", e.target.value)}
                            rows={2}
                            placeholder="Notas adicionales, paciente, receta..."
                            className={`${inputClass} resize-none`}
                        />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500">
                        El usuario que registra esta salida quedará guardado automáticamente:{" "}
                        <strong>{values.usuarioNombre || values.usuario || "—"}</strong>
                    </p>
                </div>
            )}
        </div>
    );
}