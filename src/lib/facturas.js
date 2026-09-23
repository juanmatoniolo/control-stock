import {
	ref,
	set,
	update,
	remove,
	runTransaction,
	onValue,
} from "firebase/database";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { db } from "./firebase";
import { mostrarFecha } from "./combustible";

/* ======================================================
   HELPERS DE TEXTO
   ====================================================== */
// Normaliza texto: trim + colapsa espacios múltiples
export function normalizarTexto(v) {
	if (v == null) return "";
	return String(v).replace(/\s+/g, " ").trim();
}

/* ======================================================
   HELPERS DE MONEDA Y FECHA
   ====================================================== */

// Parsea cualquier string de moneda detectando el separador decimal real:
// "$ 1.234,56" (AR) → 1234.56 | "1,234.56" (US) → 1234.56 | "1234.56" → 1234.56 | "1234" → 1234
export function parseMoneda(valor) {
	if (valor == null || valor === "") return 0;
	if (typeof valor === "number") return valor;

	let s = String(valor)
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
		const decimales = s.length - lastComma - 1;
		s = decimales === 3 ? s.replace(/,/g, "") : s.replace(",", ".");
	} else if (lastDot > -1) {
		const decimales = s.length - lastDot - 1;
		if (decimales === 3) s = s.replace(/\./g, "");
	}

	const n = Number(s);
	return isNaN(n) ? 0 : n;
}

// Formatea un número como moneda AR con 2 decimales: 1234.5 → "1.234,50"
export function formatInputMoneda(valor) {
	if (valor == null || valor === "") return "";
	const num = typeof valor === "number" ? valor : parseMoneda(valor);
	if (!num && num !== 0) return "";
	return num.toLocaleString("es-AR", {
		minimumFractionDigits: 2,
		maximumFractionDigits: 2,
	});
}

// Formatea fecha en dd/mm/aaaa para mostrar
export function fechaCorta(iso) {
	if (!iso) return "";
	const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}/${m[2]}/${m[1]}`;
}

// Convierte serial de fecha de Excel a ISO yyyy-mm-dd
function excelSerialToISO(serial) {
	const utcDays = Math.floor(serial - 25569);
	const utcValue = utcDays * 86400 * 1000;
	const date = new Date(utcValue);
	const y = date.getUTCFullYear();
	const m = String(date.getUTCMonth() + 1).padStart(2, "0");
	const d = String(date.getUTCDate()).padStart(2, "0");
	return `${y}-${m}-${d}`;
}

// Normaliza cualquier representación de fecha a ISO yyyy-mm-dd
export function normalizarFecha(valor) {
	if (valor === null || valor === undefined || valor === "") return "";

	if (valor instanceof Date) {
		if (isNaN(valor.getTime())) return "";
		const y = valor.getFullYear();
		const m = String(valor.getMonth() + 1).padStart(2, "0");
		const d = String(valor.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}

	if (typeof valor === "number") {
		return excelSerialToISO(valor);
	}

	const s = String(valor).trim();
	if (!s) return "";

	let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
	if (m) {
		return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
	}

	m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
	if (m) {
		let [, d, mo, y] = m;
		if (y.length === 2) y = (Number(y) > 50 ? "19" : "20") + y;
		const diaNum = Number(d);
		const mesNum = Number(mo);
		if (mesNum > 12 && diaNum <= 12) {
			return `${y}-${d.padStart(2, "0")}-${mo.padStart(2, "0")}`;
		}
		return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
	}

	return "";
}

/* ======================================================
   PATHS
   ====================================================== */
export const FACTURAS_PATH = "facturas";
export const CONTADOR_FACTURAS = "contadores/facturas";

/* ======================================================
   AUTOINCREMENTAL
   ====================================================== */
export async function reservarIdFactura() {
	const counterRef = ref(db, CONTADOR_FACTURAS);
	const result = await runTransaction(
		counterRef,
		(current) => (current || 0) + 1,
	);
	return result.snapshot.val();
}

/* ======================================================
   SUSCRIPCIÓN
   ====================================================== */
export function suscribirFacturas(callback) {
	const r = ref(db, FACTURAS_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) return callback([]);
		const arr = Object.values(snap.val());
		callback(arr);
	});
}

/* ======================================================
   HELPERS
   ====================================================== */
function parseNumero(v) {
	return parseMoneda(v);
}

function limpiarFactura(data) {
	const ingresos = parseMoneda(data.ingresos ?? data.creditos);
	const egresos = parseMoneda(data.egresos ?? data.debitos);
	return {
		fecha: normalizarFecha(data.fecha),
		concepto: normalizarTexto(data.concepto),
		comprobante: normalizarTexto(data.comprobante),
		proveedor: normalizarTexto(data.proveedor),
		ingresos,
		egresos,
		categoria: normalizarTexto(data.categoria),
		notas: normalizarTexto(data.notas),
	};
}

export function normalizarFactura(f) {
	if (!f) return f;
	return {
		...f,
		ingresos: Number(f.ingresos ?? f.creditos ?? 0),
		egresos: Number(f.egresos ?? f.debitos ?? 0),
	};
}

export const FACTURA_VACIA = {
	fecha: new Date().toISOString().slice(0, 10),
	concepto: "",
	comprobante: "",
	proveedor: "",
	ingresos: "",
	egresos: "",
	categoria: "Pendiente",
	notas: "",
};

/* ======================================================
   CRUD
   ====================================================== */
export async function crearFactura(data) {
	const id = await reservarIdFactura();
	const payload = {
		id,
		...limpiarFactura(data),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${FACTURAS_PATH}/${id}`), payload);
	return payload;
}

