"use client";

const Field = ({ label, name, value, onChange, type = "text", placeholder = "", required = false }) => (
    <div>
        <label className="block text-xs font-medium text-slate-600 mb-1">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        <input
            type={type}
            name={name}
            value={value ?? ""}
            onChange={(e) => onChange(name, e.target.value)}
            placeholder={placeholder}
            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 outline-none transition text-slate-900 bg-white"
        />
    </div>
);

export default function FormProveedor({ values, onChange }) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="sm:col-span-2">
                <Field
                    label="Proveedor"
                    name="proveedor"
                    value={values.proveedor}
                    onChange={onChange}
                    placeholder="Nombre o razón social"
                    required
                />
            </div>

            <Field label="CUIT" name="cuit" value={values.cuit} onChange={onChange} placeholder="20-12345678-9" />
            <Field label="Situación" name="situacion" value={values.situacion} onChange={onChange} placeholder="Activo / Inactivo" />

            <Field label="Banco" name="banco" value={values.banco} onChange={onChange} placeholder="Banco Nación" />
            <Field label="CBU" name="cbu" value={values.cbu} onChange={onChange} placeholder="0000000000000000000000" />

            <Field label="Alias" name="alias" value={values.alias} onChange={onChange} placeholder="alias.banco" />
            <Field label="Alias RCEL" name="aliasRcel" value={values.aliasRcel} onChange={onChange} placeholder="alias.rcel" />

            <Field label="Email" name="email" type="email" value={values.email} onChange={onChange} placeholder="proveedor@mail.com" />
            <Field label="Teléfono" name="telefono" value={values.telefono} onChange={onChange} placeholder="+54 9 11 ..." />

            <div className="sm:col-span-2">
                <Field label="Dirección" name="direccion" value={values.direccion} onChange={onChange} placeholder="Calle 123, Ciudad" />
            </div>

            <div className="sm:col-span-2">
                <Field label="Rubro / Concepto" name="rubro" value={values.rubro} onChange={onChange} placeholder="Ej: Medicamentos, Limpieza, Combustible..." />
            </div>
        </div>
    );
}