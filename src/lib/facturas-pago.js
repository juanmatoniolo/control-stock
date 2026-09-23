import {
	ref,
	set,
	update,
	remove,
	runTransaction,
	onValue,
} from "firebase/database";
import * as XLSX from "xlsx";
import { db } from "./firebase";
import { normalizarFecha } from "./combustible";

/* ======================================================
   PATHS
   ====================================================== */
export const FACTURAS_PAGO_PATH = "facturas_pago";
export const CONTADOR_FACTURAS_PAGO = "contadores/facturas_pago";

/* ======================================================
   AUTOINCREMENTAL
   ====================================================== */
export async function reservarIdFacturaPago() {
	const counterRef = ref(db, CONTADOR_FACTURAS_PAGO);
	const result = await runTransaction(
		counterRef,
		(current) => (current || 0) + 1,
	);
	return result.snapshot.val();
}

/* ======================================================
   SUSCRIPCIÓN
   ====================================================== */
export function suscribirFacturasPago(callback) {
	const r = ref(db, FACTURAS_PAGO_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) return callback([]);
		const arr = Object.values(snap.val());
		callback(arr);
	});
}

/* ======================================================
   HELPERS
   ====================================================== */
function parseMonto(v) {
	if (v == null || v === "") return 0;
	if (typeof v === "number") return v;
	let s = String(v)
		.trim()
		.replace(/[^\d,.\-]/g, "");
	if (!s) return 0;
	const lastComma = s.lastIndexOf(",");
	const lastDot = s.lastIndexOf(".");
	if (lastComma > -1 && lastDot > -1) {
		s =
			lastComma > lastDot
				? s.replace(/\./g, "").replace(",", ".")
				: s.replace(/,/g, "");
	} else if (lastComma > -1) {
		const dec = s.length - lastComma - 1;
		s = dec === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
	} else if (lastDot > -1) {
		const dec = s.length - lastDot - 1;
		if (dec === 3) s = s.replace(/\./g, "");
	}
	const n = Number(s);
	return isNaN(n) ? 0 : n;
}

function limpiar(data) {
	const estadoPago = data.estadoPago === "pago" ? "pago" : "pendiente";
	const monto = parseMonto(data.monto);
	return {
		fecha: normalizarFecha(data.fecha),
		proveedor: String(data.proveedor || "").trim(),
		numeroFactura: String(data.numeroFactura || "").trim(),
		monto,
		estadoPago,
		fechaPago: estadoPago === "pago" ? normalizarFecha(data.fechaPago) : "",
		notas: String(data.notas || "").trim(),
	};
}

export const FACTURA_PAGO_VACIA = {
	fecha: new Date().toISOString().slice(0, 10),
	proveedor: "",
	numeroFactura: "",
	monto: "",
	estadoPago: "pendiente",
	fechaPago: "",
	notas: "",
};

/* ======================================================
   CRUD
   ====================================================== */
