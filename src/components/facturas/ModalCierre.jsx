"use client";

import { useState } from "react";
import Modal from "@/components/ui/Modal";

function formatMoneda(n) {
    const num = Number(n) || 0;
    return (
        "$" +
        num.toLocaleString("es-AR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })
    );
}

export default function ModalCierre({ open, onClose, stats, onConfirm }) {
    const [nombre, setNombre] = useState(`Ejercicio ${new Date().getFullYear()}`);
    const [modo, setModo] = useState("continuar");
    const [crearSaldoInicial, setCrearSaldoInicial] = useState(true);
    const [confirmando, setConfirmando] = useState(false);
    const [procesando, setProcesando] = useState(false);

    const {
        cantidadMovimientos = 0,
        totalIngresos = 0,
        totalEgresos = 0,
        saldoFinal = 0,
        fechaInicio = "",
        fechaFin = "",
    } = stats || {};

    async function handleConfirmar() {
        if (modo === "archivar" && !confirmando) {
            setConfirmando(true);
            return;
        }
        setProcesando(true);
        try {
            await onConfirm({
                nombre,
                modo,
                crearSaldoInicial,
                saldoFinal,
                totalIngresos,
                totalEgresos,
                cantidadMovimientos,
            });
            onClose();
        } catch (err) {
            console.error(err);
            alert("Error al cerrar ejercicio: " + err.message);
        } finally {
            setProcesando(false);
        }
    }

    function handleClose() {
        if (procesando) return;
        setConfirmando(false);
        onClose();
    }

    return (
        <Modal open={open} onClose={handleClose} title="Cierre de ejercicio contable" size="lg">
            <div className="space-y-4">
                {/* AVISO */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3 flex items-start gap-2">
                    <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <div className="text-xs text-amber-800 dark:text-amber-300">
                        <p className="font-semibold mb-0.5">Esta acción cierra el ejercicio contable</p>
                        <p>Se reiniciará la numeración y podés empezar un nuevo período. Elegí con cuidado.</p>
                    </div>
                </div>

                {/* RESUMEN */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-4">
                    <h3 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Resumen del ejercicio actual
                    </h3>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">Movimientos</p>
                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                {cantidadMovimientos}
                            </p>
                        </div>
                        {(fechaInicio || fechaFin) && (
                            <div>
                                <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">Período</p>
                                <p className="text-xs font-medium text-slate-700 dark:text-slate-300 mt-1">
                                    {fechaInicio} → {fechaFin}
                                </p>
                            </div>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <div>
                            <p className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 font-medium">Total ingresos</p>
                            <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                                {formatMoneda(totalIngresos)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[10px] uppercase text-red-600 dark:text-red-400 font-medium">Total egresos</p>
                            <p className="text-base font-bold text-red-600 dark:text-red-400 tabular-nums">
                                {formatMoneda(totalEgresos)}
                            </p>
                        </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">Saldo de cierre</p>
                        <p
                            className={`text-2xl font-bold tabular-nums ${saldoFinal >= 0
                                ? "text-slate-900 dark:text-slate-100"
                                : "text-red-600 dark:text-red-400"
                                }`}
                        >
                            {formatMoneda(saldoFinal)}
                        </p>
                    </div>
                </div>

                {/* NOMBRE DEL EJERCICIO */}
                <div>
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Nombre del ejercicio
                    </label>
                    <input
                        type="text"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        placeholder="Ej: Ejercicio 2026"
                        className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition"
                    />
                </div>

                {/* MODO */}
                <div className="space-y-2">
                    <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                        ¿Qué hacer con los movimientos actuales?
                    </label>

                    {/* CONTINUAR */}
                    <label
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${modo === "continuar"
                            ? "border-sky-500 bg-sky-50 dark:bg-sky-950/30"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                    >
                        <input
                            type="radio"
                            name="modo"
                            value="continuar"
                            checked={modo === "continuar"}
                            onChange={() => {
                                setModo("continuar");
                                setConfirmando(false);
                            }}
                            className="mt-0.5"
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                🔄 Cerrar y continuar
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Mantiene todo el histórico. Reinicia la numeración a #1 y crea un asiento de saldo inicial.
                                Útil si querés seguir viendo el libro completo.
                            </p>
                        </div>
                    </label>

                    {/* ARCHIVAR */}
                    <label
                        className={`flex items-start gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${modo === "archivar"
                            ? "border-red-500 bg-red-50 dark:bg-red-950/30"
                            : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
                            }`}
                    >
                        <input
                            type="radio"
                            name="modo"
                            value="archivar"
                            checked={modo === "archivar"}
                            onChange={() => setModo("archivar")}
                            className="mt-0.5"
                        />
                        <div className="min-w-0">
                            <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                🗄️ Cerrar y archivar
                            </p>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                Guarda una <strong>copia de seguridad</strong> de todos los movimientos en el archivo de cierres
                                y luego <strong>borra todo</strong> del libro activo. Se ve un libro limpio desde cero.
                            </p>
                        </div>
                    </label>
                </div>

                {/* CREAR SALDO INICIAL */}
                <label className="flex items-start gap-2 cursor-pointer select-none p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <input
                        type="checkbox"
                        checked={crearSaldoInicial}
                        onChange={(e) => setCrearSaldoInicial(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-sky-600 focus:ring-sky-500"
                    />
                    <div>
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                            Crear asiento de saldo inicial
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Agrega un movimiento "{nombre}" con el saldo de cierre{" "}
                            <strong>{formatMoneda(saldoFinal)}</strong> para no perder el arrastre.
                        </p>
                    </div>
                </label>

                {/* CONFIRMACIÓN EXTRA PARA ARCHIVAR */}
                {confirmando && (
                    <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-lg p-3">
                        <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                            ⚠️ Confirmación requerida
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400">
                            Estás por <strong>archivar y borrar</strong> los {cantidadMovimientos} movimientos del libro activo.
                            Se guardará una copia en <code className="font-mono bg-red-100 dark:bg-red-950/60 px-1 rounded">/cierres</code> pero ya no serán visibles en el libro.
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400 mt-2 font-semibold">
                            ¿Confirmás el cierre?
                        </p>
                    </div>
                )}

                {/* ACCIONES */}
                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={procesando}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-50 rounded-lg transition"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirmar}
                        disabled={procesando || !nombre.trim()}
                        className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition disabled:cursor-not-allowed ${modo === "archivar"
                            ? "bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900"
                            : "bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900"
                            }`}
                    >
                        {procesando
                            ? "Procesando..."
                            : confirmando && modo === "archivar"
                                ? "⚠️ Sí, archivar y cerrar"
                                : "Confirmar cierre"}
                    </button>
                </div>
            </div>
        </Modal>
    );
}