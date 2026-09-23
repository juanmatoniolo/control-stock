"use client";

import { useTheme } from "@/hooks/useTheme";

export default function ThemeToggle({ variant = "icon" }) {
    const { isDark, toggleTheme, mounted } = useTheme();

    // Evita hydration mismatch
    if (!mounted) {
        return variant === "switch" ? (
            <div className="w-14 h-7 rounded-full bg-slate-200 dark:bg-slate-700 animate-pulse" />
        ) : (
            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse" />
        );
    }

    // ============================================
    // Variante: SWITCH (interruptor deslizante)
    // ============================================
    if (variant === "switch") {
        return (
            <button
                onClick={toggleTheme}
                role="switch"
                aria-checked={isDark}
                aria-label="Cambiar tema"
                className="relative inline-flex w-14 h-7 items-center rounded-full bg-slate-200 dark:bg-sky-600 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 focus:ring-offset-2 dark:focus:ring-offset-slate-900"
            >
                <span
                    className={`inline-flex items-center justify-center w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${isDark ? "translate-x-7" : "translate-x-0.5"
                        }`}
                >
                    {isDark ? (
                        <svg className="w-3.5 h-3.5 text-sky-600" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                        </svg>
                    ) : (
                        <svg className="w-3.5 h-3.5 text-amber-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z" />
                        </svg>
                    )}
                </span>
            </button>
        );
    }

    // ============================================
    // Variante: ICON (por defecto)
    // ============================================
    return (
        <button
            onClick={toggleTheme}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            title={isDark ? "Modo claro" : "Modo oscuro"}
            className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-sky-400 transition flex-shrink-0"
        >
            {isDark ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                </svg>
            ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                    />
                </svg>
            )}
        </button>
    );
}