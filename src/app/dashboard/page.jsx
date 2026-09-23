"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import ModalImportar from "@/components/facturas-pago/ModalImportar";
import { useAuth } from "@/hooks/useAuth";
import { mostrarFecha } from "@/lib/combustible";
import { suscribirProveedores } from "@/lib/proveedores";
import {
    ESTADOS_PAGO,
    FACTURA_PAGO_VACIA,
    actualizarFacturaPago,
    crearFacturaPago,
    eliminarFacturaPago,
    exportarExcel,
    formatMoneda,
    formatCorta,
    suscribirFacturasPago,
} from "@/lib/facturas-pago";

/* ============================================
   UTILS
   ============================================ */
function norm(str) {
    return String(str || "").trim().toLowerCase();
}

/* ============================================
   STAT CARD
   ============================================ */
function StatCard({ label, value, sub, accent = "sky" }) {
    const accents = {
        sky: "from-sky-500 to-sky-700",
        emerald: "from-emerald-500 to-emerald-700",
        amber: "from-amber-500 to-amber-700",
        red: "from-red-500 to-red-700",
        violet: "from-violet-500 to-violet-700",
        slate: "from-slate-600 to-slate-800",
    };
    return (
        <div className={`rounded-xl p-4 bg-gradient-to-br ${accents[accent]} text-white shadow-lg`}>
            <p className="text-xs uppercase tracking-wider opacity-80 font-medium">{label}</p>
            <p className="text-xl sm:text-2xl font-bold mt-1 tabular-nums break-all">{value}</p>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

/* ============================================
   PÁGINA
   ============================================ */
export default function DashboardPage() {
    const { user } = useAuth();

    const [facturas, setFacturas] = useState([]);
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [filtroEstado, setFiltroEstado] = useState("todos"); // todos | pago | pendiente
    const [filtroProveedor, setFiltroProveedor] = useState("todos");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const [modalForm, setModalForm] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FACTURA_PAGO_VACIA);
    const [guardando, setGuardando] = useState(false);

    /* ============ SUSCRIPCIONES ============ */
    useEffect(() => {
        const u1 = suscribirFacturasPago((arr) => {
            setFacturas(arr);
            setLoading(false);
        });
        const u2 = suscribirProveedores((arr) => setProveedores(arr));
        return () => {
            u1();
            u2();
        };
    }, []);

    /* ============ LISTA DE PROVEEDORES ÚNICOS ============ */
    const proveedoresUnicos = useMemo(() => {
        const set = new Set();
        // Los cargados en el módulo de proveedores
        proveedores.forEach((p) => p.proveedor && set.add(p.proveedor));
        // Y los que aparecen en facturas viejas
        facturas.forEach((f) => f.proveedor && set.add(f.proveedor));
        return Array.from(set).sort();
    }, [proveedores, facturas]);

    /* ============ FILTRADO ============ */
    const filtradas = useMemo(() => {
        let arr = [...facturas].sort((a, b) => (b.fecha || "").localeCompare(a.fecha || ""));

        if (fechaDesde) arr = arr.filter((f) => (f.fecha || "") >= fechaDesde);
        if (fechaHasta) arr = arr.filter((f) => (f.fecha || "") <= fechaHasta);

        if (filtroEstado !== "todos") arr = arr.filter((f) => f.estadoPago === filtroEstado);

        if (filtroProveedor !== "todos") {
            const clave = norm(filtroProveedor);
            arr = arr.filter((f) => norm(f.proveedor) === clave);
        }

        const q = norm(busqueda);
        if (q) {
            arr = arr.filter((f) =>
                [f.id, f.proveedor, f.numeroFactura, f.notas]
                    .filter(Boolean)
                    .some((v) => norm(v).includes(q))
            );
        }

        return arr;
    }, [facturas, busqueda, filtroEstado, filtroProveedor, fechaDesde, fechaHasta]);

    /* ============ RESUMEN ============ */
    const resumen = useMemo(() => {
        const totalPendiente = filtradas
            .filter((f) => f.estadoPago === "pendiente")
            .reduce((s, f) => s + (Number(f.monto) || 0), 0);
        const totalPagado = filtradas
            .filter((f) => f.estadoPago === "pago")
            .reduce((s, f) => s + (Number(f.monto) || 0), 0);
        const cantPendientes = filtradas.filter((f) => f.estadoPago === "pendiente").length;
        const cantPagadas = filtradas.filter((f) => f.estadoPago === "pago").length;
        return { totalPendiente, totalPagado, cantPendientes, cantPagadas, cantidad: filtradas.length };
    }, [filtradas]);

    /* ============ HANDLERS ============ */
    function abrirNueva() {
        setEditando(null);
        setForm(FACTURA_PAGO_VACIA);
        setModalForm(true);
    }

    function abrirEditar(f) {
        setEditando(f.id);
        setForm({
            fecha: f.fecha || "",
            proveedor: f.proveedor || "",
            numeroFactura: f.numeroFactura || "",
            monto: f.monto ?? "",
            estadoPago: f.estadoPago || "pendiente",
            fechaPago: f.fechaPago || "",
            notas: f.notas || "",
        });
        setModalForm(true);
    }

    function cerrarForm() {
        setModalForm(false);
        setEditando(null);
        setForm(FACTURA_PAGO_VACIA);
    }

    function onFormChange(name, value) {
        setForm((f) => {
            const next = { ...f, [name]: value };
            // Al marcar como "pagada", autocompletar fechaPago si está vacía
            if (name === "estadoPago" && value === "pago" && !next.fechaPago) {
                next.fechaPago = new Date().toISOString().slice(0, 10);
            }
            if (name === "estadoPago" && value === "pendiente") {
                next.fechaPago = "";
            }
            return next;
        });
    }

    async function guardar(e) {
        e.preventDefault();
        if (!form.fecha || !form.proveedor?.trim() || !form.monto) {
            alert("Completá fecha, proveedor y monto.");
            return;
        }
        if (form.estadoPago === "pago" && !form.fechaPago) {
            alert("Cargá la fecha de pago.");
            return;
        }

        setGuardando(true);
        try {
            if (editando) {
                await actualizarFacturaPago(editando, form);
            } else {
                await crearFacturaPago(form);
            }
            cerrarForm();
        } catch (err) {
            console.error(err);
            alert("Error al guardar.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(f) {
        if (!confirm(`¿Eliminar la factura "${f.numeroFactura || `#${f.id}`}" de ${f.proveedor}?`)) return;
        try {
            await eliminarFacturaPago(f.id);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    /* ============ TOGGLE RÁPIDO DE ESTADO ============ */
    async function toggleEstado(f) {
        const nuevo = f.estadoPago === "pago" ? "pendiente" : "pago";
        const fechaPago = nuevo === "pago" ? (f.fechaPago || new Date().toISOString().slice(0, 10)) : "";
        try {
            await actualizarFacturaPago(f.id, { ...f, estadoPago: nuevo, fechaPago });
        } catch (err) {
            console.error(err);
            alert("Error al cambiar estado.");
        }
    }

    /* ============ EXPORTAR ============ */
    function handleExportarExcel() {
        if (!filtradas.length) {
            alert("No hay facturas para exportar.");
            return;
        }
        exportarExcel(filtradas);
    }

    const formValido =
        form.fecha &&
        form.proveedor?.trim() &&
        Number(form.monto) > 0 &&
        (form.estadoPago !== "pago" || form.fechaPago);

    /* ============ RENDER ============ */
    return (
        <div>
            {/* HEADER */}
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                    <div>
                        <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                            Control de Facturas
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {facturas.length} factura{facturas.length === 1 ? "" : "s"} registrada
                            {facturas.length === 1 ? "" : "s"} · Bienvenido, <strong>{user?.nombre}</strong>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setModalImport(true)}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                            title="Importar desde Excel"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="hidden xs:inline">Importar</span>
                        </button>
                        <button
                            onClick={handleExportarExcel}
                            disabled={!filtradas.length}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition"
                            title="Exportar a Excel"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden xs:inline">Excel</span>
                        </button>
                        <button
                            onClick={abrirNueva}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Nueva factura
                        </button>
                    </div>
                </div>
            </header>

            {/* RESUMEN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatCard
                    label="Total pendiente"
                    value={formatCorta(resumen.totalPendiente)}
                    sub={`${resumen.cantPendientes} factura${resumen.cantPendientes === 1 ? "" : "s"} por pagar`}
                    accent="amber"
                />
                <StatCard
                    label="Total pagado"
                    value={formatCorta(resumen.totalPagado)}
                    sub={`${resumen.cantPagadas} factura${resumen.cantPagadas === 1 ? "" : "s"} pagada${resumen.cantPagadas === 1 ? "" : "s"}`}
                    accent="emerald"
                />
                <StatCard
                    label="Facturas"
                    value={resumen.cantidad}
                    sub={`${facturas.length} en total`}
                    accent="sky"
                />
                <StatCard
                    label="Proveedores"
                    value={proveedoresUnicos.length}
                    sub="Activos en facturas"
                    accent="violet"
                />
            </div>

            {/* FILTROS */}
            <div className="mb-4 space-y-2">
                <div className="relative">
                    <svg
                        className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por proveedor, Nº factura, notas..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <select
                        value={filtroEstado}
                        onChange={(e) => setFiltroEstado(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                        <option value="todos">Todos los estados</option>
                        <option value="pendiente">Solo pendientes</option>
                        <option value="pago">Solo pagadas</option>
                    </select>
                    <select
                        value={filtroProveedor}
                        onChange={(e) => setFiltroProveedor(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                        <option value="todos">Todos los proveedores</option>
                        {proveedoresUnicos.map((p) => (
                            <option key={p} value={p}>
                                {p}
                            </option>
                        ))}
                    </select>
                    <input
                        type="date"
                        value={fechaDesde}
                        onChange={(e) => setFechaDesde(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                    <input
                        type="date"
                        value={fechaHasta}
                        onChange={(e) => setFechaHasta(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    />
                </div>

                {(busqueda || fechaDesde || fechaHasta || filtroEstado !== "todos" || filtroProveedor !== "todos") && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                            Mostrando <strong>{filtradas.length}</strong> de {facturas.length} facturas
                        </span>
                        <button
                            onClick={() => {
                                setBusqueda("");
                                setFechaDesde("");
                                setFechaHasta("");
                                setFiltroEstado("todos");
                                setFiltroProveedor("todos");
                            }}
                            className="text-sky-600 dark:text-sky-400 hover:underline font-medium"
                        >
                            Limpiar filtros
                        </button>
                    </div>
                )}
            </div>

            {/* LISTADO */}
            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Cargando...
                </div>
            ) : filtradas.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                        {facturas.length === 0
                            ? "Todavía no hay facturas. Cargá la primera con el botón de arriba."
                            : "Sin resultados para los filtros aplicados."}
                    </p>
                </div>
            ) : (
                <>
                    {/* DESKTOP */}
                    <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-16">#</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">Fecha</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Proveedor</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-40">Nº Factura</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-32">Monto</th>
                                        <th className="text-center px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-32">Estado</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">F. Pago</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">Saldo</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtradas.map((f) => {
                                        const estado = ESTADOS_PAGO[f.estadoPago] || ESTADOS_PAGO.pendiente;
                                        const saldo = f.estadoPago === "pendiente" ? f.monto : 0;
                                        return (
                                            <tr
                                                key={f.id}
                                                className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition"
                                            >
                                                <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs">
                                                    #{f.id}
                                                </td>
                                                <td className="px-3 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap font-mono text-xs">
                                                    {mostrarFecha(f.fecha)}
                                                </td>
                                                <td className="px-3 py-3 text-slate-900 dark:text-slate-100 font-medium truncate max-w-[240px]">
                                                    {f.proveedor}
                                                    {f.notas && (
                                                        <div className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate">
                                                            {f.notas}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="px-3 py-3 text-slate-600 dark:text-slate-400 font-mono text-xs truncate">
                                                    {f.numeroFactura || "—"}
                                                </td>
                                                <td className="px-3 py-3 text-right font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                                                    {formatMoneda(f.monto)}
                                                </td>
                                                <td className="px-3 py-3 text-center">
                                                    <button
                                                        onClick={() => toggleEstado(f)}
                                                        className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide transition hover:opacity-80 ${estado.color}`}
                                                        title="Click para cambiar estado"
                                                    >
                                                        {estado.label}
                                                    </button>
                                                </td>
                                                <td className="px-3 py-3 text-slate-600 dark:text-slate-400 whitespace-nowrap font-mono text-xs">
                                                    {f.fechaPago ? mostrarFecha(f.fechaPago) : "—"}
                                                </td>
                                                <td
                                                    className={`px-3 py-3 text-right font-mono tabular-nums font-bold ${saldo > 0
                                                        ? "text-amber-600 dark:text-amber-400"
                                                        : "text-slate-400 dark:text-slate-500"
                                                        }`}
                                                >
                                                    {formatMoneda(saldo)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="flex justify-end gap-0.5">
                                                        <button
                                                            onClick={() => abrirEditar(f)}
                                                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                                            title="Editar"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => borrar(f)}
                                                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition"
                                                            title="Eliminar"
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                                <tfoot className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                                    <tr>
                                        <td colSpan={4} className="px-3 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                                            TOTALES
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                            {formatMoneda(resumen.totalPagado + resumen.totalPendiente)}
                                        </td>
                                        <td colSpan={2} className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400">
                                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                                                {formatMoneda(resumen.totalPagado)} pagado
                                            </span>
                                            {" · "}
                                            <span className="text-amber-600 dark:text-amber-400 font-semibold">
                                                {formatMoneda(resumen.totalPendiente)} pendiente
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 text-right font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                                            {formatMoneda(resumen.totalPendiente)}
                                        </td>
                                        <td></td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>

                    {/* MOBILE */}
                    <div className="md:hidden space-y-2">
                        {filtradas.map((f) => {
                            const estado = ESTADOS_PAGO[f.estadoPago] || ESTADOS_PAGO.pendiente;
                            const saldo = f.estadoPago === "pendiente" ? f.monto : 0;
                            return (
                                <div
                                    key={f.id}
                                    className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5"
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                                    #{f.id}
                                                </span>
                                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                    {mostrarFecha(f.fecha)}
                                                </span>
                                            </div>
                                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-1.5 truncate">
                                                {f.proveedor}
                                            </h3>
                                            {f.numeroFactura && (
                                                <p className="text-[11px] font-mono text-slate-400 dark:text-slate-500 truncate">
                                                    Fact. {f.numeroFactura}
                                                </p>
                                            )}
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className="text-lg font-bold text-slate-900 dark:text-slate-100 tabular-nums leading-none">
                                                {formatMoneda(f.monto)}
                                            </p>
                                            {saldo > 0 && (
                                                <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5 tabular-nums">
                                                    Saldo: {formatMoneda(saldo)}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                                        <button
                                            onClick={() => toggleEstado(f)}
                                            className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wide ${estado.color}`}
                                        >
                                            {estado.label}
                                        </button>
                                        {f.fechaPago && (
                                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                                Pago: {mostrarFecha(f.fechaPago)}
                                            </span>
                                        )}
                                        <div className="flex gap-1 ml-auto">
                                            <button
                                                onClick={() => abrirEditar(f)}
                                                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                            </button>
                                            <button
                                                onClick={() => borrar(f)}
                                                className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}

                        {/* TOTALES MOBILE */}
                        <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-4 shadow-lg">
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="opacity-80">Pagado</span>
                                    <span className="font-mono tabular-nums text-emerald-300 font-bold">
                                        {formatMoneda(resumen.totalPagado)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-80">Pendiente</span>
                                    <span className="font-mono tabular-nums text-amber-300 font-bold">
                                        {formatMoneda(resumen.totalPendiente)}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-white/20">
                                    <span className="font-semibold">Total</span>
                                    <span className="font-mono tabular-nums font-bold text-lg">
                                        {formatMoneda(resumen.totalPagado + resumen.totalPendiente)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}

            {/* MODAL FORM */}
            <Modal
                open={modalForm}
                onClose={cerrarForm}
                title={editando ? `Editar factura #${editando}` : "Nueva factura"}
                size="md"
            >
                <form onSubmit={guardar} className="space-y-4">
                    {/* FECHA + Nº FACTURA */}
                    <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Fecha <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.fecha}
                                onChange={(e) => onFormChange("fecha", e.target.value)}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Nº Factura
                            </label>
                            <input
                                type="text"
                                value={form.numeroFactura}
                                onChange={(e) => onFormChange("numeroFactura", e.target.value)}
                                placeholder="Ej: A-0001-00012345"
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition"
                            />
                        </div>
                    </div>

                    {/* PROVEEDOR (DROPDOWN) */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Proveedor <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={form.proveedor}
                            onChange={(e) => onFormChange("proveedor", e.target.value)}
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition"
                        >
                            <option value="">Seleccionar proveedor...</option>
                            {proveedoresUnicos.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                        {proveedoresUnicos.length === 0 && (
                            <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
                                ⚠ No hay proveedores cargados. Cargá uno primero en el módulo de Proveedores.
                            </p>
                        )}
                    </div>

                    {/* MONTO */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Monto <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={form.monto}
                            onChange={(e) => onFormChange("monto", e.target.value)}
                            placeholder="0.00"
                            required
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition font-semibold"
                        />
                    </div>

                    {/* ESTADO DE PAGO */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Estado de pago
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => onFormChange("estadoPago", "pendiente")}
                                className={`py-2.5 rounded-lg border-2 text-sm font-medium transition ${form.estadoPago === "pendiente"
                                    ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                                    : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                            >
                                ⏳ Pendiente
                            </button>
                            <button
                                type="button"
                                onClick={() => onFormChange("estadoPago", "pago")}
                                className={`py-2.5 rounded-lg border-2 text-sm font-medium transition ${form.estadoPago === "pago"
                                    ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                    : "border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-slate-300 dark:hover:border-slate-700"
                                    }`}
                            >
                                ✅ Pagada
                            </button>
                        </div>
                    </div>

                    {/* FECHA DE PAGO (solo si está pagada) */}
                    {form.estadoPago === "pago" && (
                        <div>
                            <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                                Fecha de pago <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={form.fechaPago}
                                onChange={(e) => onFormChange("fechaPago", e.target.value)}
                                required
                                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 dark:focus:ring-emerald-900/50 outline-none transition"
                            />
                        </div>
                    )}

                    {/* NOTAS */}
                    <div>
                        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">
                            Notas
                        </label>
                        <textarea
                            value={form.notas}
                            onChange={(e) => onFormChange("notas", e.target.value)}
                            rows={2}
                            placeholder="Observaciones opcionales..."
                            className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none transition resize-none"
                        />
                    </div>

                    {/* ACCIONES */}
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={cerrarForm}
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando || !formValido}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Crear factura"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL IMPORTAR */}
            <ModalImportar
                open={modalImport}
                onClose={() => setModalImport(false)}
                onDone={(n) =>
                    alert(`✅ ${n} factura${n === 1 ? "" : "s"} importada${n === 1 ? "" : "s"}`)
                }
            />
        </div>
    );
}