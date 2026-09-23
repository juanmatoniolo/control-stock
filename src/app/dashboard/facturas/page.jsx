"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import FormFactura from "@/components/facturas/FormFactura";
import FormFacturaBatch from "@/components/facturas/FormFacturaBatch";
import ModalImportar from "@/components/facturas/ModalImportar";
import ModalCierre from "@/components/facturas/ModalCierre";
import AnalisisAvanzado from "@/components/facturas/AnalisisAvanzado";
import {
    FACTURA_VACIA,
    actualizarFactura,
    calcularSaldos,
    cerrarEjercicio,
    crearFactura,
    crearFacturasBatch,
    eliminarFactura,
    eliminarTodo,
    exportarExcel,
    exportarPDF,
    normalizarTexto,
    suscribirFacturas,
} from "@/lib/facturas";
import { mostrarFecha } from "@/lib/combustible";

/* ============================================
   HELPERS
   ============================================ */
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

function formatCorta(n) {
    const num = Number(n) || 0;
    if (Math.abs(num) >= 1_000_000)
        return `$${(num / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
    if (Math.abs(num) >= 1_000)
        return `$${(num / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 0 })}k`;
    return `$${num.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}

/* ============================================
   BADGE
   ============================================ */
function BadgeSaldo({ saldo, tipo = "acumulado" }) {
    const positivo = Number(saldo) >= 0;
    // Labels distintos según el contexto
    let label;
    if (tipo === "periodo") {
        label = positivo ? "Ganancia" : "Pérdida";
    } else if (tipo === "acumulado") {
        label = positivo ? "A favor" : "En contra";
    } else {
        label = positivo ? "Positivo" : "Negativo";
    }

    return (
        <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${positivo ? "bg-emerald-400/20 text-emerald-100" : "bg-red-400/30 text-red-50"
                }`}
        >
            {positivo ? (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
            ) : (
                <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth="3" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
            )}
            {label}
        </span>
    );
}

/* ============================================
   STAT CARD
   ============================================ */
function StatCard({ label, value, sub, accent = "sky", icon, badge }) {
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
            <div className="flex items-start justify-between gap-2">
                <p className="text-xs uppercase tracking-wider opacity-80 font-medium">{label}</p>
                {icon && <span className="opacity-60 flex-shrink-0">{icon}</span>}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
                <p className="text-xl sm:text-2xl font-bold tabular-nums break-all">{value}</p>
                {badge}
            </div>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

/* ============================================
   TAB BUTTON
   ============================================ */
function TabButton({ active, onClick, children, count }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition whitespace-nowrap ${active
                ? "border-sky-500 text-sky-600 dark:text-sky-400"
                : "border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200"
                }`}
        >
            {children}
            {count != null && (
                <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold tabular-nums ${active
                        ? "bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                        }`}
                >
                    {count}
                </span>
            )}
        </button>
    );
}

/* ============================================
   PÁGINA
   ============================================ */
