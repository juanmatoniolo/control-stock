"use client";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

function Field({ label, name, value, onChange, placeholder, type = "text", required, disabled }) {
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
                className={`${inputClass} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                required={required}
                disabled={disabled}
            />
        </div>
    );
}

export default function FormProducto({ values, onChange, esEdicion = false }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
                <Field
                    label="Código único"
                    name="codigo"
                    value={values.codigo}
                    onChange={onChange}
                    placeholder="Ej: MED-0001"
                    required
                    disabled={esEdicion}
                />
                {esEdicion && (
                    <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">
                        El código no se puede cambiar (está vinculado a los movimientos)
                    </p>
                )}
            </div>

            <div className="sm:col-span-2">
                <Field
                    label="Producto"
                    name="producto"
                    value={values.producto}
                    onChange={onChange}
                    placeholder="Nombre del producto"
                    required
                />
            </div>

            <Field label="Marca" name="marca" value={values.marca} onChange={onChange} placeholder="Ej: Roemmers" />
            <Field label="Categoría" name="categoria" value={values.categoria} onChange={onChange} placeholder="Ej: Analgésico" />

            <Field
                label="Stock mínimo (alerta)"
                name="stockMinimo"
                type="number"
                value={values.stockMinimo}
                onChange={onChange}
                placeholder="5"
            />

            <div>
                <label className={labelClass}>Estado</label>
                <label className="flex items-center gap-2 cursor-pointer select-none py-2">
                    <input
                        type="checkbox"
                        checked={values.activo !== false}
                        onChange={(e) => onChange("activo", e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
                    />
                    <span className="text-sm text-slate-700 dark:text-slate-300">Producto activo</span>
                </label>
            </div>
        </div>
    );
}