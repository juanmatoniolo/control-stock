"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/ui/Modal";
import FormSalida from "@/components/stock/FormSalida";
import { useAuth } from "@/hooks/useAuth";
import { mostrarFecha } from "@/lib/combustible";
import {
    MOVIMIENTO_VACIO,
    actualizarMovimiento,
    crearMovimiento,
    eliminarMovimiento,
    suscribirMovimientos,
    suscribirProductos,
    calcularStock,
    itemsDe,
} from "@/lib/stock";

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

export default function EgresosPage() {
    const { user } = useAuth();

    const [movimientos, setMovimientos] = useState([]);
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);

    const [busqueda, setBusqueda] = useState("");
    const [filtroUsuario, setFiltroUsuario] = useState("todos");
    const [fechaDesde, setFechaDesde] = useState("");
    const [fechaHasta, setFechaHasta] = useState("");

    const [modalForm, setModalForm] = useState(false);
    const [editando, setEditando] = useState(null);
    const [form, setForm] = useState(MOVIMIENTO_VACIO);
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

    const salidas = useMemo(() => movimientos.filter((m) => m.tipo === "salida"), [movimientos]);

    const stock = useMemo(() => calcularStock(productos, movimientos), [productos, movimientos]);
    const mapaStock = useMemo(() => {
        const m = {};
        stock.forEach((s) => (m[s.codigo] = s));
        return m;
    }, [stock]);

    const vendedores = useMemo(() => {
        const set = new Set();
        salidas.forEach((m) => m.usuarioNombre && set.add(m.usuarioNombre));
        return Array.from(set).sort();
    }, [salidas]);

    const filtradas = useMemo(() => {
        let arr = salidas;
        if (filtroUsuario !== "todos") arr = arr.filter((m) => m.usuarioNombre === filtroUsuario);
        if (fechaDesde) arr = arr.filter((m) => (m.fecha || "") >= fechaDesde);
        if (fechaHasta) arr = arr.filter((m) => (m.fecha || "") <= fechaHasta);

        const q = busqueda.trim().toLowerCase();
        if (q) {
            arr = arr.filter((m) => {
                const items = itemsDe(m);
                const texto = [
                    m.id,
                    m.movimiento,
                    m.usuarioNombre,
                    m.observaciones,
                    ...items.map((it) => `${it.codigo} ${it.producto} ${it.marca} ${it.numeroLote}`),
                ].filter(Boolean).join(" ");
                return texto.toLowerCase().includes(q);
            });
        }
        return arr;
    }, [salidas, filtroUsuario, fechaDesde, fechaHasta, busqueda]);

    /* ============ HANDLERS ============ */
    function abrirNueva() {
        setEditando(null);
        setForm({
            ...MOVIMIENTO_VACIO,
            tipo: "salida",
            usuario: user?.usuario || "",
            usuarioNombre: user?.nombre || "",
            items: [],
        });
        setModalForm(true);
    }

    function abrirEditar(m) {
        const esDueno = m.usuarioNombre === user?.nombre;
        const esRoot = user?.rol === "root";
        if (!esDueno && !esRoot) {
            alert("Solo podés editar tus propios egresos.");
            return;
        }
        setEditando(m.id);
        setForm({
            ...MOVIMIENTO_VACIO,
            ...m,
            tipo: "salida",
            items: itemsDe(m),
        });
        setModalForm(true);
    }

    function cerrarForm() {
        setModalForm(false);
        setEditando(null);
        setForm(MOVIMIENTO_VACIO);
    }

    function onFormChange(name, value) {
        setForm((f) => ({ ...f, [name]: value }));
    }

    async function guardar(e) {
        e.preventDefault();
        if (!form.fecha || !form.movimiento?.trim()) {
            alert("Completá fecha y movimiento.");
            return;
        }
        if (!form.items?.length) {
            alert("Agregá al menos un producto al egreso.");
            return;
        }

        setGuardando(true);
        try {
            const payload = {
                ...form,
                tipo: "salida",
                usuario: user?.usuario || "",
                usuarioNombre: user?.nombre || "",
            };
            if (editando) {
                await actualizarMovimiento(editando, payload);
            } else {
                await crearMovimiento(payload);
            }
            cerrarForm();
        } catch (err) {
            console.error(err);
            alert("Error al guardar el egreso.");
        } finally {
            setGuardando(false);
        }
    }

    async function borrar(m) {
        const esDueno = m.usuarioNombre === user?.nombre;
        const esRoot = user?.rol === "root";
        if (!esDueno && !esRoot) {
            alert("Solo podés eliminar tus propios egresos.");
            return;
        }
        if (!confirm(`¿Eliminar el egreso #${m.id}?`)) return;
        try {
            await eliminarMovimiento(m.id);
        } catch (err) {
            console.error(err);
            alert("Error al eliminar.");
        }
    }

    /* ============ RESUMEN ============ */
    const resumen = useMemo(() => {
        const hoy = new Date().toISOString().slice(0, 10);
        const misSalidas = salidas.filter((m) => m.usuarioNombre === user?.nombre);
        const misHoy = misSalidas.filter((m) => m.fecha === hoy);
        const unidades = filtradas.reduce((s, m) => {
            const items = itemsDe(m);
            return s + items.reduce((ss, it) => ss + (Number(it.cantidad) || 0), 0);
        }, 0);
        return {
            total: salidas.length,
            totalFiltrado: filtradas.length,
            misSalidas: misSalidas.length,
            misHoy: misHoy.length,
            unidades,
        };
    }, [salidas, filtradas, user]);

    const formValido = form.fecha && form.movimiento?.trim() && form.items?.length > 0;

    return (
        <div>
            {/* HEADER */}
            <header className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="title-fluid font-bold text-slate-900 dark:text-slate-100">
                        Egresos de medicación
                    </h1>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Registrá salidas con tu firma
                    </p>
                </div>
                <button
                    onClick={abrirNueva}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition self-start sm:self-auto"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    </svg>
                    Registrar egreso
                </button>
            </header>

            {/* RESUMEN */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
                <StatCard label="Total egresos" value={resumen.total} sub={`${resumen.totalFiltrado} visibles`} accent="violet" />
                <StatCard label="Mis egresos" value={resumen.misSalidas} sub={user?.nombre || ""} accent="sky" />
                <StatCard label="Hoy" value={resumen.misHoy} sub="Registrados hoy" accent="emerald" />
                <StatCard label="Unidades" value={resumen.unidades} sub="Del filtro actual" accent="amber" />
            </div>

            {/* BUSCADOR */}
            <div className="mb-4">
                <div className="relative">
                    <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 10a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar por producto, código, movimiento, lote..."
                        className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 focus:ring-2 focus:ring-sky-100 dark:focus:ring-sky-900/50 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                    />
                </div>
            </div>

            {/* FILTROS */}
            <div className="mb-4 grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                    value={filtroUsuario}
                    onChange={(e) => setFiltroUsuario(e.target.value)}
                    className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 focus:border-sky-500 outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                >
                    <option value="todos">Todos los vendedores ({salidas.length})</option>
                    {user?.rol === "root" &&
                        vendedores.map((v) => (
                            <option key={v} value={v}>
                                {v} ({salidas.filter((m) => m.usuarioNombre === v).length})
                            </option>
                        ))}
                    {user?.rol !== "root" && user?.nombre && (
                        <option value={user.nombre}>
                            Solo mis egresos ({salidas.filter((m) => m.usuarioNombre === user.nombre).length})
                        </option>
                    )}
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

            {/* LISTADO */}
            {loading ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-8 text-center text-slate-400 dark:text-slate-500 text-sm">
                    Cargando...
                </div>
            ) : filtradas.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                        {salidas.length === 0
                            ? "Todavía no hay egresos. ¡Registrá el primero!"
                            : "Sin resultados para los filtros."}
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
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Fecha</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Productos</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Movimiento</th>
                                        <th className="text-left px-3 py-3 font-semibold text-slate-600 dark:text-slate-400">Firmado por</th>
                                        <th className="text-right px-3 py-3 font-semibold text-slate-600 dark:text-slate-400 w-28">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtradas.map((m) => {
                                        const esDueno = m.usuarioNombre === user?.nombre;
                                        const esRoot = user?.rol === "root";
                                        const puedeEditar = esDueno || esRoot;
                                        const items = itemsDe(m);
                                        const totalUnidades = items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);

                                        return (
                                            <tr key={m.id} className="border-b border-slate-100 dark:border-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                                                <td className="px-3 py-3 text-slate-500 dark:text-slate-400 font-mono text-xs align-top">
                                                    #{m.id}
                                                </td>
                                                <td className="px-3 py-3 text-slate-800 dark:text-slate-200 whitespace-nowrap align-top">
                                                    {mostrarFecha(m.fecha)}
                                                </td>
                                                <td className="px-3 py-3">
                                                    <div className="space-y-0.5">
                                                        {items.slice(0, 3).map((it, i) => (
                                                            <div key={i} className="flex items-center gap-1.5 text-xs">
                                                                <span className="text-red-600 dark:text-red-400 font-bold tabular-nums w-8 text-right">
                                                                    −{it.cantidad}
                                                                </span>
                                                                <span className="font-mono text-[10px] text-slate-400 dark:text-slate-500">
                                                                    {it.codigo}
                                                                </span>
                                                                <span className="text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
                                                                    {it.producto}
                                                                </span>
                                                            </div>
                                                        ))}
                                                        {items.length > 3 && (
                                                            <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pl-10">
                                                                + {items.length - 3} producto{items.length - 3 === 1 ? "" : "s"} más
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 text-slate-700 dark:text-slate-300 truncate max-w-[160px] align-top">
                                                    {m.movimiento || "—"}
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-[10px] font-bold uppercase text-white flex-shrink-0">
                                                            {m.usuarioNombre?.[0] || "?"}
                                                        </div>
                                                        <span className="text-xs text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
                                                            {m.usuarioNombre || "—"}
                                                        </span>
                                                        {esDueno && (
                                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-semibold">
                                                                TÚ
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-3 py-3 align-top">
                                                    <div className="flex justify-end gap-1">
                                                        <button
                                                            onClick={() => abrirEditar(m)}
                                                            disabled={!puedeEditar}
                                                            className={`p-2 rounded-lg transition ${puedeEditar
                                                                ? "text-slate-500 dark:text-slate-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 hover:text-sky-600 dark:hover:text-sky-400"
                                                                : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                                                }`}
                                                            title={puedeEditar ? "Editar" : "Solo el autor"}
                                                        >
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                        </button>
                                                        <button
                                                            onClick={() => borrar(m)}
                                                            disabled={!puedeEditar}
                                                            className={`p-2 rounded-lg transition ${puedeEditar
                                                                ? "text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400"
                                                                : "text-slate-300 dark:text-slate-700 cursor-not-allowed"
                                                                }`}
                                                            title={puedeEditar ? "Eliminar" : "Solo el autor"}
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
                        {filtradas.map((m) => {
                            const esDueno = m.usuarioNombre === user?.nombre;
                            const esRoot = user?.rol === "root";
                            const puedeEditar = esDueno || esRoot;
                            const items = itemsDe(m);
                            return (
                                <div key={m.id} className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3.5">
                                    <div className="flex items-center gap-2 flex-wrap mb-2">
                                        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded">
                                            #{m.id}
                                        </span>
                                        <span className="text-xs text-slate-600 dark:text-slate-400">{mostrarFecha(m.fecha)}</span>
                                        {esDueno && (
                                            <span className="text-[9px] px-1.5 py-0.5 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-400 font-semibold">
                                                TÚ
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2 truncate">
                                        {m.movimiento || "—"}
                                    </p>

                                    {/* ITEMS */}
                                    <div className="space-y-1 mb-2">
                                        {items.map((it, i) => (
                                            <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 dark:bg-slate-800/60 rounded-md px-2 py-1.5">
                                                <span className="text-red-600 dark:text-red-400 font-bold tabular-nums w-8 text-right flex-shrink-0">
                                                    −{it.cantidad}
                                                </span>
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-slate-800 dark:text-slate-200 font-medium truncate">
                                                        {it.producto}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 dark:text-slate-500 font-mono truncate">
                                                        {it.codigo}
                                                        {it.numeroLote && ` · ${it.numeroLote}`}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {m.observaciones && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 italic mb-2 truncate">
                                            {m.observaciones}
                                        </p>
                                    )}

                                    <div className="flex items-center gap-2 py-2 border-t border-b border-slate-100 dark:border-slate-800">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-500 to-sky-700 flex items-center justify-center text-[10px] font-bold uppercase text-white flex-shrink-0">
                                            {m.usuarioNombre?.[0] || "?"}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                                                Firmado por
                                            </p>
                                            <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">
                                                {m.usuarioNombre || "—"}
                                            </p>
                                        </div>
                                    </div>

                                    {puedeEditar && (
                                        <div className="flex items-center gap-1.5 pt-2.5">
                                            <button
                                                onClick={() => abrirEditar(m)}
                                                className="flex-1 py-2 text-xs font-medium text-sky-600 dark:text-sky-400 hover:bg-sky-50 dark:hover:bg-sky-950/40 rounded-lg transition"
                                            >
                                                Editar
                                            </button>
                                            <button
                                                onClick={() => borrar(m)}
                                                className="flex-1 py-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition"
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
            )}

            {/* MODAL */}
            <Modal
                open={modalForm}
                onClose={cerrarForm}
                title={editando ? `Editar egreso #${editando}` : "Registrar egreso"}
                size="lg"
            >
                <form onSubmit={guardar} className="space-y-4">
                    <FormSalida
                        values={form}
                        onChange={onFormChange}
                        esEdicion={Boolean(editando)}
                        mapaStock={mapaStock}
                    />
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
                            className="px-4 py-2.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:bg-red-300 dark:disabled:bg-red-900 disabled:cursor-not-allowed rounded-lg transition"
                        >
                            {guardando ? "Guardando..." : editando ? "Guardar cambios" : "Registrar egreso"}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}