export default function FacturasPage() {
    const [tab, setTab] = useState("libro"); // libro | estadisticas | peligro

    const [facturas, setFacturas] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");
    const [filtroProveedor, setFiltroProveedor] = useState("todos");
    const [filtroCategoria, setFiltroCategoria] = useState("todas");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [periodoRapido, setPeriodoRapido] = useState("");

    const [modalForm, setModalForm] = useState(false);
    const [modalBatch, setModalBatch] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [modalCierre, setModalCierre] = useState(false);
    const [modalEliminarTodo, setModalEliminarTodo] = useState(false);

    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(FACTURA_VACIA);
    const [asientosBatch, setAsientosBatch] = useState([]);
    const [confirmText, setConfirmText] = useState("");
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const unsub = suscribirFacturas((arr) => {
            setFacturas(arr);
            setLoading(false);
        });
        return () => unsub();
    }, []);

    const conSaldo = useMemo(() => calcularSaldos(facturas), [facturas]);

    /* ============ LISTAS ÚNICAS (NORMALIZADAS) ============ */
    const proveedoresUnicos = useMemo(() => {
        const mapa = new Map();
        facturas.forEach((f) => {
            if (!f.proveedor) return;
            const clave = normalizarTexto(f.proveedor).toLowerCase();
            if (!mapa.has(clave)) mapa.set(clave, normalizarTexto(f.proveedor));
        });
        return Array.from(mapa.values()).sort();
    }, [facturas]);

    const categoriasUnicas = useMemo(() => {
        const mapa = new Map();
        facturas.forEach((f) => {
            if (!f.categoria) return;
            const clave = normalizarTexto(f.categoria).toLowerCase();
            if (!mapa.has(clave)) mapa.set(clave, normalizarTexto(f.categoria));
        });
        return Array.from(mapa.values()).sort();
    }, [facturas]);

    /* ============ FILTRADO ============ */
    const filtradas = useMemo(() => {
        let arr = conSaldo;

        if (fechaDesde) arr = arr.filter((f) => (f.fecha || "") >= fechaDesde);
        if (fechaHasta) arr = arr.filter((f) => (f.fecha || "") <= fechaHasta);

        if (filtroProveedor !== "todos") {
            const clave = normalizarTexto(filtroProveedor).toLowerCase();
            arr = arr.filter((f) => normalizarTexto(f.proveedor).toLowerCase() === clave);
        }

        if (filtroCategoria !== "todas") {
            const clave = normalizarTexto(filtroCategoria).toLowerCase();
            arr = arr.filter((f) => normalizarTexto(f.categoria).toLowerCase() === clave);
        }

        if (filtroTipo === "ingreso") arr = arr.filter((f) => Number(f.ingresos) > 0);
        if (filtroTipo === "egreso") arr = arr.filter((f) => Number(f.egresos) > 0);

        const q = normalizarTexto(busqueda).toLowerCase();
        if (q) {
            arr = arr.filter((f) =>
                [f.id, f.concepto, f.comprobante, f.proveedor, f.categoria, f.notas]
                    .filter(Boolean)
                    .some((v) => String(v).toLowerCase().includes(q))
            );
        }
        return arr;
    }, [conSaldo, fechaDesde, fechaHasta, filtroProveedor, filtroCategoria, filtroTipo, busqueda]);

    const saldoInicialPeriodo = useMemo(() => {
        if (!filtradas.length) return 0;
        const primerId = filtradas[0].id;
        const idx = conSaldo.findIndex((f) => f.id === primerId);
        if (idx <= 0) return 0;
        return Number(conSaldo[idx - 1].saldo) || 0;
    }, [filtradas, conSaldo]);

    const resumen = useMemo(() => {
        const totalIng = filtradas.reduce((s, f) => s + (Number(f.ingresos) || 0), 0);
        const totalEgr = filtradas.reduce((s, f) => s + (Number(f.egresos) || 0), 0);
        // ✅ Balance del período = solo lo que pasó en el rango filtrado
        const saldoPeriodo = totalIng - totalEgr;
        // Saldo corrido acumulado (histórico hasta el último asiento del período)
        const saldoAcumuladoFinal =
            filtradas.length > 0
                ? Number(filtradas[filtradas.length - 1].saldo) || 0
                : saldoInicialPeriodo;
        return {
            totalIng,
            totalEgr,
            saldoPeriodo,
            saldoAcumuladoFinal,
            cantidad: filtradas.length,
        };
    }, [filtradas, saldoInicialPeriodo]);


    const statsGlobales = useMemo(() => {
        const totalIng = facturas.reduce((s, f) => s + (Number(f.ingresos ?? f.creditos) || 0), 0);
        const totalEgr = facturas.reduce((s, f) => s + (Number(f.egresos ?? f.debitos) || 0), 0);
        const saldoFinal = conSaldo.length ? Number(conSaldo[conSaldo.length - 1].saldo) || 0 : 0;
        const fechas = facturas.map((f) => f.fecha).filter(Boolean).sort();
        return {
            cantidadMovimientos: facturas.length,
            totalIngresos: totalIng,
            totalEgresos: totalEgr,
            saldoFinal,
            fechaInicio: fechas[0] || "",
            fechaFin: fechas[fechas.length - 1] || "",
        };
    }, [facturas, conSaldo]);

    const mesesDisponibles = useMemo(() => {
        const set = new Set();
        facturas.forEach((f) => {
            if (f.fecha && f.fecha.length >= 7) set.add(f.fecha.slice(0, 7));
        });
        return Array.from(set).sort().reverse();
    }, [facturas]);

    function aplicarPeriodo(valor) {
        setPeriodoRapido(valor);
        if (!valor) {
            setFechaDesde("");
            setFechaHasta("");
            return;
        }
        if (/^\d{4}$/.test(valor)) {
            setFechaDesde(`${valor}-01-01`);
            setFechaHasta(`${valor}-12-31`);
            return;
        }
        if (/^\d{4}-\d{2}$/.test(valor)) {
            const [y, m] = valor.split("-").map(Number);
            const inicio = `${y}-${String(m).padStart(2, "0")}-01`;
            const fin = new Date(y, m, 0).toISOString().slice(0, 10);
            setFechaDesde(inicio);
            setFechaHasta(fin);
        }
    }

    function limpiarFiltros() {
        setBusqueda("");
        setFechaDesde("");
        setFechaHasta("");
        setFiltroProveedor("todos");
        setFiltroCategoria("todas");
        setFiltroTipo("todos");
        setPeriodoRapido("");
    }

    /* ============ HANDLERS ============ */
    function abrirNuevo() {
        setEditando(null);
        setForm(FACTURA_VACIA);
        setModalForm(true);
    }

    function abrirBatch() {
        setAsientosBatch([]);
        setModalBatch(true);
    }

    function abrirEditar(f) {
        setEditando(f.id);
        setForm({
            fecha: f.fecha || "",
            concepto: f.concepto || "",
            comprobante: f.comprobante || "",
            proveedor: f.proveedor || "",
            ingresos: f.ingresos ?? "",
            egresos: f.egresos ?? "",
            categoria: f.categoria || "",
            notas: f.notas || "",
        });
        setModalForm(true);
    }

    function cerrarForm() {
        setModalForm(false);
        setEditando(null);
        setForm(FACTURA_VACIA);
    }

    function cerrarBatch() {
        setModalBatch(false);
        setAsientosBatch([]);
    }

    function onFormChange(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function guardar(e) {
        e.preventDefault();
        if (!form.fecha || !form.concepto?.trim()) {
            alert("Completá fecha y concepto.");
            return;
        }
        if (!form.ingresos && !form.egresos) {
            alert("Cargá un monto en ingresos o egresos.");
            return;
        }
        setGuardando(true);
        try {
            if (editando) {
                await actualizarFactura(editando, form);
            } else {
                await crearFactura(form);
            }
            cerrarForm();
        } catch (err) {
            console.error(err);
            alert("Error al guardar.");
        } finally {
            setGuardando(false);
        }
    }

    async function guardarBatch() {
        if (!asientosBatch.length) {
            alert("Agregá al menos un asiento a la lista.");
            return;
        }
        setGuardando(true);
        try {
            const ids = await crearFacturasBatch(asientosBatch);
            alert(`✅ ${ids.length} asiento${ids.length === 1 ? "" : "s"} contable${ids.length === 1 ? "" : "s"} registrado${ids.length === 1 ? "" : "s"}`);
            cerrarBatch();
        } catch (err) {
            console.error(err);
            alert("Error al guardar los asientos.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(f) {
        if (!confirm(`¿Eliminar el movimiento del ${mostrarFecha(f.fecha)}?\n\n"${f.concepto}"\n\nLos saldos se recalcularán automáticamente.`)) return;
        try {
            await eliminarFactura(f.id);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    async function confirmarCierre(opciones) {
        await cerrarEjercicio(opciones);
        alert(`✅ Ejercicio cerrado correctamente\n\n${opciones.nombre}`);
        setModalCierre(false);
    }

    async function confirmarEliminarTodo() {
        if (confirmText !== "ELIMINAR") return;
        try {
            await eliminarTodo();
            alert("✅ Libro contable vaciado");
            setConfirmText("");
            setModalEliminarTodo(false);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    function handleExportarExcel() {
        if (!filtradas.length) {
            alert("No hay movimientos para exportar.");
            return;
        }
        exportarExcel(filtradas);
    }

    function handleExportarPDF() {
        if (!filtradas.length) {
            alert("No hay movimientos para exportar.");
            return;
        }
        let subtitulo = "";
        if (fechaDesde && fechaHasta) {
            subtitulo = `Período: ${mostrarFecha(fechaDesde)} al ${mostrarFecha(fechaHasta)}`;
        } else if (fechaDesde) {
            subtitulo = `Desde: ${mostrarFecha(fechaDesde)}`;
        } else if (fechaHasta) {
            subtitulo = `Hasta: ${mostrarFecha(fechaHasta)}`;
        }
        if (filtroProveedor !== "todos") subtitulo += `${subtitulo ? " · " : ""}Proveedor: ${filtroProveedor}`;
        if (filtroCategoria !== "todas") {
            const cat = filtroCategoria.length > 50 ? filtroCategoria.slice(0, 47) + "..." : filtroCategoria;
            subtitulo += `${subtitulo ? " · " : ""}Categoría: ${cat}`;
        }
        if (filtroTipo !== "todos") subtitulo += `${subtitulo ? " · " : ""}Solo ${filtroTipo === "ingreso" ? "ingresos" : "egresos"}`;
        if (!subtitulo) subtitulo = `Todos los movimientos (${filtradas.length})`;

        exportarPDF(filtradas, {
            titulo: "LIBRO CONTABLE",
            subtitulo,
            saldoInicial: saldoInicialPeriodo,
            mostrarSaldoInicial: filtradas.length > 0 && (Boolean(fechaDesde) || Boolean(fechaHasta)),
        });
    }

    const formValido =
        form.fecha && form.concepto?.trim() && (Number(form.ingresos) > 0 || Number(form.egresos) > 0);

    /* ============ RENDER ============ */
    return (
        <div>
            {/* HEADER */}
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                            Libro Contable
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {facturas.length} asiento{facturas.length === 1 ? "" : "s"} contable{facturas.length === 1 ? "" : "s"}
                        </p>
                    </div>

                    {/* ACCIONES SOLO EN TAB LIBRO */}
                    {tab === "libro" && (
                        <div className="flex flex-wrap gap-2">
                            <button
                                onClick={() => setModalImport(true)}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
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
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                                <span className="hidden xs:inline">Excel</span>
                            </button>
                            <button
                                onClick={handleExportarPDF}
                                disabled={!filtradas.length}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 dark:disabled:bg-violet-900 disabled:cursor-not-allowed rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                PDF
                            </button>
                            <button
                                onClick={abrirBatch}
                                className="inline-flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                                title="Cargar varios asientos de una"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                                <span className="hidden xs:inline">Lote</span>
                            </button>
                            <button
                                onClick={abrirNuevo}
                                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Nuevo
                            </button>
                        </div>
                    )}
                </div>
            </header>

            {/* TABS */}
            <div className="border-b border-slate-200 dark:border-slate-800 mb-5 overflow-x-auto">
                <div className="flex min-w-max">
                    <TabButton active={tab === "libro"} onClick={() => setTab("libro")} count={facturas.length}>
                        📖 Libro Contable
                    </TabButton>
                    <TabButton active={tab === "estadisticas"} onClick={() => setTab("estadisticas")}>
                        📊 Estadísticas
                    </TabButton>
                    <TabButton active={tab === "peligro"} onClick={() => setTab("peligro")}>
                        ⚠️ Peligro
                    </TabButton>
                </div>
            </div>

            {/* ============================================
          TAB LIBRO
          ============================================ */}
            {tab === "libro" && (
                <>
                    {/* RESUMEN */}
                    {/* RESUMEN */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                        {/* SALDO ACUMULADO (histórico completo) */}
                        <StatCard
                            label="Saldo acumulado"
                            value={formatCorta(conSaldo.length ? conSaldo[conSaldo.length - 1].saldo : 0)}
                            sub="Histórico total · todos los períodos"
                            accent={conSaldo.length && conSaldo[conSaldo.length - 1].saldo < 0 ? "red" : "emerald"}
                            badge={conSaldo.length > 0 && (
                                <BadgeSaldo saldo={conSaldo[conSaldo.length - 1].saldo} tipo="acumulado" />
                            )}
                        />

                        {/* INGRESOS DEL PERÍODO */}
                        <StatCard
                            label="Ingresos del período"
                            value={formatCorta(resumen.totalIng)}
                            sub={`${resumen.cantidad} asiento${resumen.cantidad === 1 ? "" : "s"} en el rango`}
                            accent="emerald"
                        />

                        {/* EGRESOS DEL PERÍODO */}
                        <StatCard
                            label="Egresos del período"
                            value={formatCorta(resumen.totalEgr)}
                            sub="En el rango filtrado"
                            accent="red"
                        />

                        {/* BALANCE DEL PERÍODO (ingresos − egresos) */}
                        <StatCard
                            label="Balance del período"
                            value={formatCorta(resumen.saldoPeriodo)}
                            sub={
                                resumen.saldoPeriodo >= 0
                                    ? "Ingresos superan a egresos"
                                    : "Egresos superan a ingresos"
                            }
                            accent={resumen.saldoPeriodo < 0 ? "red" : "emerald"}
                            badge={<BadgeSaldo saldo={resumen.saldoPeriodo} tipo="periodo" />}
                        />
                    </div>

                    {/* SALDO INICIAL DEL PERÍODO (aclaración) */}
                    {(fechaDesde || fechaHasta || periodoRapido) && (
                        <div className="mb-4 bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-lg px-4 py-2.5 flex items-center gap-3 text-xs">
                            <svg className="w-4 h-4 text-slate-500 dark:text-slate-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="text-slate-600 dark:text-slate-400">
                                Saldo al inicio del período:{" "}
                                <strong className={`font-mono tabular-nums ${saldoInicialPeriodo >= 0
                                        ? "text-slate-800 dark:text-slate-200"
                                        : "text-red-600 dark:text-red-400"
                                    }`}>
                                    {formatMoneda(saldoInicialPeriodo)}
                                </strong>
                                {" · "}Este saldo viene arrastrado de asientos anteriores al rango seleccionado.
                            </span>
                        </div>
                    )}

                    {/* PERÍODO RÁPIDO */}

                    {/* PERÍODO RÁPIDO */}
                    <div className="mb-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                Período rápido:
                            </span>
                            <button
                                onClick={() => aplicarPeriodo("")}
                                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${!periodoRapido
                                    ? "bg-sky-600 text-white"
                                    : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                    }`}
                            >
                                Todo
                            </button>
                            {mesesDisponibles.slice(0, 6).map((m) => {
                                const [y, mes] = m.split("-");
                                const nombre = new Date(Number(y), Number(mes) - 1).toLocaleDateString("es-AR", {
                                    month: "short",
                                    year: "numeric",
                                });
                                return (
                                    <button
                                        key={m}
                                        onClick={() => aplicarPeriodo(m)}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${periodoRapido === m
                                            ? "bg-sky-600 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                                            }`}
                                    >
                                        {nombre}
                                    </button>
                                );
                            })}
                            {mesesDisponibles.length > 6 && (
                                <select
                                    value={periodoRapido}
                                    onChange={(e) => aplicarPeriodo(e.target.value)}
                                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 outline-none"
                                >
                                    <option value="">Más meses...</option>
                                    {mesesDisponibles.slice(6).map((m) => {
                                        const [y, mes] = m.split("-");
                                        const nombre = new Date(Number(y), Number(mes) - 1).toLocaleDateString("es-AR", {
                                            month: "long",
                                            year: "numeric",
                                        });
                                        return (
                                            <option key={m} value={m}>
                                                {nombre.charAt(0).toUpperCase() + nombre.slice(1)}
                                            </option>
                                        );
                                    })}
                                </select>
                            )}
                        </div>
                    </div>

                    {/* FILTROS */}
                    <div className="mb-4 space-y-2">
                        <div className="relative">
                            <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Buscar por concepto, comprobante, proveedor, categoría..."
                                className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
                            <input
                                type="date"
                                value={fechaDesde}
                                onChange={(e) => {
                                    setFechaDesde(e.target.value);
                                    setPeriodoRapido("");
                                }}
                                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
                            <input
                                type="date"
                                value={fechaHasta}
                                onChange={(e) => {
                                    setFechaHasta(e.target.value);
                                    setPeriodoRapido("");
                                }}
                                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            />
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
                            <select
                                value={filtroCategoria}
                                onChange={(e) => setFiltroCategoria(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            >
                                <option value="todas">Todas las categorías</option>
                                {categoriasUnicas.map((c) => (
                                    <option key={c} value={c}>
                                        {c.length > 50 ? c.slice(0, 47) + "..." : c}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value)}
                                className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                            >
                                <option value="todos">Todos los tipos</option>
                                <option value="ingreso">Solo ingresos</option>
                                <option value="egreso">Solo egresos</option>
                            </select>
                        </div>

                        {(busqueda || fechaDesde || fechaHasta || filtroProveedor !== "todos" || filtroCategoria !== "todas" || filtroTipo !== "todos") && (
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-500 dark:text-slate-400">
                                    Mostrando <strong>{filtradas.length}</strong> de {conSaldo.length} asientos
                                </span>
                                <button
                                    onClick={limpiarFiltros}
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
                                    ? "Todavía no hay asientos. Cargá el primero o importá desde Excel."
                                    : "Sin resultados para los filtros aplicados."}
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* DESKTOP */}
                            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                            <tr>
                                                <th className="text-left px-2 py-3 font-semibold text-slate-600 dark:text-slate-400 w-16">#</th>
                                                <th className="text-left px-2 py-3 font-semibold text-slate-600 dark:text-slate-400 w-20">Fecha</th>
                                                <th className="text-left px-2 py-3 font-semibold text-slate-600 dark:text-slate-400">Concepto</th>
                                                <th className="text-left px-2 py-3 font-semibold text-slate-600 dark:text-slate-400 w-32">Comprobante</th>
                                                <th className="text-left px-2 py-3 font-semibold text-slate-600 dark:text-slate-400 w-40">Proveedor</th>
                                                <th className="text-right px-2 py-3 font-semibold text-emerald-600 dark:text-emerald-400 w-28">Ingresos</th>
                                                <th className="text-right px-2 py-3 font-semibold text-red-600 dark:text-red-400 w-28">Egresos</th>
                                                <th className="text-right px-2 py-3 font-semibold text-slate-600 dark:text-slate-400 w-28">Saldo</th>
                                                <th className="text-left px-2 py-3 font-semibold text-slate-600 dark:text-slate-400">Categoría</th>
                                                <th className="text-right px-2 py-3 font-semibold text-slate-600 dark:text-slate-400 w-20">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {filtradas.map((f) => (
                                                <tr key={f.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                    <td className="px-2 py-3 font-mono text-slate-400 dark:text-slate-500">#{f.id}</td>
                                                    <td className="px-2 py-3 text-slate-700 dark:text-slate-300 whitespace-nowrap font-mono">
                                                        {mostrarFecha(f.fecha)}
                                                    </td>
                                                    <td className="px-2 py-3 text-slate-800 dark:text-slate-200">
                                                        <div className="line-clamp-2">{f.concepto}</div>
                                                        {f.notas && (
                                                            <div className="text-[10px] text-slate-400 dark:text-slate-500 italic truncate mt-0.5">
                                                                {f.notas}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-2 py-3 text-slate-600 dark:text-slate-400 font-mono text-[11px]">
                                                        {f.comprobante || "—"}
                                                    </td>
                                                    <td className="px-2 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[160px]">
                                                        {f.proveedor || "—"}
                                                    </td>
                                                    <td className="px-2 py-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-semibold">
                                                        {Number(f.ingresos) > 0 ? formatMoneda(f.ingresos) : "—"}
                                                    </td>
                                                    <td className="px-2 py-3 text-right font-mono tabular-nums text-red-600 dark:text-red-400 font-semibold">
                                                        {Number(f.egresos) > 0 ? formatMoneda(f.egresos) : "—"}
                                                    </td>
                                                    <td className={`px-2 py-3 text-right font-mono tabular-nums font-bold ${Number(f.saldo) < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>
                                                        {formatMoneda(f.saldo)}
                                                    </td>
                                                    <td className="px-2 py-3 text-slate-500 dark:text-slate-400">
                                                        <span className="line-clamp-2">{f.categoria || "—"}</span>
                                                    </td>
                                                    <td className="px-2 py-3">
                                                        <div className="flex justify-end gap-0.5">
                                                            <button
                                                                onClick={() => abrirEditar(f)}
                                                                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                                                title="Editar"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                </svg>
                                                            </button>
                                                            <button
                                                                onClick={() => borrar(f)}
                                                                className="p-1.5 rounded-md text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 transition"
                                                                title="Eliminar"
                                                            >
                                                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                                                </svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700">
                                            <tr>
                                                <td colSpan={5} className="px-2 py-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                                                    TOTALES DEL PERÍODO
                                                </td>
                                                <td className="px-2 py-3 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                                                    {formatMoneda(resumen.totalIng)}
                                                </td>
                                                <td className="px-2 py-3 text-right font-mono tabular-nums text-red-600 dark:text-red-400 font-bold">
                                                    {formatMoneda(resumen.totalEgr)}
                                                </td>
                                                <td className={`px-2 py-3 text-right font-mono tabular-nums font-bold ${resumen.saldoFinal < 0 ? "text-red-600 dark:text-red-400" : "text-slate-900 dark:text-slate-100"}`}>
                                                    {formatMoneda(resumen.saldoFinal)}
                                                </td>
                                                <td colSpan={2} className="px-2 py-3 text-xs text-slate-500 dark:text-slate-400">
                                                    {resumen.cantidad} asiento{resumen.cantidad === 1 ? "" : "s"}
                                                </td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </div>

                            {/* MOBILE */}
                            <div className="md:hidden space-y-2">
                                {filtradas.map((f) => (
                                    <div key={f.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                                        <div className="flex items-center justify-between gap-2 mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">#{f.id}</span>
                                                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                                                    {mostrarFecha(f.fecha)}
                                                </span>
                                            </div>
                                            <span className={`text-xs font-mono tabular-nums font-bold px-2 py-0.5 rounded-md ${Number(f.saldo) < 0 ? "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400" : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"}`}>
                                                {formatMoneda(f.saldo)}
                                            </span>
                                        </div>

                                        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-1">{f.concepto}</p>

                                        {(f.comprobante || f.proveedor) && (
                                            <div className="flex flex-wrap gap-x-2 text-[11px] text-slate-500 dark:text-slate-400 mb-2">
                                                {f.comprobante && <span className="font-mono">{f.comprobante}</span>}
                                                {f.proveedor && <span>· {f.proveedor}</span>}
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between gap-2 py-2 border-t border-slate-100 dark:border-slate-800">
                                            {Number(f.ingresos) > 0 && (
                                                <span className="text-xs font-mono tabular-nums text-emerald-600 dark:text-emerald-400 font-bold">
                                                    + {formatMoneda(f.ingresos)}
                                                </span>
                                            )}
                                            {Number(f.egresos) > 0 && (
                                                <span className="text-xs font-mono tabular-nums text-red-600 dark:text-red-400 font-bold">
                                                    − {formatMoneda(f.egresos)}
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

                                        {f.categoria && (
                                            <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider mt-1.5 leading-tight">
                                                {f.categoria}
                                            </p>
                                        )}
                                    </div>
                                ))}

                                <div className="bg-gradient-to-br from-slate-800 to-slate-900 text-white rounded-xl p-4 shadow-lg">
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="opacity-80">Ingresos</span>
                                            <span className="font-mono tabular-nums text-emerald-300 font-bold">
                                                {formatMoneda(resumen.totalIng)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="opacity-80">Egresos</span>
                                            <span className="font-mono tabular-nums text-red-300 font-bold">
                                                {formatMoneda(resumen.totalEgr)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between pt-2 border-t border-white/20">
                                            <span className="font-semibold">Saldo final</span>
                                            <span className="font-mono tabular-nums font-bold text-lg">
                                                {formatMoneda(resumen.saldoFinal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </>
            )}

            {/* ============================================
          TAB ESTADÍSTICAS
          ============================================ */}
            {tab === "estadisticas" && (
                <AnalisisAvanzado facturas={filtradas} conSaldo={conSaldo} />
            )}

            {/* ============================================
          TAB PELIGRO
          ============================================ */}
            {tab === "peligro" && (
                <div className="space-y-5 max-w-3xl">
                    {/* AVISO */}
                    <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-xl p-4 flex items-start gap-3">
                        <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <div>
                            <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                                Zona de acciones destructivas
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-400">
                                Estas operaciones afectan todo el libro contable. Leé con cuidado antes de continuar.
                            </p>
                        </div>
                    </div>

                    {/* CIERRE DE EJERCICIO */}
                    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
                                    Cierre de ejercicio contable
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                                    Cerrá el período actual. Podés <strong>continuar</strong> (mantiene histórico + crea saldo inicial) o <strong>archivar</strong> (guarda copia y vacía el libro activo).
                                </p>

                                <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2">
                                        <p className="text-slate-400 dark:text-slate-500 uppercase text-[10px]">Asientos</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                            {statsGlobales.cantidadMovimientos}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2">
                                        <p className="text-slate-400 dark:text-slate-500 uppercase text-[10px]">Saldo</p>
                                        <p className={`font-bold tabular-nums ${statsGlobales.saldoFinal >= 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                                            {formatCorta(statsGlobales.saldoFinal)}
                                        </p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2">
                                        <p className="text-slate-400 dark:text-slate-500 uppercase text-[10px]">Período</p>
                                        <p className="font-bold text-slate-900 dark:text-slate-100 text-[11px]">
                                            {statsGlobales.fechaInicio
                                                ? `${mostrarFecha(statsGlobales.fechaInicio).slice(3)} → ${mostrarFecha(statsGlobales.fechaFin).slice(3)}`
                                                : "—"}
                                        </p>
                                    </div>
                                </div>

                                <button
                                    onClick={() => setModalCierre(true)}
                                    disabled={!facturas.length}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:bg-amber-300 dark:disabled:bg-amber-900 disabled:cursor-not-allowed rounded-lg transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    Iniciar cierre de ejercicio
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* ELIMINAR TODO */}
                    <div className="bg-white dark:bg-slate-900 border-2 border-red-200 dark:border-red-900 rounded-xl p-5">
                        <div className="flex items-start gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center flex-shrink-0 shadow-lg">
                                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="text-base font-bold text-red-700 dark:text-red-400 mb-1">
                                    Eliminar todo el libro contable
                                </h3>
                                <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                    Borra <strong>permanentemente</strong> todos los asientos sin guardar copia de seguridad.
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950/40 rounded-md px-3 py-2 mb-3">
                                    ⚠️ Esta acción <strong>NO SE PUEDE DESHACER</strong>. Si querés mantener el histórico, usá <strong>Cierre de ejercicio</strong> en su lugar.
                                </p>
                                <button
                                    onClick={() => setModalEliminarTodo(true)}
                                    disabled={!facturas.length}
                                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 disabled:cursor-not-allowed rounded-lg transition"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M1 7h22M9 7V4a1 1 0 011-1h4a1 1 0 011 1v3" />
                                    </svg>
                                    Eliminar todo
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* INFO */}
                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-4 text-xs text-slate-500 dark:text-slate-400">
                        <p className="font-semibold text-slate-700 dark:text-slate-300 mb-2">
                            💡 ¿Cuál es la diferencia?
                        </p>
                        <ul className="space-y-1.5 list-disc list-inside">
                            <li>
                                <strong className="text-slate-700 dark:text-slate-300">Cierre de ejercicio:</strong> mantiene el histórico (o lo archiva), reinicia numeración y crea un asiento de "Saldo inicial" con el saldo de cierre. Recomendado para cerrar períodos.
                            </li>
                            <li>
                                <strong className="text-slate-700 dark:text-slate-300">Eliminar todo:</strong> borra absolutamente todo de forma permanente. No hay vuelta atrás.
                            </li>
                        </ul>
                    </div>
                </div>
            )}

            {/* MODAL SINGLE */}
            <Modal
                open={modalForm}
                onClose={cerrarForm}
                title={editando ? `Editar asiento #${editando}` : "Nuevo asiento contable"}
                size="md"
            >
                <form onSubmit={guardar} className="space-y-4">
                    <FormFactura values={form} onChange={onFormChange} proveedores={proveedoresUnicos} />
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
                            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar asiento"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL BATCH */}
            <Modal
                open={modalBatch}
                onClose={cerrarBatch}
                title="Carga rápida de asientos contables"
                size="lg"
            >
                <div className="space-y-4">
                    <FormFacturaBatch
                        asientos={asientosBatch}
                        onChange={setAsientosBatch}
                        proveedores={proveedoresUnicos}
                    />
                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={cerrarBatch}
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={guardarBatch}
                            disabled={guardando || !asientosBatch.length}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {guardando
                                ? "Guardando..."
                                : `Registrar ${asientosBatch.length} asiento${asientosBatch.length === 1 ? "" : "s"}`}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* MODAL IMPORTAR */}
            <ModalImportar
                open={modalImport}
                onClose={() => setModalImport(false)}
                onDone={(n) =>
                    alert(`✅ ${n} movimiento${n === 1 ? "" : "s"} importado${n === 1 ? "" : "s"}\n\nLos saldos se calcularon automáticamente.`)
                }
            />

            {/* MODAL CIERRE */}
            <ModalCierre
                open={modalCierre}
                onClose={() => setModalCierre(false)}
                stats={statsGlobales}
                onConfirm={confirmarCierre}
            />

            {/* MODAL ELIMINAR TODO */}
            <Modal
                open={modalEliminarTodo}
                onClose={() => {
                    setConfirmText("");
                    setModalEliminarTodo(false);
                }}
                title="Eliminar todo el libro"
                size="md"
            >
                <div className="space-y-4">
                    <div className="bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                            <svg className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <div>
                                <p className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">
                                    ⚠️ Esta acción es irreversible
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-400">
                                    Se eliminarán <strong>{facturas.length} asiento{facturas.length === 1 ? "" : "s"}</strong> del libro contable de forma permanente.
                                </p>
                                <p className="text-xs text-red-700 dark:text-red-400 mt-2">
                                    <strong>NO</strong> se guardará copia de seguridad. Si querés mantener el histórico, usá <strong>Cierre de ejercicio</strong> en su lugar.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                            Para confirmar, escribí{" "}
                            <code className="font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-red-600 dark:text-red-400 font-bold">
                                ELIMINAR
                            </code>
                        </p>
                        <input
                            type="text"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="Escribí ELIMINAR"
                            autoFocus
                            className={`w-full px-3 py-2 text-sm rounded-lg border-2 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none transition font-mono ${confirmText === "ELIMINAR"
                                ? "border-emerald-400 dark:border-emerald-600 focus:border-emerald-500"
                                : "border-red-300 dark:border-red-800 focus:border-red-500"
                                }`}
                        />
                        {confirmText && confirmText !== "ELIMINAR" && (
                            <p className="text-[11px] text-red-600 dark:text-red-400 mt-1">
                                El texto no coincide con "ELIMINAR"
                            </p>
                        )}
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={() => {
                                setConfirmText("");
                                setModalEliminarTodo(false);
                            }}
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={confirmarEliminarTodo}
                            disabled={confirmText !== "ELIMINAR"}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 disabled:cursor-not-allowed disabled:opacity-50 rounded-lg transition"
                        >
                            Eliminar todo
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}