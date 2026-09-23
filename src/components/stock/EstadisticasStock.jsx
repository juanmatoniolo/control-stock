"use client";

import { useMemo } from "react";
import { ESTADOS, itemsDe } from "@/lib/stock";
import { mostrarFecha } from "@/lib/combustible";

/* ============================================
   HELPERS
   ============================================ */
function formatearMoneda(n) {
    if (!n || n === 0) return "$0";
    return "$" + Number(n).toLocaleString("es-AR", { maximumFractionDigits: 0 });
}

function formatearNumero(n) {
    return Number(n || 0).toLocaleString("es-AR");
}

/* ============================================
   STAT CARD
   ============================================ */
function StatCard({ label, value, sub, accent = "sky", icon }) {
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
            <p className="text-2xl font-bold mt-1 tabular-nums">{value}</p>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

/* ============================================
   BARRA
   ============================================ */
function Barra({ valor, max, color = "sky" }) {
    const pct = max > 0 ? (valor / max) * 100 : 0;
    const colors = {
        sky: "bg-sky-500",
        emerald: "bg-emerald-500",
        red: "bg-red-500",
        amber: "bg-amber-500",
        violet: "bg-violet-500",
    };
    return (
        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full ${colors[color]} transition-all`} style={{ width: `${pct}%` }} />
        </div>
    );
}

/* ============================================
   MINI ITEM DE MOVIMIENTO
   ============================================ */
function MovimientoMini({ mov, esEntrada }) {
    const items = itemsDe(mov);
    const totalUnidades = items.reduce((s, it) => s + (Number(it.cantidad) || 0), 0);

    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
            <div
                className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${esEntrada
                    ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
                    : "bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400"
                    }`}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    {esEntrada ? (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                    )}
                </svg>
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-mono text-slate-400 dark:text-slate-500">#{mov.id}</span>
                    <span className="text-xs text-slate-500 dark:text-slate-400">{mostrarFecha(mov.fecha)}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-full">
                        {items.length} item{items.length === 1 ? "" : "s"}
                    </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 truncate mt-0.5">
                    {items
                        .slice(0, 2)
                        .map((it) => it.producto)
                        .join(", ")}
                    {items.length > 2 && ` +${items.length - 2}`}
                </p>
            </div>
            <div className="text-right flex-shrink-0">
                <p
                    className={`text-sm font-bold tabular-nums ${esEntrada ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
                        }`}
                >
                    {esEntrada ? "+" : "−"}
                    {totalUnidades}
                </p>
            </div>
        </div>
    );
}

/* ============================================
   PRODUCTO TOP (fila)
   ============================================ */
function ProductoTop({ item, rank, max, tipo }) {
    const valor =
        tipo === "salidas"
            ? item.salidas
            : tipo === "entradas"
                ? item.entradas
                : item.valorTotal;

    return (
        <div className="flex items-center gap-3 py-2.5 border-b border-slate-100 dark:border-slate-800/60 last:border-b-0">
            <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 flex-shrink-0">
                {rank}
            </div>
            <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">{item.codigo}</span>
                </div>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">{item.producto}</p>
                <div className="mt-1">
                    <Barra valor={valor} max={max} color={tipo === "salidas" ? "red" : tipo === "entradas" ? "emerald" : "sky"} />
                </div>
            </div>
            <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {tipo === "valor" ? formatearMoneda(valor) : formatearNumero(valor)}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">
                    {tipo === "salidas" ? "salidas" : tipo === "entradas" ? "entradas" : "en stock"}
                </p>
            </div>
        </div>
    );
}

/* ============================================
   ESTADÍSTICAS PRINCIPALES
   ============================================ */
