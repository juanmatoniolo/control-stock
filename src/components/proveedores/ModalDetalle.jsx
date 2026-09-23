"use client";

import Modal from "@/components/ui/Modal";
import CopyButton from "@/components/ui/CopyButton";
import { linkWhatsApp, linkTel, linkMail } from "@/lib/whatsapp";

/* ============================================
   FILA DE CAMPO (label + valor + copiar)
   ============================================ */
function Field({ label, value, copy = true, mono = false, full = false }) {
    if (!value || !String(value).trim()) return null;
    return (
        <div className={full ? "sm:col-span-2" : ""}>
            <dt className="text-[11px] uppercase tracking-wider text-slate-400 font-medium mb-1">
                {label}
            </dt>
            <dd className="flex items-center gap-1.5 group">
                <span
                    className={`text-sm text-slate-800 break-all flex-1 min-w-0 ${mono ? "font-mono" : ""
                        }`}
                >
                    {value}
                </span>
                {copy && <CopyButton value={value} label={`Copiar ${label}`} size="sm" />}
            </dd>
        </div>
    );
}

/* ============================================
   SECCIÓN
   ============================================ */
function Section({ title, icon, children }) {
    const hasContent = Array.isArray(children)
        ? children.some((c) => c !== null && c !== undefined && c !== false)
        : Boolean(children);
    if (!hasContent) return null;

    return (
        <div className="border-t border-slate-100 pt-4 first:border-t-0 first:pt-0">
            <h3 className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                <span className="w-4 h-4 text-slate-400 flex items-center justify-center">
                    {icon}
                </span>
                {title}
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {children}
            </dl>
        </div>
    );
}

/* ============================================
   MODAL PRINCIPAL
   ============================================ */
export default function ModalDetalle({ open, onClose, proveedor }) {
    if (!proveedor) return null;

    const p = proveedor;
    const wa = linkWhatsApp(p.telefono);
    const tel = linkTel(p.telefono);
    const mail = linkMail(p.email);

    const mensajeWA = `Hola ${p.proveedor}, te escribo desde el sistema de stock.`;

    return (
        <Modal open={open} onClose={onClose} title={`Proveedor #${p.id}`} size="md">
            <div className="space-y-5">
                {/* HEADER CON NOMBRE */}
                <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 rounded-xl p-4 border border-slate-100">
                    <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold text-slate-900 break-words">
                                {p.proveedor}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-2">
                                {p.rubro && (
                                    <span className="text-xs px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full font-medium">
                                        {p.rubro}
                                    </span>
                                )}
                                {p.situacion && (
                                    <span
                                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${/activ/i.test(p.situacion)
                                            ? "bg-emerald-100 text-emerald-700"
                                            : /inactiv/i.test(p.situacion)
                                                ? "bg-red-100 text-red-700"
                                                : "bg-slate-100 text-slate-600"
                                            }`}
                                    >
                                        {p.situacion}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ACCIONES RÁPIDAS */}
                <div className="grid grid-cols-3 gap-2">
                    <a
                        href={wa || "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => !wa && e.preventDefault()}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition ${wa
                            ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:scale-95"
                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                        </svg>
                        WhatsApp
                    </a>
                    <a
                        href={tel || "#"}
                        onClick={(e) => !tel && e.preventDefault()}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition ${tel
                            ? "bg-sky-50 text-sky-700 hover:bg-sky-100 active:scale-95"
                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                            />
                        </svg>
                        Llamar
                    </a>
                    <a
                        href={mail || "#"}
                        onClick={(e) => !mail && e.preventDefault()}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition ${mail
                            ? "bg-violet-50 text-violet-700 hover:bg-violet-100 active:scale-95"
                            : "bg-slate-50 text-slate-300 cursor-not-allowed"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                        </svg>
                        Email
                    </a>
                </div>

                {/* SECCIÓN: CONTACTO */}
                <Section
                    title="Contacto"
                    icon={
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                    }
                >
                    <Field label="Teléfono" value={p.telefono} mono />
                    <Field label="Email" value={p.email} />
                    <Field
                        label="Alias RCEL"
                        value={p.aliasRcel}
                        mono
                        full={Boolean(p.aliasRcel) && !p.telefono}
                    />
                </Section>

                {/* SECCIÓN: DATOS BANCARIOS */}
                <Section
                    title="Datos bancarios"
                    icon={
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                    }
                >
                    <Field label="Banco" value={p.banco} />
                    <Field label="CBU" value={p.cbu} mono full={Boolean(p.cbu)} />
                    <Field label="Alias" value={p.alias} mono full={Boolean(p.alias)} />
                </Section>

                {/* SECCIÓN: DATOS FISCALES */}
                <Section
                    title="Datos fiscales"
                    icon={
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    }
                >
                    <Field label="CUIT" value={p.cuit} mono />
                    <Field label="Situación" value={p.situacion} />
                    <Field label="Rubro / Concepto" value={p.rubro} full />
                </Section>

                {/* SECCIÓN: UBICACIÓN */}
                <Section
                    title="Ubicación"
                    icon={
                        <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    }
                >
                    <Field label="Dirección" value={p.direccion} full />
                </Section>

                {/* BOTÓN WHATSAPP GRANDE (abajo) */}
                {wa && (
                    <a
                        href={`${wa}${wa.includes("?") ? "&" : "?"}text=${encodeURIComponent(mensajeWA)}`}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center gap-2 w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-xl transition"
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                        </svg>
                        Enviar mensaje por WhatsApp
                    </a>
                )}
            </div>
        </Modal>
    );
}