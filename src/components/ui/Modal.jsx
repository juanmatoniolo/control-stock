"use client";

import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, size = "md" }) {
    /* ============ BLOQUEAR SCROLL ============ */
    useEffect(() => {
        if (!open) return;
        const original = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = original;
        };
    }, [open]);

    /* ============ CERRAR CON ESC ============ */
    useEffect(() => {
        if (!open) return;
        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const sizes = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl",
        xl: "max-w-5xl",
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            {/* BACKDROP */}
            <div
                onClick={onClose}
                className="absolute inset-0 bg-slate-900/60 dark:bg-black/70 backdrop-blur-sm animate-fade-in"
                aria-hidden="true"
            />

            {/* PANEL */}
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="modal-title"
                className={`
          relative w-full ${sizes[size]}
          bg-white dark:bg-slate-900
          text-slate-900 dark:text-slate-100
          border border-slate-200 dark:border-slate-800
          rounded-t-2xl sm:rounded-2xl
          shadow-2xl
          max-h-[92vh] flex flex-col
          animate-fade-in
        `}
            >
                {/* HEADER */}
                <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex-shrink-0">
                    <h2
                        id="modal-title"
                        className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 truncate"
                    >
                        {title}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 dark:text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition flex-shrink-0"
                        aria-label="Cerrar"
                    >
                        <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M6 18L18 6M6 6l12 12"
                            />
                        </svg>
                    </button>
                </div>

                {/* BODY */}
                <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4">
                    {children}
                </div>
            </div>
        </div>
    );
}