export async function actualizarFactura(id, data) {
	await update(ref(db, `${FACTURAS_PATH}/${id}`), {
		...limpiarFactura(data),
		updatedAt: Date.now(),
	});
}

export async function eliminarFactura(id) {
	await remove(ref(db, `${FACTURAS_PATH}/${id}`));
}

/* ======================================================
   CÁLCULO DE SALDO CORRIDO
   ====================================================== */
export function calcularSaldos(facturas) {
	const ordenadas = [...facturas].map(normalizarFactura).sort((a, b) => {
		const fa = a.fecha || "";
		const fb = b.fecha || "";
		if (fa !== fb) return fa.localeCompare(fb);
		return (Number(a.id) || 0) - (Number(b.id) || 0);
	});

	let saldo = 0;
	return ordenadas.map((f) => {
		saldo += (Number(f.ingresos) || 0) - (Number(f.egresos) || 0);
		return { ...f, saldo };
	});
}

/* ======================================================
   CATEGORÍAS FRECUENTES
   ====================================================== */
export const CATEGORIAS = [
	"Pendiente",
	"Inicio de actividades",
	"BIENES DE CONSUMO - PROD. FARMACÉUTICOS Y MEDICAMENTOS E INSUMOS DE ENFERMERÍA",
	"BIENES DE CONSUMO - COMBUSTIBLES Y LUBRICANTES (SOLO VEHÍCULOS OFICIALES)",
	"BIENES DE CONSUMO - OTROS VARIOS",
	"BIENES DE CONSUMO - MATERIAL DE LIBRERÍA",
	"SERVICIOS, LUZ, TELEFONO, INTERNET, GAS",
	"SERVICIOS NO PERSONALES - OTROS VARIOS",
	"SERVICIOS - GASTOS DE SEGURO (SOLO VEHÍCULOS OFICIALES)",
	"SERVICIOS - MANTENIMIENTO Y REPARACIONES",
	"SERVICIOS - ALQUILERES",
	"PERSONAL - SUELDOS Y JORNALES",
	"PERSONAL - CARGAS SOCIALES",
	"APORTES Y CONTRIBUCIONES",
	"IMPUESTOS, TASAS Y CONTRIBUCIONES",
	"BIENES DE USO - MAQUINARIA Y EQUIPO",
	"BIENES DE USO - RODADOS",
	"OTROS",
];

/* ======================================================
   EXPORTAR EXCEL
   ====================================================== */
