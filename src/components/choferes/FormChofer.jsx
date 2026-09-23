"use client";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

function Field({ label, name, value, onChange, type = "text", placeholder, required }) {
    return (
        <div>
            <label className={labelClass}>
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                value={value ?? ""}
                onChange={(e) => onChange(name, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
                required={required}
            />
        </div>
    );
}

function RoleButton({ role, active, onClick, icon, title, subtitle }) {
    return (
        <button
            type="button"
            onClick={() => onClick(role)}
            className={`flex flex-col items-center justify-center gap-1 py-3 rounded-lg border-2 text-center transition ${active
                ? "border-sky-500 bg-sky-50 dark:bg-sky-950/40"
                : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                }`}
        >
            <span className={`text-xl ${active ? "" : "opacity-40"}`}>{icon}</span>
            <span
                className={`text-xs font-semibold ${active ? "text-sky-700 dark:text-sky-400" : "text-slate-600 dark:text-slate-400"
                    }`}
            >
                {title}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight px-1">
                {subtitle}
            </span>
        </button>
    );
}

export default function FormChofer({ values, onChange }) {
    const rol = values.rol || "chofer";
    const esCh = rol === "chofer" || rol === "ambos";
    const esEnf = rol === "enfermero" || rol === "ambos";

    return (
        <div className="space-y-5">
            {/* ROL */}
            <div>
                <label className={labelClass}>
                    Rol en el equipo <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 gap-2">
                    <RoleButton
                        role="chofer"
                        active={rol === "chofer"}
                        onClick={(r) => onChange("rol", r)}
                        icon="🚑"
                        title="Chofer"
                        subtitle="Conduce"
                    />
                    <RoleButton
                        role="enfermero"
                        active={rol === "enfermero"}
                        onClick={(r) => onChange("rol", r)}
                        icon="💉"
                        title="Enfermero"
                        subtitle="Asiste"
                    />
                    <RoleButton
                        role="ambos"
                        active={rol === "ambos"}
                        onClick={(r) => onChange("rol", r)}
                        icon="🚑💉"
                        title="Ambos"
                        subtitle="Cumple ambos"
                    />
                </div>
            </div>

            {/* DATOS PERSONALES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Field
                    label="Apellido"
                    name="apellido"
                    value={values.apellido}
                    onChange={onChange}
                    placeholder="Pérez"
                    required
                />
                <Field
                    label="Nombre"
                    name="nombre"
                    value={values.nombre}
                    onChange={onChange}
                    placeholder="Juan"
                    required
                />

                <Field label="DNI" name="dni" value={values.dni} onChange={onChange} placeholder="30.123.456" />
                <Field
                    label="Fecha de nacimiento"
                    name="fechaNacimiento"
                    type="date"
                    value={values.fechaNacimiento}
                    onChange={onChange}
                />

                <Field label="Teléfono" name="telefono" value={values.telefono} onChange={onChange} placeholder="+54 9 11 ..." />
                <Field label="Email" name="email" type="email" value={values.email} onChange={onChange} placeholder="email@mail.com" />
            </div>

            {/* DATOS DE CHOFER */}
            {esCh && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        🚑 Datos de chofer
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Field
                            label="N° Licencia de conducir"
                            name="licencia"
                            value={values.licencia}
                            onChange={onChange}
                            placeholder="LIC-123456"
                        />
                        <Field
                            label="Vencimiento licencia"
                            name="licenciaVencimiento"
                            type="date"
                            value={values.licenciaVencimiento}
                            onChange={onChange}
                        />
                    </div>
                </div>
            )}

            {/* DATOS DE ENFERMERO */}
            {esEnf && (
                <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                        💉 Datos de enfermería
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                        <Field
                            label="N° Matrícula profesional"
                            name="matricula"
                            value={values.matricula}
                            onChange={onChange}
                            placeholder="MAT-123456"
                        />
                        <Field
                            label="Vencimiento matrícula"
                            name="matriculaVencimiento"
                            type="date"
                            value={values.matriculaVencimiento}
                            onChange={onChange}
                        />
                    </div>
                </div>
            )}

            {/* UBICACIÓN Y NOTAS */}
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
                <div>
                    <label className={labelClass}>Dirección</label>
                    <input
                        type="text"
                        value={values.direccion ?? ""}
                        onChange={(e) => onChange("direccion", e.target.value)}
                        placeholder="Calle 123, Ciudad"
                        className={inputClass}
                    />
                </div>

                <div>
                    <label className={labelClass}>Notas</label>
                    <textarea
                        value={values.notas ?? ""}
                        onChange={(e) => onChange("notas", e.target.value)}
                        rows={2}
                        placeholder="Observaciones internas..."
                        className={`${inputClass} resize-none`}
                    />
                </div>
            </div>

            {/* ACTIVO */}
            <label className="flex items-center gap-2 cursor-pointer select-none pt-3 border-t border-slate-100 dark:border-slate-800">
                <input
                    type="checkbox"
                    checked={values.activo !== false}
                    onChange={(e) => onChange("activo", e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                    Activo (aparece en los desplegables de traslados y combustible)
                </span>
            </label>
        </div>
    );
}