"use client";

import { useEffect } from "react";

export default function Modal({ open, onClose, title, children, size = "md" }) {
    useEffect(() => {
        if (!open) return;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "";
        };
    }, [open]);

    useEffect(() => {
        if (!open) return;
        const onKey = (e) => e.key === "Escape" && onClose();
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [open, onClose]);

    if (!open) return null;

    const sizes = {
        sm: "max-w-md",
        md: "max-w-2xl",
        lg: "max-w-4xl",
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            />
            <div
                className={`relative bg-white w-full ${sizes[size]} rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[92vh] flex flex-col animate-fade-in`}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-200 flex-shrink-0">
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 truncate">
                        {title}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-9 h-9 flex items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition flex-shrink-0"
                        aria-label="Cerrar"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="overflow-y-auto flex-1 px-4 sm:px-6 py-4">{children}</div>
            </div>
        </div>
    );
}