export function exportarExcel(facturas) {
	const filas = facturas.map((f) => ({
		FECHA: mostrarFecha(f.fecha),
		CONCEPTO: f.concepto || "",
		COMPROBANTE: f.comprobante || "",
		PROVEEDOR: f.proveedor || "",
		INGRESOS: Number(f.ingresos) || 0,
		EGRESOS: Number(f.egresos) || 0,
		SALDO: Number(f.saldo) || 0,
		"CATEGORÍA FEDERACIÓN": f.categoria || "",
		NOTAS: f.notas || "",
	}));

	const ws = XLSX.utils.json_to_sheet(filas, {
		header: [
			"FECHA",
			"CONCEPTO",
			"COMPROBANTE",
			"PROVEEDOR",
			"INGRESOS",
			"EGRESOS",
			"SALDO",
			"CATEGORÍA FEDERACIÓN",
			"NOTAS",
		],
	});

	ws["!cols"] = [
		{ wch: 12 },
		{ wch: 40 },
		{ wch: 22 },
		{ wch: 26 },
		{ wch: 14 },
		{ wch: 14 },
		{ wch: 14 },
		{ wch: 48 },
		{ wch: 30 },
	];

	const totalIng = facturas.reduce(
		(s, f) => s + (Number(f.ingresos) || 0),
		0,
	);
	const totalEgr = facturas.reduce((s, f) => s + (Number(f.egresos) || 0), 0);
	const ultimoSaldo = facturas.length
		? Number(facturas[facturas.length - 1].saldo) || 0
		: 0;

	const inicio = filas.length + 2;
	XLSX.utils.sheet_add_aoa(
		ws,
		[[], ["", "", "", "TOTALES", totalIng, totalEgr, ultimoSaldo, "", ""]],
		{ origin: `A${inicio}` },
	);

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Libro contable");

	const hoy = new Date();
	const nombre = `libro_contable_${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}.xlsx`;
	XLSX.writeFile(wb, nombre);
}

/* ======================================================
   EXPORTAR PDF
   ====================================================== */
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

export function exportarPDF(facturas, opciones = {}) {
	const {
		titulo = "LIBRO CONTABLE",
		subtitulo = "",
		saldoInicial = 0,
		mostrarSaldoInicial = false,
	} = opciones;

	const doc = new jsPDF({
		orientation: "landscape",
		unit: "mm",
		format: "a4",
	});

	doc.setFontSize(16);
	doc.setFont("helvetica", "bold");
	doc.text(titulo, 14, 15);

	doc.setFontSize(9);
	doc.setFont("helvetica", "normal");
	doc.setTextColor(100);
	doc.text("Sistema de Control de Stock", 14, 21);
	if (subtitulo) doc.text(subtitulo, 14, 26);

	const hoy = new Date();
	doc.text(
		`Generado: ${hoy.toLocaleDateString("es-AR")} ${hoy.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}`,
		14,
		subtitulo ? 31 : 26,
	);

	doc.setTextColor(0);

	const body = facturas.map((f) => [
		mostrarFecha(f.fecha),
		f.concepto || "",
		f.comprobante || "",
		f.proveedor || "",
		f.ingresos ? formatMoneda(f.ingresos) : "",
		f.egresos ? formatMoneda(f.egresos) : "",
		formatMoneda(f.saldo),
		f.categoria || "",
	]);

	if (mostrarSaldoInicial) {
		body.unshift([
			"",
			"Saldo inicial del período",
			"",
			"",
			"",
			"",
			formatMoneda(saldoInicial),
			"",
		]);
	}

	const totalIng = facturas.reduce(
		(s, f) => s + (Number(f.ingresos) || 0),
		0,
	);
	const totalEgr = facturas.reduce((s, f) => s + (Number(f.egresos) || 0), 0);
	const saldoFinal = facturas.length
		? Number(facturas[facturas.length - 1].saldo) || 0
		: saldoInicial;

	body.push([
		"",
		"TOTALES DEL PERÍODO",
		"",
		"",
		formatMoneda(totalIng),
		formatMoneda(totalEgr),
		formatMoneda(saldoFinal),
		"",
	]);

	autoTable(doc, {
		startY: subtitulo ? 36 : 31,
		head: [
			[
				"FECHA",
				"CONCEPTO",
				"COMPROBANTE",
				"PROVEEDOR",
				"INGRESOS",
				"EGRESOS",
				"SALDO",
				"CATEGORÍA FEDERACIÓN",
			],
		],
		body,
		theme: "grid",
		styles: {
			fontSize: 7,
			cellPadding: 1.5,
			lineColor: [200, 200, 200],
			lineWidth: 0.1,
			valign: "middle",
		},
		headStyles: {
			fillColor: [15, 23, 42],
			textColor: 255,
			fontStyle: "bold",
			fontSize: 7.5,
			halign: "center",
		},
		alternateRowStyles: { fillColor: [248, 250, 252] },
		columnStyles: {
			0: { cellWidth: 18, halign: "center" },
			1: { cellWidth: 55 },
			2: { cellWidth: 28, halign: "center" },
			3: { cellWidth: 38 },
			4: { cellWidth: 22, halign: "right", font: "courier" },
			5: { cellWidth: 22, halign: "right", font: "courier" },
			6: {
				cellWidth: 24,
				halign: "right",
				font: "courier",
				fontStyle: "bold",
			},
			7: { cellWidth: "auto" },
		},
		didParseCell: (data) => {
			if (data.row.index === body.length - 1) {
				data.cell.styles.fillColor = [15, 23, 42];
				data.cell.styles.textColor = 255;
				data.cell.styles.fontStyle = "bold";
			}
			if (mostrarSaldoInicial && data.row.index === 0) {
				data.cell.styles.fillColor = [241, 245, 249];
				data.cell.styles.fontStyle = "italic";
			}
			if (data.section === "body" && data.row.index !== body.length - 1) {
				if (data.column.index === 4 && data.cell.raw)
					data.cell.styles.textColor = [16, 185, 129];
				if (data.column.index === 5 && data.cell.raw)
					data.cell.styles.textColor = [220, 38, 38];
			}
			if (data.section === "body" && data.column.index === 6) {
				const num =
					Number(
						String(data.cell.raw || "")
							.replace(/[^\d,-]/g, "")
							.replace(/\./g, "")
							.replace(",", "."),
					) || 0;
				if (num < 0) data.cell.styles.textColor = [220, 38, 38];
			}
		},
	});

	const pageCount = doc.internal.getNumberOfPages();
	for (let i = 1; i <= pageCount; i++) {
		doc.setPage(i);
		doc.setFontSize(8);
		doc.setTextColor(150);
		doc.text(
			`Página ${i} de ${pageCount}`,
			doc.internal.pageSize.getWidth() - 30,
			doc.internal.pageSize.getHeight() - 8,
		);
	}

	doc.save(`libro_contable_${hoy.toISOString().slice(0, 10)}.pdf`);
}

