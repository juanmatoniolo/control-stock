// components/facturas/AnalisisAvanzado.jsx — panel nuevo con estadísticas completas

export default function AnalisisAvanzado({ facturas, conSaldo }) {
    if (!facturas.length) return null;

    const totalIng = facturas.reduce((s, f) => s + (Number(f.ingresos) || 0), 0);
    const totalEgr = facturas.reduce((s, f) => s + (Number(f.egresos) || 0), 0);
    const neto = totalIng - totalEgr;
    const ratio = totalEgr > 0 ? totalIng / totalEgr : totalIng > 0 ? Infinity : 0;

    // Agrupar por mes
    const porMes = {};
    facturas.forEach((f) => {
        const mes = (f.fecha || "").slice(0, 7);
        if (!mes) return;
        if (!porMes[mes]) porMes[mes] = { ingresos: 0, egresos: 0, cantidad: 0 };
        porMes[mes].ingresos += Number(f.ingresos) || 0;
        porMes[mes].egresos += Number(f.egresos) || 0;
        porMes[mes].cantidad += 1;
    });
    const meses = Object.entries(porMes).sort((a, b) => a[0].localeCompare(b[0]));
    const promedioMensualIng = meses.length ? totalIng / meses.length : 0;
    const promedioMensualEgr = meses.length ? totalEgr / meses.length : 0;
    const mesMayorEgreso = meses.reduce(
        (max, [mes, d]) => (d.egresos > (max?.[1]?.egresos || 0) ? [mes, d] : max),
        null
    );
    const mesMayorIngreso = meses.reduce(
        (max, [mes, d]) => (d.ingresos > (max?.[1]?.ingresos || 0) ? [mes, d] : max),
        null
    );

    // Agrupar por categoría (egresos)
    const porCategoria = {};
    facturas.forEach((f) => {
        const cat = f.categoria || "Sin categoría";
        porCategoria[cat] = (porCategoria[cat] || 0) + (Number(f.egresos) || 0);
    });
    const topCategorias = Object.entries(porCategoria)
        .filter(([, v]) => v > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const maxCategoria = topCategorias[0]?.[1] || 1;

    // Agrupar por proveedor (egresos)
    const porProveedor = {};
    facturas.forEach((f) => {
        if (!f.proveedor) return;
        porProveedor[f.proveedor] = (porProveedor[f.proveedor] || 0) + (Number(f.egresos) || 0);
    });
    const topProveedores = Object.entries(porProveedor)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
    const maxProveedor = topProveedores[0]?.[1] || 1;

    // Ticket promedio
    const ingresosCount = facturas.filter((f) => Number(f.ingresos) > 0).length;
    const egresosCount = facturas.filter((f) => Number(f.egresos) > 0).length;
    const ticketPromedioIng = ingresosCount ? totalIng / ingresosCount : 0;
    const ticketPromedioEgr = egresosCount ? totalEgr / egresosCount : 0;

    // Racha de saldo negativo
    const mesesNegativos = meses.filter(([, d]) => d.ingresos - d.egresos < 0).length;

    function fmt(n) {
        return "$" + (Number(n) || 0).toLocaleString("es-AR", { maximumFractionDigits: 0 });
    }
    function nombreMes(m) {
        const [y, mo] = m.split("-");
        const s = new Date(Number(y), Number(mo) - 1).toLocaleDateString("es-AR", { month: "short", year: "numeric" });
        return s.charAt(0).toUpperCase() + s.slice(1);
    }

    return (
        <div className="space-y-4 mt-6">
            <h2 className="text-sm font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Análisis y estadísticas
            </h2>

            {/* KPIs secundarios */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">Ratio ingreso/egreso</p>
                    <p className={`text-lg font-bold tabular-nums ${ratio >= 1 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                        {ratio === Infinity ? "∞" : ratio.toFixed(2)}x
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">Promedio mensual</p>
                    <p className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-200">
                        {fmt(promedioMensualIng - promedioMensualEgr)}
                    </p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">Ticket prom. egreso</p>
                    <p className="text-lg font-bold tabular-nums text-red-600 dark:text-red-400">{fmt(ticketPromedioEgr)}</p>
                </div>
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-3">
                    <p className="text-[10px] uppercase text-slate-400 dark:text-slate-500">Meses en rojo</p>
                    <p className="text-lg font-bold tabular-nums text-amber-600 dark:text-amber-400">
                        {mesesNegativos} / {meses.length}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* TOP CATEGORÍAS */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Top 5 categorías (egresos)
                    </p>
                    <div className="space-y-2">
                        {topCategorias.length === 0 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">Sin egresos categorizados.</p>
                        )}
                        {topCategorias.map(([cat, monto]) => (
                            <div key={cat}>
                                <div className="flex justify-between text-[11px] mb-0.5">
                                    <span className="text-slate-600 dark:text-slate-400 truncate pr-2">
                                        {cat.length > 40 ? cat.slice(0, 37) + "..." : cat}
                                    </span>
                                    <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 flex-shrink-0">
                                        {fmt(monto)}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-red-500"
                                        style={{ width: `${(monto / maxCategoria) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* TOP PROVEEDORES */}
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Top 5 proveedores (egresos)
                    </p>
                    <div className="space-y-2">
                        {topProveedores.length === 0 && (
                            <p className="text-xs text-slate-400 dark:text-slate-500">Sin proveedores cargados.</p>
                        )}
                        {topProveedores.map(([prov, monto]) => (
                            <div key={prov}>
                                <div className="flex justify-between text-[11px] mb-0.5">
                                    <span className="text-slate-600 dark:text-slate-400 truncate pr-2">{prov}</span>
                                    <span className="font-mono tabular-nums text-slate-800 dark:text-slate-200 flex-shrink-0">
                                        {fmt(monto)}
                                    </span>
                                </div>
                                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-sky-500"
                                        style={{ width: `${(monto / maxProveedor) * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* EVOLUCIÓN MENSUAL */}
            {meses.length > 0 && (
                <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                        Evolución mensual (últimos {Math.min(meses.length, 12)} meses)
                    </p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs min-w-[500px]">
                            <thead>
                                <tr className="text-slate-400 dark:text-slate-500 uppercase text-[10px]">
                                    <th className="text-left pb-2">Mes</th>
                                    <th className="text-right pb-2">Ingresos</th>
                                    <th className="text-right pb-2">Egresos</th>
                                    <th className="text-right pb-2">Neto</th>
                                </tr>
                            </thead>
                            <tbody>
                                {meses.slice(-12).map(([mes, d]) => {
                                    const netoMes = d.ingresos - d.egresos;
                                    return (
                                        <tr key={mes} className="border-t border-slate-100 dark:border-slate-800/60">
                                            <td className="py-1.5 text-slate-700 dark:text-slate-300">{nombreMes(mes)}</td>
                                            <td className="py-1.5 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                                                {fmt(d.ingresos)}
                                            </td>
                                            <td className="py-1.5 text-right font-mono tabular-nums text-red-600 dark:text-red-400">
                                                {fmt(d.egresos)}
                                            </td>
                                            <td
                                                className={`py-1.5 text-right font-mono tabular-nums font-bold ${netoMes >= 0 ? "text-slate-800 dark:text-slate-200" : "text-red-600 dark:text-red-400"
                                                    }`}
                                            >
                                                {fmt(netoMes)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DESTACADOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {mesMayorIngreso && (
                    <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-emerald-700 dark:text-emerald-400 font-medium">
                            Mejor mes (ingresos)
                        </p>
                        <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                            {nombreMes(mesMayorIngreso[0])} · {fmt(mesMayorIngreso[1].ingresos)}
                        </p>
                    </div>
                )}
                {mesMayorEgreso && (
                    <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-lg p-3">
                        <p className="text-[10px] uppercase text-red-700 dark:text-red-400 font-medium">
                            Mes con mayor egreso
                        </p>
                        <p className="text-sm font-bold text-red-700 dark:text-red-400">
                            {nombreMes(mesMayorEgreso[0])} · {fmt(mesMayorEgreso[1].egresos)}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}