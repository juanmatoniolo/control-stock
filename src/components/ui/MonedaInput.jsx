"use client";

import { useEffect, useState } from "react";
import { parseMoneda, formatInputMoneda } from "@/lib/facturas";

/**
 * Input de moneda con formato es-AR (1.234,56).
 * Guarda el valor como string numérico plano ("1234.56") en el estado padre,
 * pero muestra al usuario con separadores de miles y coma decimal.
 */
export default function MonedaInput({
    value,
    onChange,
    placeholder = "0,00",
    className = "",
    colorClass = "",
    prefix = "$",
    autoFocus = false,
    name,
}) {
    const [texto, setTexto] = useState(() => formatInputMoneda(value));
    const [enfocado, setEnfocado] = useState(false);

    // Sincronizar cuando el value cambia desde afuera (ej: reset del form)
    useEffect(() => {
        if (!enfocado) {
            setTexto(formatInputMoneda(value));
        }
    }, [value, enfocado]);

    function handleFocus(e) {
        setEnfocado(true);
        // Si el valor es 0 o vacío, mostrar vacío
        const num = parseMoneda(texto);
        if (num === 0) setTexto("");
        // Seleccionar todo al enfocar
        setTimeout(() => e.target.select?.(), 0);
    }

    function handleBlur() {
        setEnfocado(false);
        // Al perder foco, formatear bonito
        const num = parseMoneda(texto);
        if (num === 0) {
            setTexto("");
            onChange("");
        } else {
            setTexto(formatInputMoneda(num));
            onChange(num.toFixed(2)); // guardar como "1234.56"
        }
    }

    function handleChange(e) {
        // Permitir solo dígitos, coma, punto y menos
        const raw = e.target.value;
        // Guardamos lo que escribió tal cual para no interrumpir el tipeo
        setTexto(raw);
        // Y notificamos al padre con el valor parseado (0 si está vacío)
        const num = parseMoneda(raw);
        onChange(num === 0 && !raw.trim() ? "" : num.toString());
    }

    // Al mostrar sin foco, agrego el prefijo $
    const displayValue = enfocado ? texto : texto ? `${prefix} ${texto}` : "";

    return (
        <div className="relative">
            {enfocado && (
                <span className={`absolute left-2.5 top-1/2 -translate-y-1/2 text-xs ${colorClass || "text-slate-400 dark:text-slate-500"} pointer-events-none`}>
                    {prefix}
                </span>
            )}
            <input
                type="text"
                inputMode="decimal"
                name={name}
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                autoFocus={autoFocus}
                className={`${className} ${enfocado ? "pl-6" : ""} ${colorClass}`}
            />
        </div>
    );
}