export async function crearFacturaPago(data) {
	const id = await reservarIdFacturaPago();
	const payload = {
		id,
		...limpiar(data),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${FACTURAS_PAGO_PATH}/${id}`), payload);
	return payload;
}

export async function actualizarFacturaPago(id, data) {
	await update(ref(db, `${FACTURAS_PAGO_PATH}/${id}`), {
		...limpiar(data),
		updatedAt: Date.now(),
	});
}

export async function eliminarFacturaPago(id) {
	await remove(ref(db, `${FACTURAS_PAGO_PATH}/${id}`));
}

/* ======================================================
   ESTADOS VISUALES
   ====================================================== */
export const ESTADOS_PAGO = {
	pago: {
		label: "Pagada",
		color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
	},
	pendiente: {
		label: "Pendiente",
		color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
	},
};

/* ======================================================
   HELPERS DE MONTO
   ====================================================== */
export function formatMoneda(n) {
	const num = Number(n) || 0;
	return (
		"$" +
		num.toLocaleString("es-AR", {
			minimumFractionDigits: 2,
			maximumFractionDigits: 2,
		})
	);
}

export function formatCorta(n) {
	const num = Number(n) || 0;
	if (Math.abs(num) >= 1_000_000)
		return `$${(num / 1_000_000).toLocaleString("es-AR", { maximumFractionDigits: 1 })}M`;
	if (Math.abs(num) >= 1_000)
		return `$${(num / 1_000).toLocaleString("es-AR", { maximumFractionDigits: 0 })}k`;
	return `$${num.toLocaleString("es-AR", { maximumFractionDigits: 0 })}`;
}
/* ======================================================
   EXPORTAR A EXCEL
   ====================================================== */

export function exportarExcel(facturas) {
	const filas = facturas.map((f) => ({
		FECHA: f.fecha ? formatearFechaExcel(f.fecha) : "",
		PROVEEDOR: f.proveedor || "",
		"Nº FACTURA": f.numeroFactura || "",
		MONTO: Number(f.monto) || 0,
		"ESTADO DE PAGO": f.estadoPago === "pago" ? "Pago" : "Pendiente",
		"FECHA DE PAGO": f.fechaPago ? formatearFechaExcel(f.fechaPago) : "",
		SALDO: f.estadoPago === "pendiente" ? Number(f.monto) || 0 : 0,
		NOTAS: f.notas || "",
	}));

	const ws = XLSX.utils.json_to_sheet(filas, {
		header: [
			"FECHA",
			"PROVEEDOR",
			"Nº FACTURA",
			"MONTO",
			"ESTADO DE PAGO",
			"FECHA DE PAGO",
			"SALDO",
			"NOTAS",
		],
	});

	ws["!cols"] = [
		{ wch: 12 }, // FECHA
		{ wch: 30 }, // PROVEEDOR
		{ wch: 22 }, // Nº FACTURA
		{ wch: 16 }, // MONTO
		{ wch: 16 }, // ESTADO
		{ wch: 14 }, // FECHA PAGO
		{ wch: 16 }, // SALDO
		{ wch: 30 }, // NOTAS
	];

	// Fila de totales
	const totalMonto = facturas.reduce((s, f) => s + (Number(f.monto) || 0), 0);
	const totalPendiente = facturas
		.filter((f) => f.estadoPago === "pendiente")
		.reduce((s, f) => s + (Number(f.monto) || 0), 0);
	const totalPagado = facturas
		.filter((f) => f.estadoPago === "pago")
		.reduce((s, f) => s + (Number(f.monto) || 0), 0);

	const inicio = filas.length + 2;
	XLSX.utils.sheet_add_aoa(
		ws,
		[
			[],
			["", "", "TOTAL", totalMonto, "", "", totalPendiente, ""],
			["", "", "PAGADO", totalPagado, "", "", "", ""],
			["", "", "PENDIENTE", totalPendiente, "", "", "", ""],
		],
		{ origin: `A${inicio}` },
	);

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Facturas");

	const hoy = new Date();
	const nombre = `facturas_${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}.xlsx`;
	XLSX.writeFile(wb, nombre);
}

// Helper: convertir "YYYY-MM-DD" → "DD/MM/YYYY"
function formatearFechaExcel(iso) {
	if (!iso) return "";
	const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}/${m[2]}/${m[1]}`;
}

/* ======================================================
   IMPORTAR DESDE EXCEL
   ====================================================== */
function normalizarHeader(str) {
	return String(str || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[°º#]/g, "")
		.replace(/[^a-z0-9]/g, "");
}

function detectarCampo(header) {
	const h = normalizarHeader(header);
	if (!h) return null;
	if (h.includes("fechapago") || (h.includes("pago") && h.includes("fecha")))
		return "fechaPago";
	if (h.includes("fecha")) return "fecha";
	if (h.includes("proveedor") || h.includes("prove")) return "proveedor";
	if (
		h.includes("factura") ||
		h.includes("comprob") ||
		h.includes("nfact") ||
		h.includes("numerofact")
	)
		return "numeroFactura";
	if (h.includes("monto") || h.includes("importe") || h.includes("total"))
		return "monto";
	if (h.includes("estado") || h.includes("situacion") || h.includes("pagado"))
		return "estadoPago";
	if (h.includes("nota") || h.includes("observ")) return "notas";
	if (h.includes("saldo")) return "_saldoIgnorado";
	return null;
}

export function parsearExcelFacturas(buffer) {
	const wb = XLSX.read(buffer, { cellDates: true });
	const sheet = wb.Sheets[wb.SheetNames[0]];
	const rows = XLSX.utils.sheet_to_json(sheet, {
		header: 1,
		defval: "",
		raw: true,
	});
	if (rows.length < 2) return [];

	// Buscar la fila de headers (la primera con al menos 2 campos reconocidos)
	let headerRowIdx = 0;
	let headersRaw = [];
	let mapeo = [];

	for (let i = 0; i < Math.min(5, rows.length); i++) {
		const fila = rows[i].map((h) => String(h || "").trim());
		const mapeoActual = fila.map((h) => detectarCampo(h));
		const reconocidos = mapeoActual.filter(Boolean).length;
		if (reconocidos >= 2) {
			headerRowIdx = i;
			headersRaw = fila;
			mapeo = mapeoActual;
			break;
		}
	}

	if (headersRaw.length === 0) {
		headersRaw = (rows[0] || []).map((h) => String(h || "").trim());
		mapeo = headersRaw.map((h) => detectarCampo(h));
	}

	return rows
		.slice(headerRowIdx + 1)
		.filter((r) => r.some((c) => String(c || "").trim() !== ""))
		.map((row) => {
			const obj = {};
			mapeo.forEach((key, i) => {
				if (!key || key === "_saldoIgnorado") return;
				obj[key] = row[i];
			});

			const fecha = normalizarFecha(obj.fecha);
			if (!fecha) return null;

			// Estado: acepta "Pago", "Pagada", "pagado", "Pendiente", etc.
			const estadoRaw = String(obj.estadoPago || "")
				.toLowerCase()
				.trim();
			const estadoPago =
				estadoRaw.includes("pag") && !estadoRaw.includes("pend")
					? "pago"
					: "pendiente";

			return {
				fecha,
				proveedor: String(obj.proveedor || "").trim(),
				numeroFactura: String(obj.numeroFactura || "").trim(),
				monto: parseMonto(obj.monto),
				estadoPago,
				fechaPago:
					estadoPago === "pago" ? normalizarFecha(obj.fechaPago) : "",
				notas: String(obj.notas || "").trim(),
			};
		})
		.filter((f) => f && f.proveedor);
}

export async function importarFacturasPago(lista) {
	if (!lista.length) return 0;

	const ids = [];
	for (let i = 0; i < lista.length; i++) {
		ids.push(await reservarIdFacturaPago());
	}

	const ahora = Date.now();
	const updates = {};
	lista.forEach((f, i) => {
		const id = ids[i];
		updates[`${FACTURAS_PAGO_PATH}/${id}`] = {
			id,
			...limpiar(f),
			createdAt: ahora,
			updatedAt: ahora,
		};
	});

	// Import dinámico para no cargar firebase al inicio
	const { update, ref } = await import("firebase/database");
	await update(ref(db), updates);
	return lista.length;
}

/* ======================================================
   PLANTILLA
   ====================================================== */
export function descargarPlantilla() {
	const ejemplo = [
		{
			FECHA: "01/01/2026",
			PROVEEDOR: "Vi Farma Srl",
			"Nº FACTURA": "A-0001-00091181",
			MONTO: 18093.08,
			"ESTADO DE PAGO": "Pendiente",
			"FECHA DE PAGO": "",
			NOTAS: "Insumos médicos",
		},
		{
			FECHA: "05/01/2026",
			PROVEEDOR: "Coop. Elect. Chajarí",
			"Nº FACTURA": "A-0008-00201019",
			MONTO: 110675.76,
			"ESTADO DE PAGO": "Pago",
			"FECHA DE PAGO": "10/01/2026",
			NOTAS: "Energía eléctrica",
		},
	];

	const ws = XLSX.utils.json_to_sheet(ejemplo, {
		header: [
			"FECHA",
			"PROVEEDOR",
			"Nº FACTURA",
			"MONTO",
			"ESTADO DE PAGO",
			"FECHA DE PAGO",
			"NOTAS",
		],
	});
	ws["!cols"] = [
		{ wch: 12 },
		{ wch: 30 },
		{ wch: 22 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 14 },
		{ wch: 30 },
	];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Facturas");
	XLSX.writeFile(wb, "plantilla_facturas.xlsx");
}