export default function EstadisticasStock({ stock, movimientos }) {
    /* ============ CÁLCULOS ============ */
    const stats = useMemo(() => {
        const ahora = new Date();
        const hace30 = new Date();
        hace30.setDate(hace30.getDate() - 30);
        const iso30 = hace30.toISOString().slice(0, 10);

        // Valor del inventario
        let valorTotal = 0;
        let unidadesTotal = 0;
        let productosConValor = 0;
        const valoresPorProducto = [];

        stock.forEach((s) => {
            const precio = Number(s.ultimoPrecioUnitario) || 0;
            const valor = s.stockActual > 0 ? s.stockActual * precio : 0;
            valorTotal += valor;
            unidadesTotal += Math.max(0, s.stockActual);
            if (valor > 0) {
                productosConValor++;
                valoresPorProducto.push({ ...s, valorTotal: valor });
            }
        });

        // Alertas
        const sinStock = stock.filter((s) => s.estado === "sin-stock" && s.activo !== false);
        const bajos = stock.filter((s) => s.estado === "bajo" && s.activo !== false);
        const normales = stock.filter((s) => s.estado === "normal" && s.activo !== false);

        // Movimientos últimos 30 días
        const movsRecientes = movimientos.filter((m) => (m.fecha || "") >= iso30);
        const entradas30 = movsRecientes.filter((m) => m.tipo === "entrada");
        const salidas30 = movsRecientes.filter((m) => m.tipo === "salida");

        // Dinero que entró y salió
        let dineroEntrado30 = 0;
        let dineroSalido30 = 0;
        let unidadesEntradas30 = 0;
        let unidadesSalidas30 = 0;

        entradas30.forEach((m) => {
            itemsDe(m).forEach((it) => {
                dineroEntrado30 += Number(it.precioTotal) || 0;
                unidadesEntradas30 += Number(it.cantidad) || 0;
            });
        });
        salidas30.forEach((m) => {
            itemsDe(m).forEach((it) => {
                dineroSalido30 += Number(it.precioTotal) || 0;
                unidadesSalidas30 += Number(it.cantidad) || 0;
            });
        });

        // Top productos
        const masVendidos = [...stock]
            .filter((s) => s.salidas > 0)
            .sort((a, b) => b.salidas - a.salidas)
            .slice(0, 5);

        const masIngresados = [...stock]
            .filter((s) => s.entradas > 0)
            .sort((a, b) => b.entradas - a.entradas)
            .slice(0, 5);

        const masValor = [...valoresPorProducto]
            .sort((a, b) => b.valorTotal - a.valorTotal)
            .slice(0, 5);

        // Últimos movimientos
        const ultimasEntradas = movimientos.filter((m) => m.tipo === "entrada").slice(0, 5);
        const ultimasSalidas = movimientos.filter((m) => m.tipo === "salida").slice(0, 5);

        // Top vendedores
        const porVendedor = {};
        movimientos
            .filter((m) => m.tipo === "salida")
            .forEach((m) => {
                const k = m.usuarioNombre || "—";
                if (!porVendedor[k]) porVendedor[k] = { nombre: k, egresos: 0, unidades: 0 };
                porVendedor[k].egresos += 1;
                itemsDe(m).forEach((it) => {
                    porVendedor[k].unidades += Number(it.cantidad) || 0;
                });
            });
        const topVendedores = Object.values(porVendedor)
            .sort((a, b) => b.unidades - a.unidades)
            .slice(0, 5);

        // Vencimientos próximos
        const hoy = new Date().toISOString().slice(0, 10);
        const en30dias = new Date();
        en30dias.setDate(en30dias.getDate() + 30);
        const iso30dias = en30dias.toISOString().slice(0, 10);

        const porVencer = stock
            .filter((s) => s.proximoVencimiento && s.proximoVencimiento >= hoy && s.proximoVencimiento <= iso30dias)
            .sort((a, b) => (a.proximoVencimiento || "").localeCompare(b.proximoVencimiento || ""))
            .slice(0, 5);

        return {
            valorTotal,
            unidadesTotal,
            productosConValor,
            sinStock,
            bajos,
            normales,
            entradas30: entradas30.length,
            salidas30: salidas30.length,
            dineroEntrado30,
            dineroSalido30,
            unidadesEntradas30,
            unidadesSalidas30,
            masVendidos,
            masIngresados,
            masValor,
            ultimasEntradas,
            ultimasSalidas,
            topVendedores,
            porVencer,
        };
    }, [stock, movimientos]);

    const maxVendidos = stats.masVendidos[0]?.salidas || 1;
    const maxIngresados = stats.masIngresados[0]?.entradas || 1;
    const maxValor = stats.masValor[0]?.valorTotal || 1;
    const maxVendedor = stats.topVendedores[0]?.unidades || 1;

    /* ============ RENDER ============ */
    return (
        <div className="space-y-5">
            {/* ============================================
          FILA 1: KPIs PRINCIPALES
          ============================================ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Valor del inventario"
                    value={formatearMoneda(stats.valorTotal)}
                    sub={`${formatearNumero(stats.unidadesTotal)} unidades en stock`}
                    accent="emerald"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Productos activos"
                    value={stock.filter((s) => s.activo !== false).length}
                    sub={`${stats.normales.length} con stock normal`}
                    accent="sky"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                        </svg>
                    }
                />
                <StatCard
                    label="Stock bajo"
                    value={stats.bajos.length}
                    sub="Requieren reposición"
                    accent="amber"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                    }
                />
                <StatCard
                    label="Sin stock"
                    value={stats.sinStock.length}
                    sub="No disponibles"
                    accent="red"
                    icon={
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                    }
                />
            </div>

            {/* ============================================
          FILA 2: ÚLTIMOS 30 DÍAS
          ============================================ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <StatCard
                    label="Entradas (30 días)"
                    value={stats.entradas30}
                    sub={`${formatearNumero(stats.unidadesEntradas30)} unidades`}
                    accent="violet"
                />
                <StatCard
                    label="Salidas (30 días)"
                    value={stats.salidas30}
                    sub={`${formatearNumero(stats.unidadesSalidas30)} unidades`}
                    accent="violet"
                />
                <StatCard
                    label="Comprado (30 días)"
                    value={formatearMoneda(stats.dineroEntrado30)}
                    sub="Valor de entradas"
                    accent="slate"
                />
                <StatCard
                    label="Entregado (30 días)"
                    value={formatearMoneda(stats.dineroSalido30)}
                    sub="Valor de salidas"
                    accent="slate"
                />
            </div>

            {/* ============================================
          FILA 3: ALERTAS DE STOCK
          ============================================ */}
            {(stats.bajos.length > 0 || stats.sinStock.length > 0) && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Alertas de stock
                        </h3>
                        <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
                            {stats.sinStock.length + stats.bajos.length} producto{stats.sinStock.length + stats.bajos.length === 1 ? "" : "s"}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* SIN STOCK */}
                        {stats.sinStock.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-wider text-red-600 dark:text-red-400 font-semibold mb-2">
                                    Sin stock ({stats.sinStock.length})
                                </p>
                                <div className="space-y-1">
                                    {stats.sinStock.slice(0, 5).map((s) => (
                                        <div
                                            key={s.codigo}
                                            className="flex items-center justify-between gap-2 p-2 bg-red-50 dark:bg-red-950/30 rounded-lg"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="text-[10px] font-mono text-red-600 dark:text-red-400">
                                                        {s.codigo}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                                    {s.producto}
                                                </p>
                                            </div>
                                            <span className="text-xs font-bold text-red-600 dark:text-red-400 flex-shrink-0">
                                                0
                                            </span>
                                        </div>
                                    ))}
                                    {stats.sinStock.length > 5 && (
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-1">
                                            + {stats.sinStock.length - 5} más
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* STOCK BAJO */}
                        {stats.bajos.length > 0 && (
                            <div>
                                <p className="text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400 font-semibold mb-2">
                                    Stock bajo ({stats.bajos.length})
                                </p>
                                <div className="space-y-1">
                                    {stats.bajos.slice(0, 5).map((s) => (
                                        <div
                                            key={s.codigo}
                                            className="flex items-center justify-between gap-2 p-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg"
                                        >
                                            <div className="min-w-0 flex-1">
                                                <span className="text-[10px] font-mono text-amber-600 dark:text-amber-400">
                                                    {s.codigo}
                                                </span>
                                                <p className="text-xs text-slate-700 dark:text-slate-300 truncate">
                                                    {s.producto}
                                                </p>
                                            </div>
                                            <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex-shrink-0 tabular-nums">
                                                {s.stockActual} / {s.stockMinimo}
                                            </span>
                                        </div>
                                    ))}
                                    {stats.bajos.length > 5 && (
                                        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic pt-1">
                                            + {stats.bajos.length - 5} más
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ============================================
          FILA 4: TOPs (3 columnas)
          ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* MÁS VENDIDOS */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Más usados (salidas)
                        </h3>
                    </div>
                    {stats.masVendidos.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            Sin salidas registradas.
                        </p>
                    ) : (
                        <div>
                            {stats.masVendidos.map((s, i) => (
                                <ProductoTop
                                    key={s.codigo}
                                    item={s}
                                    rank={i + 1}
                                    max={maxVendidos}
                                    tipo="salidas"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* MÁS INGRESADOS */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Más ingresados (entradas)
                        </h3>
                    </div>
                    {stats.masIngresados.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            Sin entradas registradas.
                        </p>
                    ) : (
                        <div>
                            {stats.masIngresados.map((s, i) => (
                                <ProductoTop
                                    key={s.codigo}
                                    item={s}
                                    rank={i + 1}
                                    max={maxIngresados}
                                    tipo="entradas"
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* MAYOR VALOR EN STOCK */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Mayor valor en stock
                        </h3>
                    </div>
                    {stats.masValor.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            Sin productos con precio registrado.
                        </p>
                    ) : (
                        <div>
                            {stats.masValor.map((s, i) => (
                                <ProductoTop
                                    key={s.codigo}
                                    item={s}
                                    rank={i + 1}
                                    max={maxValor}
                                    tipo="valor"
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================
          FILA 5: ÚLTIMOS MOVIMIENTOS + VENDEDORES
          ============================================ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* ÚLTIMAS ENTRADAS */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                        </svg>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Últimas entradas
                        </h3>
                    </div>
                    {stats.ultimasEntradas.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            Sin entradas.
                        </p>
                    ) : (
                        <div>
                            {stats.ultimasEntradas.map((m) => (
                                <MovimientoMini key={m.id} mov={m} esEntrada />
                            ))}
                        </div>
                    )}
                </div>

                {/* ÚLTIMAS SALIDAS */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                        </svg>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Últimas salidas
                        </h3>
                    </div>
                    {stats.ultimasSalidas.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            Sin salidas.
                        </p>
                    ) : (
                        <div>
                            {stats.ultimasSalidas.map((m) => (
                                <MovimientoMini key={m.id} mov={m} esEntrada={false} />
                            ))}
                        </div>
                    )}
                </div>

                {/* TOP VENDEDORES */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-violet-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Top vendedores
                        </h3>
                    </div>
                    {stats.topVendedores.length === 0 ? (
                        <p className="text-xs text-slate-400 dark:text-slate-500 text-center py-4">
                            Sin actividad de vendedores.
                        </p>
                    ) : (
                        <div className="space-y-2.5">
                            {stats.topVendedores.map((v, i) => (
                                <div key={v.nombre} className="flex items-center gap-3">
                                    <div
                                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${i === 0
                                            ? "bg-gradient-to-br from-amber-400 to-amber-600 text-white"
                                            : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                                            }`}
                                    >
                                        {v.nombre[0]?.toUpperCase() || "?"}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                            {v.nombre}
                                        </p>
                                        <div className="mt-1">
                                            <Barra valor={v.unidades} max={maxVendedor} color="violet" />
                                        </div>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                                            {v.unidades}
                                        </p>
                                        <p className="text-[10px] text-slate-400 dark:text-slate-500">
                                            {v.egresos} egreso{v.egresos === 1 ? "" : "s"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ============================================
          FILA 6: VENCIMIENTOS PRÓXIMOS (30 días)
          ============================================ */}
            {stats.porVencer.length > 0 && (
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/20 rounded-xl border border-amber-200 dark:border-amber-900 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                            Próximos vencimientos (30 días)
                        </h3>
                        <span className="ml-auto text-xs text-amber-700 dark:text-amber-400">
                            {stats.porVencer.length} producto{stats.porVencer.length === 1 ? "" : "s"}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                        {stats.porVencer.map((s) => {
                            const [y, m, d] = s.proximoVencimiento.split("-").map(Number);
                            const vto = new Date(y, m - 1, d);
                            const hoy = new Date();
                            hoy.setHours(0, 0, 0, 0);
                            const dias = Math.ceil((vto - hoy) / (1000 * 60 * 60 * 24));
                            return (
                                <div
                                    key={s.codigo}
                                    className="bg-white/60 dark:bg-slate-900/60 backdrop-blur rounded-lg p-3 flex items-center justify-between gap-2"
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[10px] font-mono text-amber-700 dark:text-amber-400">
                                            {s.codigo}
                                        </p>
                                        <p className="text-xs font-medium text-slate-800 dark:text-slate-200 truncate">
                                            {s.producto}
                                        </p>
                                        <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                                            {mostrarFecha(s.proximoVencimiento)}
                                        </p>
                                    </div>
                                    <div className="text-right flex-shrink-0">
                                        <p
                                            className={`text-lg font-bold tabular-nums ${dias <= 7
                                                ? "text-red-600 dark:text-red-400"
                                                : dias <= 15
                                                    ? "text-amber-600 dark:text-amber-400"
                                                    : "text-slate-600 dark:text-slate-400"
                                                }`}
                                        >
                                            {dias}
                                        </p>
                                        <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">
                                            {dias === 1 ? "día" : "días"}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* MENSAJE SI NO HAY NADA */}
            {movimientos.length === 0 && stock.length === 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-10 text-center">
                    <p className="text-slate-400 dark:text-slate-500 text-sm">
                        Todavía no hay datos para mostrar estadísticas.
                    </p>
                </div>
            )}
        </div>
    );
}