/* ======================================================
   IMPORTAR EXCEL
   ====================================================== */
function normalizarHeader(str) {
	return String(str || "")
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.replace(/[^a-z0-9]/g, "");
}

const MAPA = {
	fecha: "fecha",
	concepto: "concepto",
	comprobante: "comprobante",
	proveedor: "proveedor",
	ingresos: "ingresos",
	ingreso: "ingresos",
	egresos: "egresos",
	egreso: "egresos",
	debitos: "egresos",
	debito: "egresos",
	creditos: "ingresos",
	credito: "ingresos",
	haber: "ingresos",
	debe: "egresos",
	saldo: "_saldoIgnorado",
	categoriafederacion: "categoria",
	categoria: "categoria",
	notas: "notas",
};

export function parsearExcelFacturas(buffer) {
	const wb = XLSX.read(buffer, { cellDates: true });
	const sheet = wb.Sheets[wb.SheetNames[0]];
	const rows = XLSX.utils.sheet_to_json(sheet, {
		header: 1,
		defval: "",
		raw: true,
	});
	if (rows.length < 2) return [];

	const rawHeaders = rows[0].map((h) => String(h || "").trim());
	const mapped = rawHeaders.map((h) => MAPA[normalizarHeader(h)] || null);

	if (!mapped.includes("fecha")) return [];

	return rows
		.slice(1)
		.filter((r) => r.some((c) => String(c || "").trim() !== ""))
		.map((row) => {
			const obj = {};
			mapped.forEach((key, i) => {
				if (!key || key === "_saldoIgnorado") return;
				obj[key] = row[i];
			});
			return {
				fecha: normalizarFecha(obj.fecha),
				concepto: normalizarTexto(obj.concepto),
				comprobante: normalizarTexto(obj.comprobante),
				proveedor: normalizarTexto(obj.proveedor),
				ingresos: parseNumero(obj.ingresos),
				egresos: parseNumero(obj.egresos),
				categoria: normalizarTexto(obj.categoria) || "Pendiente",
				notas: normalizarTexto(obj.notas),
			};
		})
		.filter((f) => f.fecha);
}

