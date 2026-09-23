import {
	ref,
	get,
	set,
	update,
	remove,
	runTransaction,
	onValue,
} from "firebase/database";
import * as XLSX from "xlsx";
import { db } from "./firebase";

export const COMBUSTIBLE_PATH = "combustible";
export const CONTADOR_PATH = "contadores/combustible";

/* ======================================================
   AUTOINCREMENTAL
   ====================================================== */
export async function reservarIds(cantidad = 1) {
	const counterRef = ref(db, CONTADOR_PATH);
	const result = await runTransaction(counterRef, (current) => {
		return (current || 0) + cantidad;
	});
	const nuevoFin = result.snapshot.val();
	const inicio = nuevoFin - cantidad + 1;
	return Array.from({ length: cantidad }, (_, i) => inicio + i);
}

/* ======================================================
   HELPERS
   ====================================================== */
// Convierte fecha a "YYYY-MM-DD"
export function normalizarFecha(valor) {
	if (!valor) return "";
	// Date object
	if (valor instanceof Date && !isNaN(valor)) {
		const y = valor.getFullYear();
		const m = String(valor.getMonth() + 1).padStart(2, "0");
		const d = String(valor.getDate()).padStart(2, "0");
		return `${y}-${m}-${d}`;
	}
	// Número (serial de Excel)
	if (typeof valor === "number") {
		const d = new Date((valor - 25569) * 86400 * 1000);
		return normalizarFecha(d);
	}
	// String
	const s = String(valor).trim();
	if (!s) return "";
	// YYYY-MM-DD ya formateado
	if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
	// DD/MM/YYYY o DD-MM-YYYY
	const m1 = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
	if (m1) {
		let [, d, m, y] = m1;
		if (y.length === 2) y = "20" + y;
		return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
	}
	// Fallback: parse nativo
	const parsed = new Date(s);
	if (!isNaN(parsed)) return normalizarFecha(parsed);
	return s;
}

// Convierte hora a "HH:MM"
export function normalizarHora(valor) {
	if (!valor) return "";
	if (valor instanceof Date && !isNaN(valor)) {
		return `${String(valor.getHours()).padStart(2, "0")}:${String(
			valor.getMinutes(),
		).padStart(2, "0")}`;
	}
	if (typeof valor === "number") {
		// Excel serial: fracción del día
		const totalMin = Math.round((valor % 1) * 24 * 60);
		const h = Math.floor(totalMin / 60);
		const m = totalMin % 60;
		return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
	}
	const s = String(valor).trim();
	if (!s) return "";
	const m = s.match(/^(\d{1,2}):(\d{2})/);
	if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
	return s;
}

// Formatea fecha para mostrar (DD/MM/YYYY)
export function mostrarFecha(iso) {
	if (!iso) return "";
	const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})$/);
	if (!m) return iso;
	return `${m[3]}/${m[2]}/${m[1]}`;
}

/* ======================================================
   LEER
   ====================================================== */
export function suscribirCombustible(callback) {
	const r = ref(db, COMBUSTIBLE_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) {
			callback([]);
			return;
		}
		const arr = Object.values(snap.val()).sort((a, b) => {
			// Ordenar por fecha + hora descendente
			const ka = `${a.fecha || ""} ${a.hora || ""}`;
			const kb = `${b.fecha || ""} ${b.hora || ""}`;
			return kb.localeCompare(ka);
		});
		callback(arr);
	});
}

/* ======================================================
   CREAR
   ====================================================== */
