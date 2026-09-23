"use client";

import { useState } from "react";
import MonedaInput from "@/components/ui/MonedaInput";
import { CATEGORIAS } from "@/lib/facturas";

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

export default function FormFactura({ values, onChange, proveedores = [] }) {
    const [catCustom, setCatCustom] = useState(false);

    const categoriaEsCustom = values.categoria && !CATEGORIAS.includes(values.categoria);

    return (
        <div className="space-y-4">
            {/* FECHA Y COMPROBANTE */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Field
                    label="Fecha (dd/mm/aaaa)"
                    name="fecha"
                    type="date"
                    value={values.fecha}
                    onChange={onChange}
                    required
                />
                <Field
                    label="Comprobante"
                    name="comprobante"
                    value={values.comprobante}
                    onChange={onChange}
                    placeholder="Ej: Fact nº 00091181"
                />
            </div>

            {/* CONCEPTO */}
            <div>
                <label className={labelClass}>
                    Concepto <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={values.concepto ?? ""}
                    onChange={(e) => onChange("concepto", e.target.value)}
                    placeholder="Ej: Insumos médicos y de enfermería"
                    className={inputClass}
                    required
                />
            </div>

            {/* PROVEEDOR */}
            <div>
                <label className={labelClass}>Proveedor</label>
                <input
                    type="text"
                    value={values.proveedor ?? ""}
                    onChange={(e) => onChange("proveedor", e.target.value)}
                    placeholder="Empezá a tipear para ver sugerencias..."
                    list="proveedores-facturas"
                    className={inputClass}
                    autoComplete="off"
                />
                <datalist id="proveedores-facturas">
                    {proveedores.map((p) => (
                        <option key={p} value={p} />
                    ))}
                </datalist>
                {proveedores.length > 0 && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        💡 {proveedores.length} proveedor{proveedores.length === 1 ? "" : "es"} ya cargado{proveedores.length === 1 ? "" : "s"} · tipeá para autocompletar
                    </p>
                )}
            </div>

            {/* INGRESOS Y EGRESOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                    <label className={labelClass}>
                        Ingresos (créditos) <span className="text-red-500">*</span>
                    </label>
                    <MonedaInput
                        value={values.ingresos}
                        onChange={(v) => {
                            onChange("ingresos", v);
                            if (v && Number(v) > 0) onChange("egresos", "");
                        }}
                        placeholder="0,00"
                        colorClass="text-emerald-600 dark:text-emerald-400 font-semibold"
                        className={inputClass.replace("text-slate-900 dark:text-slate-100", "")}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Dinero que <strong>entra</strong> · suma al saldo
                    </p>
                </div>
                <div>
                    <label className={labelClass}>
                        Egresos (débitos) <span className="text-red-500">*</span>
                    </label>
                    <MonedaInput
                        value={values.egresos}
                        onChange={(v) => {
                            onChange("egresos", v);
                            if (v && Number(v) > 0) onChange("ingresos", "");
                        }}
                        placeholder="0,00"
                        colorClass="text-red-600 dark:text-red-400 font-semibold"
                        className={inputClass.replace("text-slate-900 dark:text-slate-100", "")}
                    />
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        Dinero que <strong>sale</strong> · resta del saldo
                    </p>
                </div>
            </div>

            {/* CATEGORÍA */}
            <div>
                <div className="flex items-center justify-between mb-1">
                    <label className={labelClass}>Categoría Federación</label>
                    <button
                        type="button"
                        onClick={() => setCatCustom(!catCustom)}
                        className="text-[10px] text-sky-600 dark:text-sky-400 hover:underline"
                    >
                        {catCustom ? "← Usar lista" : "+ Categoría personalizada"}
                    </button>
                </div>
                {catCustom || categoriaEsCustom ? (
                    <input
                        type="text"
                        value={values.categoria ?? ""}
                        onChange={(e) => onChange("categoria", e.target.value)}
                        placeholder="Escribí la categoría..."
                        className={inputClass}
                    />
                ) : (
                    <select
                        value={values.categoria ?? ""}
                        onChange={(e) => onChange("categoria", e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Sin categoría</option>
                        {CATEGORIAS.map((c) => (
                            <option key={c} value={c}>
                                {c.length > 80 ? c.slice(0, 77) + "..." : c}
                            </option>
                        ))}
                    </select>
                )}
            </div>

            {/* NOTAS */}
            <div>
                <label className={labelClass}>Notas</label>
                <textarea
                    value={values.notas ?? ""}
                    onChange={(e) => onChange("notas", e.target.value)}
                    rows={2}
                    placeholder="Observaciones adicionales..."
                    className={`${inputClass} resize-none`}
                />
            </div>
        </div>
    );
}