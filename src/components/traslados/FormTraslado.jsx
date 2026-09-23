"use client";

import { useMemo } from "react";
import ChoferSelect from "@/components/choferes/ChoferSelect";
import EnfermeroSelect from "@/components/choferes/EnfermeroSelect";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition";

const labelClass =
    "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

function Field({ label, value, onChange, type = "text", placeholder, required, ...rest }) {
    return (
        <div>
            <label className={labelClass}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value)}
                placeholder={placeholder}
                className={inputClass}
                required={required}
                {...rest}
            />
        </div>
    );
}

function SectionTitle({ children }) {
    return (
        <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
            {children}
        </h4>
    );
}

export default function FormTraslado({ values, onChange, esEdicion = false }) {
    const kmRec = useMemo(() => {
        const a = Number(values.kmInicial);
        const b = Number(values.kmFinal);
        if (!a || !b || b < a) return null;
        return b - a;
    }, [values.kmInicial, values.kmFinal]);

    return (
        <div className="space-y-5">
            {/* SALIDA Y LLEGADA */}
            <div>
                <SectionTitle>Salida y llegada</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Field
                        label="Fecha"
                        type="date"
                        value={values.fecha}
                        onChange={(v) => onChange("fecha", v)}
                        required
                    />
                    <Field
                        label="Hora salida"
                        type="time"
                        value={values.horaSalida}
                        onChange={(v) => onChange("horaSalida", v)}
                    />
                    <Field
                        label="Hora llegada"
                        type="time"
                        value={values.horaLlegada}
                        onChange={(v) => onChange("horaLlegada", v)}
                    />
                </div>
            </div>

            {/* KILOMETRAJE */}
            <div>
                <SectionTitle>Kilometraje</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <Field
                        label="KM inicial"
                        type="number"
                        value={values.kmInicial}
                        onChange={(v) => onChange("kmInicial", v)}
                        placeholder="0"
                    />
                    <Field
                        label="KM final"
                        type="number"
                        value={values.kmFinal}
                        onChange={(v) => onChange("kmFinal", v)}
                        placeholder="0"
                    />
                    <div>
                        <label className={labelClass}>KM recorridos</label>
                        <div className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-sky-600 dark:text-sky-400 font-semibold tabular-nums">
                            {kmRec != null ? `${kmRec} km` : "—"}
                        </div>
                    </div>
                </div>
            </div>

            {/* RECORRIDO */}
            <div>
                <SectionTitle>Recorrido</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field
                        label="Inicio (origen)"
                        value={values.inicio}
                        onChange={(v) => onChange("inicio", v)}
                        placeholder="Ej: Base Central"
                    />
                    <Field
                        label="Final (destino)"
                        value={values.final}
                        onChange={(v) => onChange("final", v)}
                        placeholder="Ej: Hospital Italiano"
                    />
                </div>
            </div>

            {/* COMBUSTIBLE */}
            <div>
                <SectionTitle>Combustible</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <Field
                        label="Litros"
                        type="number"
                        step="0.01"
                        min="0"
                        value={values.combustibleLitros}
                        onChange={(v) => onChange("combustibleLitros", v)}
                        placeholder="0.00"
                    />
                    <Field
                        label="Precio ($)"
                        type="number"
                        step="0.01"
                        min="0"
                        value={values.combustiblePrecio}
                        onChange={(v) => onChange("combustiblePrecio", v)}
                        placeholder="0.00"
                    />
                </div>
            </div>

            {/* PERSONAL Y PASAJERO */}
            <div>
                <SectionTitle>Personal y pasajero</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {/* CHOFER */}
                    <div>
                        <label className={labelClass}>
                            Chofer <span className="text-red-500">*</span>
                        </label>
                        <ChoferSelect
                            value={
                                values.choferId || values.choferNombre
                                    ? { id: values.choferId, nombre: values.choferNombre }
                                    : null
                            }
                            onChange={(c) => {
                                if (!c) {
                                    onChange("choferId", null);
                                    onChange("choferNombre", "");
                                } else {
                                    onChange("choferId", c.id ?? null);
                                    onChange("choferNombre", c.nombre || "");
                                }
                            }}
                            soloActivos={!esEdicion}
                        />
                        {esEdicion && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                En edición se muestran también los dados de baja
                            </p>
                        )}
                    </div>

                    {/* ENFERMERO */}
                    <div>
                        <label className={labelClass}>Enfermero/a</label>
                        <EnfermeroSelect
                            value={
                                values.enfermeroId || values.enfermero
                                    ? { id: values.enfermeroId, nombre: values.enfermero }
                                    : null
                            }
                            onChange={(c) => {
                                if (!c) {
                                    onChange("enfermeroId", null);
                                    onChange("enfermero", "");
                                } else {
                                    onChange("enfermeroId", c.id ?? null);
                                    onChange("enfermero", c.nombre || "");
                                }
                            }}
                            soloActivos={!esEdicion}
                        />
                        {esEdicion && (
                            <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                                En edición se muestran también los dados de baja
                            </p>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3 sm:mt-4">
                    <Field
                        label="Paciente"
                        value={values.paciente}
                        onChange={(v) => onChange("paciente", v)}
                        placeholder="Nombre del paciente"
                    />
                    <Field
                        label="Motivo"
                        value={values.motivo}
                        onChange={(v) => onChange("motivo", v)}
                        placeholder="Ej: Traslado programado"
                    />
                </div>
            </div>
        </div>
    );
}