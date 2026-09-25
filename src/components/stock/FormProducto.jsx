"use client";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition";

const labelClass = "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

function Field({ label, name, value, onChange, placeholder, type = "text", required, disabled, step }) {
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
                className={`${inputClass} ${disabled ? "opacity-60 cursor-not-allowed" : ""}`}
                required={required}
                disabled={disabled}
            />
        </div>
    );
}

function fmtMoneda(n) {
    const num = Number(n);
    if (!isFinite(num) || num === 0) return "";
    return `$ ${num.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function FormProducto({ values, onChange, esEdicion = false, stockActual = 0 }) {
    const cantidadNum = Number(values.stockInicial) || 0;
    const precioNum = Number(values.precioUnitario) || 0;
    const totalCalculado = cantidadNum > 0 && precioNum > 0
        ? Number((cantidadNum * precioNum).toFixed(2))
        : 0;

    return (
        <div className="space-y-5">
            {/* CÓDIGO */}
            <div>
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

            {/* PRODUCTO */}
            <Field
                label="Producto"
                name="producto"
                value={values.producto}
                onChange={onChange}
                placeholder="Nombre del producto"
                required
            />

            {/* SECCIÓN CANTIDAD + PRECIO */}
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 p-3.5">
                <h4 className="text-xs font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {esEdicion ? "Agregar stock" : "Stock inicial"}
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-snug">
                    {esEdicion ? (
                        <>
                            Stock actual: <strong className="text-slate-700 dark:text-slate-200">{stockActual}</strong>.
                            {" "}La cantidad que ingreses se <strong>sumará</strong> como una entrada nueva.
                        </>
                    ) : (
                        <>Cantidad y precio con la que arranca este producto. Se registrará una entrada automáticamente.</>
                    )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Field
                        label={esEdicion ? "Cantidad a agregar" : "Cantidad inicial"}
                        name="stockInicial"
                        type="number"
                        step="1"
                        value={values.stockInicial}
                        onChange={onChange}
                        placeholder="0"
                    />
                    <Field
                        label="Precio unitario"
                        name="precioUnitario"
                        type="number"
                        step="0.01"
                        value={values.precioUnitario}
                        onChange={onChange}
                        placeholder="0.00"
                    />
                    <div>
                        <label className={labelClass}>Total</label>
                        <div className="px-3 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold tabular-nums">
                            {totalCalculado > 0 ? fmtMoneda(totalCalculado) : <span className="text-slate-300 dark:text-slate-600">—</span>}
                        </div>
                    </div>
                </div>
            </div>

            {/* MARCA / CATEGORÍA */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Field label="Marca" name="marca" value={values.marca} onChange={onChange} placeholder="Ej: Roemmers" />
                <Field label="Categoría" name="categoria" value={values.categoria} onChange={onChange} placeholder="Ej: Analgésico" />
            </div>

            {/* STOCK MÍNIMO / ESTADO */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
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
        </div>
    );
}