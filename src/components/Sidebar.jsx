/// src\components\Sidebar.jsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";

export default function Sidebar({ items, title = "Control de Stock" }) {
    const pathname = usePathname();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const isActive = (href) => {
        if (href === "/dashboard" || href === "/farmacia") return pathname === href;
        return pathname === href || pathname.startsWith(href + "/");
    };

    // ============================================
    // CONTENIDO DEL SIDEBAR DESKTOP (reutilizable)
    // ============================================
    const ContenidoDesktop = ({ mini }) => (
        <>
            {/* ---------- HEADER ---------- */}
            <div
                className={`border-b border-slate-800 flex-shrink-0 flex items-center ${mini ? "justify-center px-2 py-4" : "justify-between px-4 py-4 gap-2"
                    }`}
            >
                {!mini && (
                    <div className="min-w-0">
                        <h1 className="text-base font-bold tracking-tight truncate text-white">
                            {title}
                        </h1>
                        <p className="text-[10px] text-slate-400 mt-0.5 uppercase tracking-widest">
                            Sistema
                        </p>
                    </div>
                )}

                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-8 h-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-800 hover:text-sky-400 transition flex-shrink-0 flex"
                    aria-label={mini ? "Expandir menú" : "Colapsar menú"}
                    title={mini ? "Expandir menú" : "Colapsar menú"}
                >
                    <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        viewBox="0 0 24 24"
                    >
                        {mini ? (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        ) : (
                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                        )}
                    </svg>
                </button>
            </div>

            {/* ---------- USUARIO ---------- */}
            <div className={`border-b border-slate-800 flex-shrink-0 ${mini ? "py-3 px-2" : "py-4 px-4"}`}>
                <div className={`flex items-center ${mini ? "justify-center" : "gap-3"}`}>
                    <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-sm font-bold uppercase text-white shadow-lg shadow-sky-900/30">
                            {user?.nombre?.[0] ?? "?"}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
                    </div>
                    {!mini && (
                        <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate text-white">{user?.nombre}</p>
                            <p className="text-[11px] text-slate-400 capitalize">{user?.rol}</p>
                        </div>
                    )}
                </div>
            </div>

            {/* ---------- NAV ---------- */}
            <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {items.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            title={mini ? item.label : undefined}
                            className={`group relative flex items-center rounded-xl text-sm transition-all ${mini ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
                                } ${active
                                    ? "bg-sky-600/15 text-sky-400 font-medium"
                                    : "text-slate-400 hover:bg-slate-800/60 hover:text-white"
                                }`}
                        >
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-sky-500 rounded-r-full" />
                            )}
                            <span className="w-5 h-5 flex-shrink-0 flex items-center justify-center">
                                {item.icon}
                            </span>
                            {!mini && <span className="truncate">{item.label}</span>}

                            {mini && (
                                <span className="pointer-events-none absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg shadow-xl whitespace-nowrap opacity-0 group-hover:opacity-100 -translate-x-1 group-hover:translate-x-0 transition-all z-50 border border-slate-700">
                                    {item.label}
                                </span>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* ---------- LOGOUT ---------- */}
            <div className={`border-t border-slate-800 flex-shrink-0 ${mini ? "p-2" : "p-3"}`}>
                <button
                    onClick={logout}
                    title={mini ? "Cerrar sesión" : undefined}
                    className={`group relative w-full flex items-center rounded-xl text-sm text-slate-400 hover:bg-red-600/90 hover:text-white transition-all ${mini ? "justify-center px-2 py-3" : "gap-3 px-3 py-2.5"
                        }`}
                >
                    <svg
                        className="w-5 h-5 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                    {!mini && <span>Cerrar sesión</span>}
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* ============================================
          MOBILE: HEADER TOP (sticky)
          ============================================ */}

            <header className="md:hidden fixed top-0 left-0 right-0 z-40    bg-slate-900 border-b border-slate-800 safe-top">
                <div className="flex items-center justify-between px-4 py-3">
                    <div className="min-w-0 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-sm font-bold uppercase text-white flex-shrink-0">
                            {user?.nombre?.[0] ?? "?"}
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-white truncate" >{title}</h1>
                            <p className="text-[10px] text-slate-400 truncate">{user?.nombre}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="text-slate-400 hover:text-red-500 p-2 rounded-lg hover:bg-slate-800 transition flex-shrink-0"
                        aria-label="Cerrar sesión"
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
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                    </button>
                </div>
            </header>

            {/* ============================================
          MOBILE: BOTTOM NAV (sticky)
          ============================================ */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-800 safe-bottom mt-5 ">
                <div className="flex items-stretch">
                    {items.map((item) => {
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-0.5 min-w-0 transition ${active ? "text-sky-400" : "text-slate-500 active:text-slate-300"
                                    }`}
                            >
                                <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
                                    {item.icon}
                                </span>
                                <span className="text-[9px] font-medium truncate max-w-full leading-none">
                                    {item.label}
                                </span>
                                {active && (
                                    <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sky-500 rounded-b-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>
            </nav>

            {/* ============================================
          DESKTOP: SIDEBAR IZQUIERDO
          ============================================ */}
            <aside
                className={`hidden md:flex flex-col bg-slate-900 text-slate-100 h-screen sticky top-0 flex-shrink-0 transition-[width] duration-300 ease-out ${collapsed ? "w-[72px]" : "w-60 lg:w-64 "
                    }`}
            >
                <ContenidoDesktop mini={collapsed} />
            </aside>
        </>
    );
}