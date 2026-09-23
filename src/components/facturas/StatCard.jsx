// components/facturas/StatCard.jsx (reemplaza el StatCard inline en FacturasPage.jsx)

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
            <div className="flex items-center gap-2 mt-1">
                <p className="text-xl sm:text-2xl font-bold tabular-nums break-all">{value}</p>
                {badge}
            </div>
            {sub && <p className="text-xs opacity-80 mt-0.5">{sub}</p>}
        </div>
    );
}

// Badge "A favor" / "En contra" reutilizable
function BadgeSaldo({ saldo }) {
    const positivo = Number(saldo) >= 0;
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
            {positivo ? "A favor" : "En contra"}
        </span>
    );
}