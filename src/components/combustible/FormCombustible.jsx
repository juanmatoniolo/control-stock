"use client";

const inputClass =
    "w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition text-slate-900 dark:text-slate-100 bg-white dark:bg-slate-800 placeholder:text-slate-400 dark:placeholder:text-slate-500";

const labelClass =
    "block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1";

export default function FormCombustible({ values, onChange }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            {/* FECHA */}
            <div>
                <label className={labelClass}>
                    Fecha de Carga <span className="text-red-500">*</span>
                </label>
                <input
                    type="date"
                    value={values.fecha ?? ""}
                    onChange={(e) => onChange("fecha", e.target.value)}
                    className={inputClass}
                    required
                />
            </div>

            {/* HORA */}
            <div>
                <label className={labelClass}>Hora</label>
                <input
                    type="time"
                    value={values.hora ?? ""}
                    onChange={(e) => onChange("hora", e.target.value)}
                    className={inputClass}
                />
            </div>

            {/* N° REMITO */}
            <div className="sm:col-span-2">
                <label className={labelClass}>
                    Número de Remito <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={values.numeroRemito ?? ""}
                    onChange={(e) => onChange("numeroRemito", e.target.value)}
                    placeholder="Ej: R-0001-00012345"
                    className={inputClass}
                    required
                />
            </div>

            {/* LITROS */}
            <div>
                <label className={labelClass}>
                    Litros Cargados <span className="text-red-500">*</span>
                </label>
                <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={values.litros ?? ""}
                    onChange={(e) => onChange("litros", e.target.value)}
                    placeholder="0.00"
                    className={inputClass}
                    required
                />
            </div>

            {/* CHOFER */}
            <div>
                <label className={labelClass}>
                    Chofer <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={values.chofer ?? ""}
                    onChange={(e) => onChange("chofer", e.target.value)}
                    placeholder="Nombre del chofer"
                    className={inputClass}
                    required
                />
            </div>
        </div>
    );
}