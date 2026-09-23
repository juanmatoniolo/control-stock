"use client";

import { useMemo } from "react";
import Modal from "@/components/ui/Modal";
import { mostrarFecha } from "@/lib/combustible";
import { ESTADOS, itemsDe } from "@/lib/stock";

export default function ModalDetalleProducto({ open, onClose, item, movimientos }) {
    // Historial filtrado: movimientos que contienen este código
    const movsProducto = useMemo(() => {
        if (!item) return [];
        const resultado = [];
        movimientos.forEach((m) => {
            const items = itemsDe(m);
            const it = items.find((x) => x.codigo === item.codigo);
            if (it) {
                resultado.push({
                    ...m,
                    _item: it, // solo el item correspondiente a este producto
                });
            }
        });
        return resultado.sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));
    }, [item, movimientos]);

    if (!item) return null;

    const estado = ESTADOS[item.estado] || ESTADOS.normal;

    return (
        <Modal open={open} onClose={onClose} title={`Producto ${item.codigo}`} size="lg">
            <div className="space-y-5">
                <div className="bg-gradient-to-br from-slate-50 to-sky-50/50 dark:from-slate-800/60 dark:to-sky-950/30 rounded-xl p-4 border border-slate-100 dark:border-slate-800">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 break-words">
                        {item.producto}
                    </h2>
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estado.color}`}>
                            {estado.label}
                        </span>
                        {item.huerfano && (
                            <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 rounded-full font-medium">
                                ⚠ Sin ficha
                            </span>
                        )}
                        {item.activo === false && (
                            <span className="text-xs px-2 py-0.5 bg-red-100 dark:bg-red-950/40 text-red-700 dark:text-red-400 rounded-full font-medium">
                                Inactivo
                            </span>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-2">
                    <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase text-slate-600 dark:text-slate-400 font-medium">Inicial</p>
                        <p className="text-xl font-bold text-slate-700 dark:text-slate-300 tabular-nums">{item.stockInicial}</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-950/40 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-medium">Entradas</p>
                        <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">+{item.entradas}</p>
                    </div>
                    <div className="bg-red-50 dark:bg-red-950/40 rounded-lg p-3 text-center">
                        <p className="text-[10px] uppercase text-red-700 dark:text-red-400 font-medium">Salidas</p>
                        <p className="text-xl font-bold text-red-700 dark:text-red-400 tabular-nums">−{item.salidas}</p>
                    </div>
                    <div className={`rounded-lg p-3 text-center ${estado.color}`}>
                        <p className="text-[10px] uppercase font-medium">Actual</p>
                        <p className="text-xl font-bold tabular-nums">{item.stockActual}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                        <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Stock mínimo</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">{item.stockMinimo || 0}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Último precio</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 tabular-nums">
                            ${Number(item.ultimoPrecioUnitario || 0).toLocaleString("es-AR")}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Última marca</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                            {item.ultimaMarca || "—"}
                        </p>
                    </div>
                    <div>
                        <p className="text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-0.5">Próx. vencimiento</p>
                        <p className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.proximoVencimiento ? mostrarFecha(item.proximoVencimiento) : "—"}
                        </p>
                    </div>
                </div>

                <div>
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
                        Historial de movimientos ({movsProducto.length})
                    </h3>
                    {movsProducto.length === 0 ? (
                        <p className="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
                            Sin movimientos registrados.
                        </p>
                    ) : (
                        <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                            <table className="w-full text-xs">
                                <thead className="bg-slate-100 dark:bg-slate-800 sticky top-0">
                                    <tr>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Fecha</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Tipo</th>
                                        <th className="px-2 py-2 text-right font-medium text-slate-600 dark:text-slate-400">Cant.</th>
                                        <th className="px-2 py-2 text-left font-medium text-slate-600 dark:text-slate-400">Detalle</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {movsProducto.map((m) => {
                                        const it = m._item;
                                        const esEntrada = m.tipo === "entrada";
                                        return (
                                            <tr key={m.id} className="border-t border-slate-100 dark:border-slate-800/60">
                                                <td className="px-2 py-1.5 text-slate-700 dark:text-slate-300 whitespace-nowrap">
                                                    {mostrarFecha(m.fecha)}
                                                </td>
                                                <td className="px-2 py-1.5">
                                                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${esEntrada
                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                                        }`}>
                                                        {esEntrada ? "ENT" : "SAL"}
                                                    </span>
                                                </td>
                                                <td className={`px-2 py-1.5 text-right font-semibold tabular-nums ${esEntrada
                                                    ? "text-emerald-600 dark:text-emerald-400"
                                                    : "text-red-600 dark:text-red-400"
                                                    }`}>
                                                    {esEntrada ? "+" : "−"}{it.cantidad}
                                                </td>
                                                <td className="px-2 py-1.5 text-slate-500 dark:text-slate-400 truncate max-w-[260px]">
                                                    {esEntrada
                                                        ? `${m.numeroFactura || ""} ${it.numeroLote ? `· Lote ${it.numeroLote}` : ""}`.trim() || "—"
                                                        : `${m.movimiento || ""} ${m.usuarioNombre ? `· ${m.usuarioNombre}` : ""}`.trim() || "—"}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    );
}