export async function importarFacturas(lista) {
	if (!lista.length) return 0;
	const ids = [];
	for (let i = 0; i < lista.length; i++) {
		ids.push(await reservarIdFactura());
	}

	const ahora = Date.now();
	const updates = {};
	lista.forEach((f, i) => {
		const id = ids[i];
		updates[`${FACTURAS_PATH}/${id}`] = {
			id,
			...limpiarFactura(f),
			createdAt: ahora,
			updatedAt: ahora,
		};
	});

	await update(ref(db), updates);
	return lista.length;
}

/* ======================================================
   MULTI-CREACIÓN
   ====================================================== */
export async function crearFacturasBatch(lista) {
	if (!lista.length) return [];

	const ids = [];
	for (let i = 0; i < lista.length; i++) {
		ids.push(await reservarIdFactura());
	}

	const ahora = Date.now();
	const updates = {};
	lista.forEach((f, i) => {
		const id = ids[i];
		updates[`${FACTURAS_PATH}/${id}`] = {
			id,
			...limpiarFactura(f),
			createdAt: ahora,
			updatedAt: ahora,
		};
	});

	await update(ref(db), updates);
	return ids;
}

export const ASIENTO_VACIO_BATCH = {
	fecha: new Date().toISOString().slice(0, 10),
	concepto: "",
	comprobante: "",
	proveedor: "",
	ingresos: "",
	egresos: "",
	categoria: "Pendiente",
	notas: "",
};

/* ======================================================
   CIERRE DE EJERCICIO
   ====================================================== */
export const CIERRES_PATH = "cierres";

export function suscribirCierres(callback) {
	const r = ref(db, CIERRES_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) return callback([]);
		const arr = Object.values(snap.val()).sort(
			(a, b) => b.createdAt - a.createdAt,
		);
		callback(arr);
	});
}

export async function cerrarEjercicio(opciones) {
	const {
		nombre = `Ejercicio ${new Date().getFullYear()}`,
		modo = "continuar",
		crearSaldoInicial = true,
		saldoFinal = 0,
		totalIngresos = 0,
		totalEgresos = 0,
		cantidadMovimientos = 0,
	} = opciones;

	const cierreId = Date.now();
	const cierreBase = {
		id: cierreId,
		nombre,
		fechaCierre: new Date().toISOString(),
		modo,
		saldoFinal,
		totalIngresos,
		totalEgresos,
		cantidadMovimientos,
		createdAt: Date.now(),
	};

	await set(ref(db, `${CIERRES_PATH}/${cierreId}`), cierreBase);

	if (modo === "archivar") {
		const { get } = await import("firebase/database");
		const snap = await get(ref(db, FACTURAS_PATH));
		const facturas = snap.val() || {};

		const snapshotUpdates = {};
		Object.entries(facturas).forEach(([id, f]) => {
			snapshotUpdates[`${CIERRES_PATH}/${cierreId}/movimientos/${id}`] =
				f;
		});
		if (Object.keys(snapshotUpdates).length) {
			await update(ref(db), snapshotUpdates);
		}

		await remove(ref(db, FACTURAS_PATH));
	}

	await set(ref(db, CONTADOR_FACTURAS), 0);

	if (crearSaldoInicial && saldoFinal !== 0) {
		await crearFactura({
			fecha: new Date().toISOString().slice(0, 10),
			concepto: `Saldo inicial - ${nombre}`,
			comprobante: "Apertura de ejercicio",
			proveedor: "",
			ingresos: saldoFinal > 0 ? saldoFinal : 0,
			egresos: saldoFinal < 0 ? Math.abs(saldoFinal) : 0,
			categoria: "Inicio de actividades",
			notas: `Saldo arrastrado del cierre "${nombre}"`,
		});
	}

	return { cierreId, nombre };
}

/* ======================================================
   ELIMINAR TODO
   ====================================================== */
export async function eliminarTodo() {
	await remove(ref(db, FACTURAS_PATH));
	await set(ref(db, CONTADOR_FACTURAS), 0);
}
