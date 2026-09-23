"use client";

import { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext(null);
const STORAGE_KEY = "control-stock-theme";

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState(null); // null = sin determinar
    const [mounted, setMounted] = useState(false);

    // Cargar tema al montar
    useEffect(() => {
        const guardado = localStorage.getItem(STORAGE_KEY);
        if (guardado === "dark" || guardado === "light") {
            setTheme(guardado);
        } else {
            // Preferencia del sistema
            const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
            setTheme(prefersDark ? "dark" : "light");
        }
        setMounted(true);
    }, []);

    // Aplicar al <html>
    useEffect(() => {
        if (!mounted || !theme) return;

        const root = document.documentElement;
        // Transición suave
        root.classList.add("theme-transition");

        if (theme === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }

        localStorage.setItem(STORAGE_KEY, theme);

        const t = setTimeout(() => root.classList.remove("theme-transition"), 250);
        return () => clearTimeout(t);
    }, [theme, mounted]);

    function toggleTheme() {
        setTheme((t) => (t === "dark" ? "light" : "dark"));
    }

    function setLight() {
        setTheme("light");
    }

    function setDark() {
        setTheme("dark");
    }

    return (
        <ThemeContext.Provider
            value={{ theme, mounted, toggleTheme, setLight, setDark, isDark: theme === "dark" }}
        >
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const ctx = useContext(ThemeContext);
    if (!ctx) throw new Error("useTheme debe usarse dentro de <ThemeProvider>");
    return ctx;
}