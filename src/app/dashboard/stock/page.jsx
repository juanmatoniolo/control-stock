"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import FormProducto from "@/components/stock/FormProducto";
import FormMovimiento from "@/components/stock/FormMovimiento";
import FormSalida from "@/components/stock/FormSalida";
import ModalImportar from "@/components/stock/ModalImportar";
import ModalDetalleProducto from "@/components/stock/ModalDetalleProducto";
import ModalAyudaImportar from "@/components/stock/ModalAyudaImportar";
import EstadisticasStock from "@/components/stock/EstadisticasStock";
import { useAuth } from "@/hooks/useAuth";
import { mostrarFecha } from "@/lib/combustible";
import {
    ESTADOS,
    MOVIMIENTO_VACIO,
    PRODUCTO_VACIO,
    actualizarMovimiento,
    actualizarProducto,
    calcularStock,
    crearMovimiento,
    crearProducto,
    eliminarMovimiento,
    eliminarProducto,
    exportarExcel,
    itemsDe,
    suscribirMovimientos,
    suscribirProductos,
} from "@/lib/stock";

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

function StatCard({ label, value, sub, accent = "sky" }) {
    const accents = {
        sky: "from-sky-500 to-sky-700",
        emerald: "from-emerald-500 to-emerald-700",
        amber: "from-amber-500 to-amber-700",
        red: "from-red-500 to-red-700",
        violet: "from-violet-500 to-violet-700",
    };
    return (
        <div className={`rounded-xl p-4 bg-gradient-to-br ${accents[accent]} text-white shadow-lg`}>
            <p className="text-xs uppercase tracking-wider opacity-80 font-medium">{label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

export default function StockPage() {
    const { user } = useAuth();

    const [tab, setTab] = useState("stock"); // stock | movimientos | estadisticas
    const [productos, setProductos] = useState([]);
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [filtroTipo, setFiltroTipo] = useState("todos");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const [modalMov, setModalMov] = useState(false);
    const [modalProd, setModalProd] = useState(false);
    const [modalImport, setModalImport] = useState(false);
    const [modalDetalle, setModalDetalle] = useState(false);
    const [modalAyuda, setModalAyuda] = useState(false);

    const [editandoMov, setEditandoMov] = useState(null);
    const [editandoProd, setEditandoProd] = useState(null);
    const [detalleItem, setDetalleItem] = useState(null);
    const [autocompletado, setAutocompletado] = useState(false);

    const [formMov, setFormMov] = useState(MOVIMIENTO_VACIO);
    const [formProd, setFormProd] = useState(PRODUCTO_VACIO);
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        const u1 = suscribirProductos(setProductos);
        const u2 = suscribirMovimientos((arr) => {
            setMovimientos(arr);
            setLoading(false);
        });
        return () => {
            u1();
            u2();
        };
    }, []);

    const stock = useMemo(() => calcularStock(productos, movimientos), [productos, movimientos]);
    const mapaStock = useMemo(() => {
        const m = {};
        stock.forEach((s) => (m[s.codigo] = s));
        return m;
    }, [stock]);

    /* ============ FILTRADO MOVIMIENTOS ============ */
    const movsFiltrados = useMemo(() => {
        let arr = movimientos;
        if (filtroTipo !== "todos") arr = arr.filter((m) => m.tipo === filtroTipo);
        if (fechaDesde) arr = arr.filter((m) => (m.fecha || "") >= fechaDesde);
        if (fechaHasta) arr = arr.filter((m) => (m.fecha || "") <= fechaHasta);

        const q = busqueda.trim().toLowerCase();
        if (q) {
            arr = arr.filter((m) => {
                const items = itemsDe(m);
                const texto = [
                    m.id,
                    m.numeroFactura,
                    m.movimiento,
                    m.usuarioNombre,
                    m.observaciones,
                    ...items.map((it) => `${it.codigo} ${it.producto} ${it.marca} ${it.numeroLote}`),
                ]
                    .filter(Boolean)
                    .join(" ");
                return texto.toLowerCase().includes(q);
            });
        }
        return arr;
    }, [movimientos, filtroTipo, fechaDesde, fechaHasta, busqueda]);

    const stockFiltrado = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        if (!q) return stock;
        return stock.filter((s) =>
            [s.codigo, s.producto]
                .filter(Boolean)
                .some((v) => String(v).toLowerCase().includes(q))
        );
    }, [stock, busqueda]);

    const resumen = useMemo(() => {
        const sinStock = stock.filter((s) => s.estado === "sin-stock").length;
        const bajos = stock.filter((s) => s.estado === "bajo").length;
        const normales = stock.filter((s) => s.estado === "normal").length;
        const totalEntradas = movimientos.filter((m) => m.tipo === "entrada").length;
        const totalSalidas = movimientos.filter((m) => m.tipo === "salida").length;
        return { sinStock, bajos, normales, totalEntradas, totalSalidas };
    }, [stock, movimientos]);

    /* ============ MOVIMIENTOS ============ */
    function abrirNuevoMov(tipo = "entrada") {
        setEditandoMov(null);
        setFormMov({
            ...MOVIMIENTO_VACIO,
            tipo,
            usuario: user?.usuario || "",
            usuarioNombre: user?.nombre || "",
            items: tipo === "salida" ? [] : undefined,
        });
        setModalMov(true);
    }

    function abrirEditarMov(m) {
        setEditandoMov(m.id);
        if (m.tipo === "salida") {
            setFormMov({
                ...MOVIMIENTO_VACIO,
                ...m,
                tipo: "salida",
                items: itemsDe(m),
            });
        } else {
            setFormMov({ ...MOVIMIENTO_VACIO, ...m });
        }
        setModalMov(true);
    }

    function cerrarMov() {
        setModalMov(false);
        setEditandoMov(null);
        setFormMov(MOVIMIENTO_VACIO);
    }

    function onMovChange(name, value) {
        setFormMov((f) => {
            const next = { ...f, [name]: value };

            // Autocompletar en ENTRADA cuando el código existe en stock
            if (name === "codigo" && f.tipo === "entrada") {
                const cod = String(value || "").trim().toLowerCase();
                const prod = cod
                    ? stock.find(
                          (s) =>
                              String(s.codigo || "").trim().toLowerCase() === cod,
                      )
                    : null;
                if (prod) {
                    if (!next.producto) next.producto = prod.producto || "";
                    if (!next.marca && prod.ultimaMarca) next.marca = prod.ultimaMarca;
                    if (!next.numeroLote && prod.ultimoLote)
                        next.numeroLote = prod.ultimoLote;
                    if (!next.vencimiento && prod.ultimoVencimiento)
                        next.vencimiento = prod.ultimoVencimiento;
                    if (!next.precioUnitario && prod.ultimoPrecioUnitario)
                        next.precioUnitario = prod.ultimoPrecioUnitario;
                }
            }

            return next;
        });
    }

    async function guardarMov(e) {
        e.preventDefault();

        if (formMov.tipo === "entrada") {
            if (!formMov.fecha || !formMov.codigo || !formMov.cantidad) {
                alert("Completá fecha, producto y cantidad.");
                return;
            }
        } else {
            if (!formMov.fecha || !formMov.movimiento?.trim()) {
                alert("Completá fecha y movimiento.");
                return;
            }
            if (!formMov.items?.length) {
                alert("Agregá al menos un producto a la salida.");
                return;
            }
        }

        setGuardando(true);
        try {
            const payload = {
                ...formMov,
                usuario: user?.usuario || formMov.usuario,
                usuarioNombre: user?.nombre || formMov.usuarioNombre,
            };
            if (editandoMov) {
                await actualizarMovimiento(editandoMov, payload);
            } else {
                await crearMovimiento(payload);
            }
            cerrarMov();
        } catch (err) {
            console.error(err);
            alert("Error al guardar el movimiento.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrarMov(m) {
        const items = itemsDe(m);
        const descripcion = items.length > 1 ? `${items.length} productos` : items[0]?.producto || "—";
        if (!confirm(`¿Eliminar el movimiento #${m.id} (${descripcion}) del ${mostrarFecha(m.fecha)}?`)) return;
        try {
            await eliminarMovimiento(m.id);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    /* ============ PRODUCTOS ============ */
    function abrirNuevoProd() {
        setEditandoProd(null);
        setFormProd(PRODUCTO_VACIO);
        setAutocompletado(false);
        setModalProd(true);
    }

    function abrirEditarProd(p) {
        setEditandoProd(p.codigo);
        setFormProd({ ...PRODUCTO_VACIO, ...p });
        setAutocompletado(false);
        setModalProd(true);
    }

    function cerrarProd() {
        setModalProd(false);
        setEditandoProd(null);
        setFormProd(PRODUCTO_VACIO);
        setAutocompletado(false);
    }

    function onProdChange(name, value) {
        // Buscar coincidencia por código (solo cuando estamos creando)
        const cod = name === "codigo" ? String(value || "").trim().toLowerCase() : null;
        const existente = cod
            ? productos.find(
                  (p) => String(p.codigo || "").trim().toLowerCase() === cod,
              )
            : null;

        setFormProd((f) => {
            const next = { ...f, [name]: value };

            if (name === "codigo" && !editandoProd && existente) {
                next.producto = existente.producto || "";
                next.stockInicial = existente.stockInicial ?? "";
                next.stockMinimo = existente.stockMinimo ?? 5;
                next.activo = existente.activo !== false;
            }

            return next;
        });

        // Si creando el código ya existe → pasamos a modo edición automáticamente
        if (name === "codigo" && !editandoProd && existente) {
            setEditandoProd(existente.codigo);
            setAutocompletado(true);
        }
        if (name === "codigo" && !existente) {
            setAutocompletado(false);
        }
    }

    async function guardarProd(e) {
        e.preventDefault();
        if (!formProd.codigo?.trim() || !formProd.producto?.trim()) return;
        setGuardando(true);
        try {
            if (editandoProd) {
                await actualizarProducto(editandoProd, formProd);
            } else {
                await crearProducto(formProd);
            }
            cerrarProd();
        } catch (err) {
            console.error(err);
            alert(err.message || "Error al guardar el producto.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrarProd(p) {
        const cant = movimientos.filter((m) => itemsDe(m).some((it) => it.codigo === p.codigo)).length;
        const aviso = cant
            ? `\n⚠ Tiene ${cant} movimiento${cant === 1 ? "" : "s"} asociado${cant === 1 ? "" : "s"}. Los movimientos se mantienen.`
            : "";
        if (!confirm(`¿Eliminar el producto "${p.producto}" (${p.codigo})?${aviso}`)) return;
        try {
            await eliminarProducto(p.codigo);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    function handleExportar() {
        exportarExcel(productos, movimientos, stock);
    }

    const movValido =
        formMov.tipo === "entrada"
            ? formMov.fecha && formMov.codigo && formMov.cantidad
            : formMov.fecha && formMov.movimiento?.trim() && formMov.items?.length > 0;

    const prodValido = formProd.codigo?.trim() && formProd.producto?.trim();

    /* ============ RENDER ============ */
    return (
        <div>
            {/* HEADER */}
            <header className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div>
                        <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                            Stock
                        </h1>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                            {productos.length} producto{productos.length === 1 ? "" : "s"} ·{" "}
                            {movimientos.length} movimiento{movimientos.length === 1 ? "" : "s"}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setModalAyuda(true)}
                            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 hover:bg-amber-100 dark:hover:bg-amber-950/60 rounded-lg transition"
                            title="Cómo importar tu planilla"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span className="hidden xs:inline">Ayuda</span>
                        </button>
                        <button
                            onClick={() => setModalImport(true)}
                            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            <span className="hidden xs:inline">Importar</span>
                        </button>
                        <button
                            onClick={handleExportar}
                            className="inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            <span className="hidden xs:inline">Exportar</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* RESUMEN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatCard label="Sin stock" value={resumen.sinStock} sub={resumen.sinStock === 1 ? "producto" : "productos"} accent="red" />
                <StatCard label="Stock bajo" value={resumen.bajos} sub="Requieren reposición" accent="amber" />
                <StatCard label="Normal" value={resumen.normales} sub="Con stock suficiente" accent="emerald" />
                <StatCard label="Movimientos" value={movimientos.length} sub={`${resumen.totalEntradas} ent · ${resumen.totalSalidas} sal`} accent="sky" />
            </div>

            {/* TABS */}
            <div className="border-b border-slate-200 dark:border-slate-800 mb-5 overflow-x-auto">
                <div className="flex min-w-max">
                    <TabButton active={tab === "stock"} onClick={() => setTab("stock")} count={stock.length}>
                        Stock
                    </TabButton>
                    <TabButton active={tab === "movimientos"} onClick={() => setTab("movimientos")} count={movimientos.length}>
                        Movimientos
                    </TabButton>
                    <TabButton active={tab === "estadisticas"} onClick={() => setTab("estadisticas")}>
                        Estadísticas
                    </TabButton>
                </div>
            </div>

            {/* BARRA DE ACCIONES (oculta en estadísticas) */}
            {tab !== "estadisticas" && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
                    <div className="relative flex-1 max-w-md">
                        <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder={tab === "movimientos" ? "Buscar por producto, factura, movimiento, lote..." : "Buscar por código o producto..."}
                            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                        />
                    </div>
                    {tab === "movimientos" ? (
                        <div className="flex gap-2">
                            <button
                                onClick={() => abrirNuevoMov("entrada")}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                                Entrada
                            </button>
                            <button
                                onClick={() => abrirNuevoMov("salida")}
                                className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                                </svg>
                                Salida
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={abrirNuevoProd}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-lg transition"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            Nuevo producto
                        </button>
                    )}
                </div>
            )}

            {/* FILTROS MOVIMIENTOS */}
            {tab === "movimientos" && (
                <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <select
                        value={filtroTipo}
                        onChange={(e) => setFiltroTipo(e.target.value)}
                        className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                    >
                        <option value="todos">Todos los movimientos</option>
                        <option value="entrada">Solo entradas</option>
                        <option value="salida">Solo salidas</option>
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
            )}

            {/* CONTENIDO */}
            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Cargando...
                </div>
            ) : (
                <>
                    {/* ============ TAB STOCK ============ */}
                    {tab === "stock" && (
                        <>
                            {stockFiltrado.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                                        {productos.length === 0
                                            ? "Todavía no hay productos. Creá el primero o importá desde Excel."
                                            : "Sin resultados."}
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
                                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Código</th>
                                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Producto</th>
                                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Stock actual</th>
                                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Mín.</th>
                                                        <th className="text-center px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-32">Estado</th>
                                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-32">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stockFiltrado.map((p) => (
                                                        <tr key={p.codigo} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                            <td className="px-3 py-3 font-mono text-xs text-slate-500 dark:text-slate-400">{p.codigo}</td>
                                                            <td className="px-3 py-3 font-medium text-slate-900 dark:text-slate-100 truncate max-w-[320px]">{p.producto}</td>
                                                            <td
                                                                className={`px-3 py-3 text-right font-bold tabular-nums text-lg ${p.estado === "sin-stock"
                                                                    ? "text-red-600 dark:text-red-400"
                                                                    : p.estado === "bajo"
                                                                        ? "text-amber-600 dark:text-amber-400"
                                                                        : "text-emerald-600 dark:text-emerald-400"
                                                                    }`}
                                                            >
                                                                {p.stockActual}
                                                            </td>
                                                            <td className="px-3 py-3 text-right text-slate-500 dark:text-slate-400 tabular-nums text-xs">{p.stockMinimo || 0}</td>
                                                            <td className="px-3 py-3 text-center">
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ESTADOS[p.estado].color}`}>
                                                                    {p.estadoLabel}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-3">
                                                                <div className="flex justify-end gap-1">
                                                                    <button
                                                                        onClick={() => { setDetalleItem(p); setModalDetalle(true); }}
                                                                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-700 dark:hover:text-slate-200 transition"
                                                                        title="Ver"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => abrirEditarProd(p)}
                                                                        className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                                                        title="Editar"
                                                                    >
                                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                        </svg>
                                                                    </button>
                                                                    <button
                                                                        onClick={() => borrarProd(p)}
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
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* MOBILE */}
                                    <div className="md:hidden space-y-2">
                                        {stockFiltrado.map((p) => (
                                            <div key={p.codigo} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                                                <div className="flex items-start justify-between gap-2 mb-2">
                                                    <div className="min-w-0 flex-1">
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">{p.codigo}</span>
                                                        <h3 className="font-semibold text-slate-900 dark:text-slate-100 mt-1.5 text-sm truncate">{p.producto}</h3>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        <p
                                                            className={`text-3xl font-bold tabular-nums leading-none ${p.estado === "sin-stock"
                                                                ? "text-red-600 dark:text-red-400"
                                                                : p.estado === "bajo"
                                                                    ? "text-amber-600 dark:text-amber-400"
                                                                    : "text-emerald-600 dark:text-emerald-400"
                                                                }`}
                                                        >
                                                            {p.stockActual}
                                                        </p>
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium inline-block mt-1 ${ESTADOS[p.estado].color}`}>
                                                            {p.estadoLabel}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
                                                    <span className="text-slate-400 dark:text-slate-500">
                                                        Mínimo: <strong className="text-slate-600 dark:text-slate-400">{p.stockMinimo || 0}</strong>
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1.5 pt-2.5 mt-2 border-t border-slate-100 dark:border-slate-800">
                                                    <button
                                                        onClick={() => { setDetalleItem(p); setModalDetalle(true); }}
                                                        className="flex-1 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 rounded-lg transition"
                                                    >
                                                        Ver
                                                    </button>
                                                    <button
                                                        onClick={() => abrirEditarProd(p)}
                                                        className="flex-1 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                                                    >
                                                        Editar
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ============ TAB MOVIMIENTOS ============ */}
                    {tab === "movimientos" && (
                        <>
                            {movsFiltrados.length === 0 ? (
                                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                                        {movimientos.length === 0 ? "Todavía no hay movimientos." : "Sin resultados."}
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
                                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-14">#</th>
                                                        <th className="text-center px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-20">Tipo</th>
                                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Productos</th>
                                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Detalle</th>
                                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-24">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {movsFiltrados.map((m) => {
                                                        const esEntrada = m.tipo === "entrada";
                                                        const items = itemsDe(m);
                                                        const totalUnidades = items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);
                                                        return (
                                                            <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                                <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs align-top">#{m.id}</td>
                                                                <td className="px-3 py-3 text-center align-top">
                                                                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${esEntrada
                                                                        ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                                        : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                                                        }`}>
                                                                        {esEntrada ? "ENT" : "SAL"}
                                                                    </span>
                                                                </td>
                                                                <td className="px-3 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap align-top">
                                                                    {mostrarFecha(m.fecha)}
                                                                </td>
                                                                <td className="px-3 py-3">
                                                                    <div className="space-y-0.5">
                                                                        {items.slice(0, 3).map((it, i) => (
                                                                            <div key={i} className="flex items-center gap-1.5 text-xs">
                                                                                <span className={`font-bold tabular-nums w-8 text-right ${esEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                                                                    }`}>
                                                                                    {esEntrada ? "+" : "−"}{it.cantidad}
                                                                                </span>
                                                                                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                                                                    {it.codigo}
                                                                                </span>
                                                                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                                                                                    {it.producto}
                                                                                </span>
                                                                            </div>
                                                                        ))}
                                                                        {items.length > 3 && (
                                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-10">
                                                                                + {items.length - 3} más ({totalUnidades} uds)
                                                                            </p>
                                                                        )}
                                                                    </div>
                                                                </td>
                                                                <td className="px-3 py-3 text-xs text-slate-500 dark:text-slate-400 truncate max-w-[240px] align-top">
                                                                    {esEntrada ? (
                                                                        <>
                                                                            {m.numeroFactura && <span className="font-mono">{m.numeroFactura}</span>}
                                                                            {items[0]?.marca && <> · {items[0].marca}</>}
                                                                        </>
                                                                    ) : (
                                                                        <>
                                                                            <strong className="text-slate-700 dark:text-slate-300">{m.movimiento}</strong>
                                                                            {m.usuarioNombre && <> · <span className="text-slate-400 dark:text-slate-500">{m.usuarioNombre}</span></>}
                                                                        </>
                                                                    )}
                                                                </td>
                                                                <td className="px-3 py-3 align-top">
                                                                    <div className="flex justify-end gap-1">
                                                                        <button
                                                                            onClick={() => abrirEditarMov(m)}
                                                                            className="p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400 transition"
                                                                            title="Editar"
                                                                        >
                                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                                            </svg>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => borrarMov(m)}
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
                                            </table>
                                        </div>
                                    </div>

                                    {/* MOBILE */}
                                    <div className="md:hidden space-y-2">
                                        {movsFiltrados.map((m) => {
                                            const esEntrada = m.tipo === "entrada";
                                            const items = itemsDe(m);
                                            return (
                                                <div key={m.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${esEntrada
                                                            ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                                                            : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                                                            }`}>
                                                            {esEntrada ? "ENTRADA" : "SALIDA"}
                                                        </span>
                                                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                                            #{m.id}
                                                        </span>
                                                        <span className="text-xs text-slate-600 dark:text-slate-400">
                                                            {mostrarFecha(m.fecha)}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-1 mb-2">
                                                        {items.map((it, i) => (
                                                            <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-md px-2 py-1.5">
                                                                <span className={`font-bold tabular-nums w-8 text-right flex-shrink-0 ${esEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                                                                    }`}>
                                                                    {esEntrada ? "+" : "−"}{it.cantidad}
                                                                </span>
                                                                <div className="min-w-0 flex-1">
                                                                    <p className="text-slate-800 dark:text-slate-200 font-medium truncate">{it.producto}</p>
                                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                                        {it.codigo}
                                                                        {it.numeroLote && ` · ${it.numeroLote}`}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 truncate">
                                                        {esEntrada
                                                            ? `${m.numeroFactura || ""}`.trim() || "—"
                                                            : `${m.movimiento || ""} ${m.usuarioNombre ? `· ${m.usuarioNombre}` : ""}`.trim() || "—"}
                                                    </p>

                                                    <div className="flex items-center gap-1.5 pt-2.5 border-t border-slate-100 dark:border-slate-800">
                                                        <button
                                                            onClick={() => abrirEditarMov(m)}
                                                            className="flex-1 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                                                        >
                                                            Editar
                                                        </button>
                                                        <button
                                                            onClick={() => borrarMov(m)}
                                                            className="flex-1 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                                        >
                                                            Eliminar
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ============ TAB ESTADÍSTICAS ============ */}
                    {tab === "estadisticas" && (
                        <EstadisticasStock stock={stock} movimientos={movimientos} />
                    )}
                </>
            )}

            {/* MODAL MOVIMIENTO (ENTRADA o SALIDA) */}
            <Modal
                open={modalMov}
                onClose={cerrarMov}
                title={
                    editandoMov
                        ? `Editar movimiento #${editandoMov}`
                        : formMov.tipo === "entrada"
                            ? "Nueva entrada"
                            : "Nueva salida"
                }
                size="lg"
            >
                <form onSubmit={guardarMov} className="space-y-4">
                    {formMov.tipo === "entrada" ? (
                        <FormMovimiento
                            values={formMov}
                            onChange={onMovChange}
                            esEdicion={Boolean(editandoMov)}
                        />
                    ) : (
                        <FormSalida
                            values={formMov}
                            onChange={onMovChange}
                            esEdicion={Boolean(editandoMov)}
                            mapaStock={mapaStock}
                        />
                    )}

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={cerrarMov}
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando || !movValido}
                            className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition disabled:cursor-not-allowed ${formMov.tipo === "entrada"
                                ? "bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 dark:disabled:bg-emerald-900"
                                : "bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900"
                                }`}
                        >
                            {guardando
                                ? "Guardando..."
                                : editandoMov
                                    ? "Guardar cambios"
                                    : formMov.tipo === "entrada"
                                        ? "Registrar entrada"
                                        : "Registrar salida"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL PRODUCTO */}
            <Modal
                open={modalProd}
                onClose={cerrarProd}
                title={editandoProd ? `Editar producto ${editandoProd}` : "Nuevo producto"}
                size="md"
            >
                <form onSubmit={guardarProd} className="space-y-4">
                    {autocompletado && (
                        <div className="text-xs rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 px-3 py-2">
                            ⚠ Este código ya existe — los datos se cargaron automáticamente. Guardá para actualizar el producto.
                        </div>
                    )}

                    <FormProducto values={formProd} onChange={onProdChange} esEdicion={Boolean(editandoProd)} />

                    <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                        <button
                            type="button"
                            onClick={cerrarProd}
                            className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={guardando || !prodValido}
                            className="px-4 py-2.5 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 disabled:bg-sky-300 dark:disabled:bg-sky-900 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {guardando ? "Guardando..." : editandoProd ? "Guardar cambios" : "Crear producto"}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* MODAL DETALLE */}
            <ModalDetalleProducto
                open={modalDetalle}
                onClose={() => setModalDetalle(false)}
                item={detalleItem}
                movimientos={movimientos}
            />

            {/* MODAL AYUDA */}
            <ModalAyudaImportar open={modalAyuda} onClose={() => setModalAyuda(false)} />

            {/* MODAL IMPORTAR */}
            <ModalImportar
                open={modalImport}
                onClose={() => setModalImport(false)}
                onDone={(res) =>
                    alert(`✅ Importación exitosa\n\n📦 ${res.productos} productos\n📥 ${res.movimientos} movimientos`)
                }
            />
        </div>
    );
}