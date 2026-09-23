"use client";

import Modal from "@/components/ui/Modal";
import CopyButton from "@/components/ui/CopyButton";
import { linkWhatsApp, linkTel, linkMail } from "@/lib/whatsapp";
import { nombreCompleto, ROLES, esChofer, esEnfermero } from "@/lib/choferes";

function Field({ label, value, copy = true, mono = false, full = false, extra }) {
    if (!value || !String(value).trim()) return null;
    return (
        <div className={full ? "sm:col-span-2" : ""}>
            <dt className="text-[11px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-medium mb-1">
                {label}
            </dt>
            <dd className="flex items-center gap-1.5 group">
                <span
                    className={`text-sm text-slate-800 dark:text-slate-200 break-all flex-1 min-w-0 ${mono ? "font-mono" : ""
                        }`}
                >
                    {value}
                </span>
                {extra}
                {copy && <CopyButton value={value} label={`Copiar ${label}`} size="sm" />}
            </dd>
        </div>
    );
}

function Section({ title, children }) {
    const hasContent = Array.isArray(children)
        ? children.some((c) => c !== null && c !== undefined && c !== false)
        : Boolean(children);
    if (!hasContent) return null;
    return (
        <div className="border-t border-slate-100 dark:border-slate-800 pt-4 first:border-t-0 first:pt-0">
            <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                {title}
            </h3>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                {children}
            </dl>
        </div>
    );
}

function formatearFecha(iso) {
    if (!iso) return "";
    const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return iso;
    return `${m[3]}/${m[2]}/${m[1]}`;
}

function diasHastaVencimiento(iso) {
    if (!iso) return null;
    const [y, m, d] = iso.split("-").map(Number);
    const venc = new Date(y, m - 1, d);
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    return Math.ceil((venc - hoy) / (1000 * 60 * 60 * 24));
}

export default function ModalDetalleChofer({ open, onClose, chofer }) {
    if (!chofer) return null;
    const c = chofer;
    const wa = linkWhatsApp(c.telefono);
    const tel = linkTel(c.telefono);
    const mail = linkMail(c.email);
    const mensajeWA = `Hola ${c.nombre}, te escribo desde el sistema de stock.`;
    const diasLic = diasHastaVencimiento(c.licenciaVencimiento);
    const licenciaVencida = diasLic !== null && diasLic < 0;
    const licenciaPorVencer = diasLic !== null && diasLic >= 0 && diasLic <= 30;

    return (
        <Modal open={open} onClose={onClose} title={`Chofer #${c.id}`} size="md">
            <div className="space-y-5">
                {/* HEADER */}
                <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 dark:from-slate-800/60 dark:to-sky-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-xl font-bold uppercase text-white shadow-lg flex-shrink-0">
                            {c.nombre?.[0] || "?"}
                            {c.apellido?.[0] || ""}
                        </div>
                        <div className="min-w-0 flex-1">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 break-words">
                                {nombreCompleto(c)}
                            </h2>
                            <div className="flex flex-wrap items-center gap-2 mt-1.5">
                                <span
                                    className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${ROLES[c.rol || "chofer"]?.color || ROLES.chofer.color
                                        }`}
                                >
                                    <span>{ROLES[c.rol || "chofer"]?.icon || "🚑"}</span>
                                    {ROLES[c.rol || "chofer"]?.label || "Chofer"}
                                </span>
                                <span
                                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.activo !== false
                                        ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300"
                                        : "bg-red-100 dark:bg-red-950/60 text-red-700 dark:text-red-300"
                                        }`}
                                >
                                    {c.activo !== false ? "Activo" : "Baja"}
                                </span>
                                {c.licencia && (
                                    <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-full font-mono">
                                        Lic. {c.licencia}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* AVISO VENCIMIENTO LICENCIA */}
                    {licenciaVencida && (
                        <div className="mt-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 rounded-lg px-3 py-2 text-xs text-red-700 dark:text-red-400 flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Licencia vencida hace {Math.abs(diasLic)} día{Math.abs(diasLic) === 1 ? "" : "s"}
                        </div>
                    )}
                    {licenciaPorVencer && (
                        <div className="mt-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                            <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            Licencia vence en {diasLic} día{diasLic === 1 ? "" : "s"}
                        </div>
                    )}
                </div>

                {/* ACCIONES RÁPIDAS */}
                <div className="grid grid-cols-3 gap-2">
                    <a
                        href={wa || "#"}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => !wa && e.preventDefault()}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition ${wa
                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 active:scale-95"
                            : "bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347" />
                        </svg>
                        WhatsApp
                    </a>
                    <a
                        href={tel || "#"}
                        onClick={(e) => !tel && e.preventDefault()}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition ${tel
                            ? "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-950/60 active:scale-95"
                            : "bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        Llamar
                    </a>
                    <a
                        href={mail || "#"}
                        onClick={(e) => !mail && e.preventDefault()}
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl text-xs font-medium transition ${mail
                            ? "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-950/60 active:scale-95"
                            : "bg-slate-50 dark:bg-slate-800/40 text-slate-300 dark:text-slate-600 cursor-not-allowed"
                            }`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        Email
                    </a>
                </div>

                {/* CONTACTO */}
                <Section title="Contacto">
                    <Field label="Teléfono" value={c.telefono} mono />
                    <Field label="Email" value={c.email} />
                </Section>

                {/* DOCUMENTACIÓN */}
                <Section title="Documentación">
                    <Field label="DNI" value={c.dni} mono />
                    <Field label="Fecha de nacimiento" value={formatearFecha(c.fechaNacimiento)} />
                    <Field label="N° Licencia" value={c.licencia} mono />
                    <Field label="Vencimiento licencia" value={formatearFecha(c.licenciaVencimiento)} />
                </Section>

                {/* UBICACIÓN */}
                <Section title="Ubicación">
                    <Field label="Dirección" value={c.direccion} full />
                </Section>

                {/* NOTAS */}
                {c.notas && (
                    <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
                        <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                            Notas
                        </h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                            {c.notas}
                        </p>
                    </div>
                )}

                {/* WHATSAPP GRANDE */}
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