export async function crearCarga(data) {
	const [id] = await reservarIds(1);
	const payload = {
		id,
		fecha: normalizarFecha(data.fecha),
		hora: normalizarHora(data.hora),
		numeroRemito: (data.numeroRemito || "").trim(),
		litros: Number(data.litros) || 0,
		chofer: (data.chofer || "").trim(),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${COMBUSTIBLE_PATH}/${id}`), payload);
	return payload;
}

/* ======================================================
   ACTUALIZAR
   ====================================================== */
export async function actualizarCarga(id, data) {
	const payload = {
		fecha: normalizarFecha(data.fecha),
		hora: normalizarHora(data.hora),
		numeroRemito: (data.numeroRemito || "").trim(),
		litros: Number(data.litros) || 0,
		chofer: (data.chofer || "").trim(),
		updatedAt: Date.now(),
	};
	await update(ref(db, `${COMBUSTIBLE_PATH}/${id}`), payload);
}

/* ======================================================
   ELIMINAR
   ====================================================== */
export async function eliminarCarga(id) {
	await remove(ref(db, `${COMBUSTIBLE_PATH}/${id}`));
}

/* ======================================================
   IMPORTAR EN LOTE
   ====================================================== */
export async function importarCargas(lista) {
	if (!lista.length) return [];
	const ids = await reservarIds(lista.length);
	const ahora = Date.now();
	const updates = {};

	lista.forEach((item, i) => {
		const id = ids[i];
		updates[`${COMBUSTIBLE_PATH}/${id}`] = {
			id,
			fecha: normalizarFecha(item.fecha),
			hora: normalizarHora(item.hora),
			numeroRemito: (item.numeroRemito || "").trim(),
			litros: Number(item.litros) || 0,
			chofer: (item.chofer || "").trim(),
			createdAt: ahora,
			updatedAt: ahora,
		};
	});

	await update(ref(db), updates);
	return ids;
}

/* ======================================================
   EXPORTAR A EXCEL
   ====================================================== */
export function exportarExcel(cargas) {
	const filas = cargas.map((c) => ({
		"Fecha de Carga": mostrarFecha(c.fecha),
		Hora: c.hora || "",
		"Número de Remito": c.numeroRemito || "",
		"Litros Cargados": Number(c.litros) || 0,
		Chofer: c.chofer || "",
	}));

	const ws = XLSX.utils.json_to_sheet(filas, {
		header: [
			"Fecha de Carga",
			"Hora",
			"Número de Remito",
			"Litros Cargados",
			"Chofer",
		],
	});

	// Anchos de columna
	ws["!cols"] = [
		{ wch: 16 }, // Fecha
		{ wch: 8 }, // Hora
		{ wch: 20 }, // N° Remito
		{ wch: 16 }, // Litros
		{ wch: 24 }, // Chofer
	];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Combustible");

	const hoy = new Date();
	const nombre = `combustible_${hoy.getFullYear()}-${String(
		hoy.getMonth() + 1,
	).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}.xlsx`;

	XLSX.writeFile(wb, nombre);
}

/* ======================================================
   HELPERS DE PLANTILLA
   ====================================================== */
export const CARGA_VACIA = {
	fecha: new Date().toISOString().slice(0, 10),
	hora: "",
	numeroRemito: "",
	litros: "",
	chofer: "",
};

export function descargarPlantilla() {
	const ejemplo = [
		{
			"Fecha de Carga": "01/12/2025",
			Hora: "09:30",
			"Número de Remito": "R-0001-00012345",
			"Litros Cargados": 50,
			Chofer: "Juan Pérez",
		},
		{
			"Fecha de Carga": "02/12/2025",
			Hora: "14:15",
			"Número de Remito": "R-0001-00012346",
			"Litros Cargados": 45.5,
			Chofer: "Carlos Gómez",
		},
	];

	const ws = XLSX.utils.json_to_sheet(ejemplo, {
		header: [
			"Fecha de Carga",
			"Hora",
			"Número de Remito",
			"Litros Cargados",
			"Chofer",
		],
	});
	ws["!cols"] = [
		{ wch: 16 },
		{ wch: 8 },
		{ wch: 20 },
		{ wch: 16 },
		{ wch: 24 },
	];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Combustible");
	XLSX.writeFile(wb, "plantilla_combustible.xlsx");
}
