"use client";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500";

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

export default function FormChofer({ values, onChange }) {
    return (
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
            <Field label="Email" name="email" type="email" value={values.email} onChange={onChange} placeholder="chofer@mail.com" />

            <Field label="N° Licencia" name="licencia" value={values.licencia} onChange={onChange} placeholder="LIC-123456" />
            <Field
                label="Vencimiento licencia"
                name="licenciaVencimiento"
                type="date"
                value={values.licenciaVencimiento}
                onChange={onChange}
            />

            <div className="sm:col-span-2">
                <Field label="Dirección" name="direccion" value={values.direccion} onChange={onChange} placeholder="Calle 123, Ciudad" />
            </div>

            <div className="sm:col-span-2">
                <label className={labelClass}>Notas</label>
                <textarea
                    value={values.notas ?? ""}
                    onChange={(e) => onChange("notas", e.target.value)}
                    rows={2}
                    placeholder="Observaciones internas..."
                    className={`${inputClass} resize-none`}
                />
            </div>

            {/* ACTIVO */}
            <div className="sm:col-span-2">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                        type="checkbox"
                        checked={values.activo !== false}
                        onChange={(e) => onChange("activo", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                        Chofer <strong>activo</strong> (aparece en los desplegables de traslados y combustible)
                    </span>
                </label>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1 ml-6">
                    Si lo desmarcás, sigue apareciendo en registros históricos pero no se puede seleccionar para nuevos.
                </p>
            </div>
        </div>
    );
}