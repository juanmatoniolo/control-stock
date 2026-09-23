"use client";

import { createContext, useContext, useEffect, useState } from "react";

const FontSizeContext = createContext(null);
const STORAGE_KEY = "control-stock-fontsize";

export const FONT_SIZES = [
    { id: "base", label: "A", nombre: "Normal", px: 16 },
    { id: "lg", label: "A+", nombre: "Grande", px: 18 },
    { id: "xl", label: "A++", nombre: "Muy grande", px: 20 },
];

const DEFAULT = "base";

export function FontSizeProvider({ children }) {
    const [size, setSize] = useState(DEFAULT);
    const [mounted, setMounted] = useState(false);

    // Cargar de localStorage
    useEffect(() => {
        try {
            const guardado = localStorage.getItem(STORAGE_KEY);
            if (FONT_SIZES.some((s) => s.id === guardado)) {
                setSize(guardado);
            }
        } catch { }
        setMounted(true);
    }, []);

    // Aplicar al <html> con data-font
    useEffect(() => {
        if (!mounted) return;
        const root = document.documentElement;
        root.setAttribute("data-font", size);
        try {
            localStorage.setItem(STORAGE_KEY, size);
        } catch { }
    }, [size, mounted]);

    function setFontSize(id) {
        if (FONT_SIZES.some((s) => s.id === id)) setSize(id);
    }

    // Siguiente nivel (cicla)
    function cycle() {
        const idx = FONT_SIZES.findIndex((s) => s.id === size);
        const next = FONT_SIZES[(idx + 1) % FONT_SIZES.length];
        setSize(next.id);
    }

    const current = FONT_SIZES.find((s) => s.id === size) || FONT_SIZES[0];

    return (
        <FontSizeContext.Provider
            value={{ size, current, setFontSize, cycle, mounted }}
        >
            {children}
        </FontSizeContext.Provider>
    );
}

export function useFontSize() {
    const ctx = useContext(FontSizeContext);
    if (!ctx) throw new Error("useFontSize debe usarse dentro de <FontSizeProvider>");
    return ctx;
}