"use client";

import { useFontSize, FONT_SIZES } from "@/hooks/useFontSize";

export default function FontSizeToggle({ variant = "segmented", compact = false }) {
    const { size, setFontSize, mounted } = useFontSize();

    if (!mounted) {
        return (
            <div className="h-9 w-24 rounded-lg bg-slate-800/50 animate-pulse" />
        );
    }

    // ============================================
    // Variante: SEGMENTED (3 botones A / A+ / A++)
    // ============================================
    if (variant === "segmented") {
        return (
            <div
                className={`inline-flex items-center bg-slate-800/60 dark:bg-slate-900/60 rounded-lg p-0.5 ${compact ? "" : "gap-0"
                    }`}
                role="group"
                aria-label="Tamaño de fuente"
            >
                {FONT_SIZES.map((s) => {
                    const activo = s.id === size;
                    return (
                        <button
                            key={s.id}
                            onClick={() => setFontSize(s.id)}
                            title={`${s.nombre} (${s.px}px)`}
                            aria-label={`Tamaño ${s.nombre}`}
                            aria-pressed={activo}
                            className={`px-2 py-1.5 min-w-[34px] rounded-md text-xs font-bold transition ${activo
                                ? "bg-sky-600 text-white shadow-sm"
                                : "text-slate-400 hover:text-white hover:bg-slate-700/60"
                                }`}
                        >
                            {s.label}
                        </button>
                    );
                })}
            </div>
        );
    }

    // ============================================
    // Variante: ICON (un solo botón que cicla)
    // ============================================
    return (
        <button
            onClick={() => setFontSize(size === "base" ? "lg" : size === "lg" ? "xl" : "base")}
            title="Cambiar tamaño de fuente"
            aria-label="Cambiar tamaño de fuente"
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-sky-400 transition flex-shrink-0 font-bold text-xs"
        >
            {size === "base" ? "A" : size === "lg" ? "A+" : "A++"}
        </button>
    );
}