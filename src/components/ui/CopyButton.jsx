"use client";

import { useState } from "react";

export default function CopyButton({ value, label = "Copiar", size = "md", variant = "ghost" }) {
    const [copied, setCopied] = useState(false);

    async function handleCopy() {
        if (!value) return;
        try {
            await navigator.clipboard.writeText(String(value));
        } catch {
            // Fallback para navegadores viejos
            const ta = document.createElement("textarea");
            ta.value = String(value);
            document.body.appendChild(ta);
            ta.select();
            document.execCommand("copy");
            document.body.removeChild(ta);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }

    const sizes = {
        sm: "w-7 h-7",
        md: "w-8 h-8",
    };

    const variants = {
        ghost:
            "text-slate-400 hover:text-sky-600 hover:bg-sky-50",
        solid:
            "text-slate-600 hover:text-sky-600 bg-slate-100 hover:bg-sky-50",
    };

    return (
        <button
            type="button"
            onClick={handleCopy}
            title={copied ? "¡Copiado!" : label}
            aria-label={label}
            className={`${sizes[size]} ${variants[variant]} rounded-lg flex items-center justify-center transition flex-shrink-0 ${copied ? "text-emerald-600 bg-emerald-50" : ""
                }`}
        >
            {copied ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
            ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                </svg>
            )}
        </button>
    );
}