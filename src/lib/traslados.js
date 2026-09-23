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
import { normalizarFecha, normalizarHora, mostrarFecha } from "./combustible";

export const TRASLADOS_PATH = "traslados";
export const CONTADOR_PATH = "contadores/traslados";

/* ============ AUTOINCREMENTAL ============ */
export async function reservarIds(cantidad = 1) {
	const counterRef = ref(db, CONTADOR_PATH);
	const result = await runTransaction(
		counterRef,
		(current) => (current || 0) + cantidad,
	);
	const fin = result.snapshot.val();
	const inicio = fin - cantidad + 1;
	return Array.from({ length: cantidad }, (_, i) => inicio + i);
}

/* ============ SUSCRIPCIÓN ============ */
export function suscribirTraslados(callback) {
	const r = ref(db, TRASLADOS_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) {
			callback([]);
			return;
		}
		const arr = Object.values(snap.val()).sort((a, b) => {
			const ka = `${a.fecha || ""} ${a.horaSalida || ""}`;
			const kb = `${b.fecha || ""} ${b.horaSalida || ""}`;
			return kb.localeCompare(ka);
		});
		callback(arr);
	});
}

/* ============ HELPERS ============ */
function limpiar(data) {
	return {
		fecha: normalizarFecha(data.fecha),
		horaSalida: normalizarHora(data.horaSalida),
		horaLlegada: normalizarHora(data.horaLlegada),
		kmInicial: Number(data.kmInicial) || 0,
		kmFinal: Number(data.kmFinal) || 0,
		inicio: (data.inicio || "").trim(),
		final: (data.final || "").trim(),
		combustibleLitros: Number(data.combustibleLitros) || 0,
		combustiblePrecio: Number(data.combustiblePrecio) || 0,
		choferId: data.choferId ?? null,
		choferNombre: (data.choferNombre || "").trim(),
		enfermeroId: data.enfermeroId ?? null,
		enfermero: (data.enfermero || "").trim(),
		paciente: (data.paciente || "").trim(),
		motivo: (data.motivo || "").trim(),
	};
}

export function kmRecorridos(t) {
	return Math.max(0, (Number(t.kmFinal) || 0) - (Number(t.kmInicial) || 0));
}

export function duracionMinutos(t) {
	if (!t.horaSalida || !t.horaLlegada) return null;
	const [hs, ms] = t.horaSalida.split(":").map(Number);
	const [hl, ml] = t.horaLlegada.split(":").map(Number);
	if ([hs, ms, hl, ml].some((n) => isNaN(n))) return null;
	let min = hl * 60 + ml - (hs * 60 + ms);
	if (min < 0) min += 24 * 60; // cruzó medianoche
	return min;
}

export function formatDuracion(min) {
	if (min == null) return "—";
	const h = Math.floor(min / 60);
	const m = min % 60;
	if (h === 0) return `${m} min`;
	if (m === 0) return `${h} h`;
	return `${h}h ${m}min`;
}

/* ============ CRUD ============ */
export async function crearTraslado(data) {
	const [id] = await reservarIds(1);
	const payload = {
		id,
		...limpiar(data),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${TRASLADOS_PATH}/${id}`), payload);
	return payload;
}

export async function actualizarTraslado(id, data) {
	await update(ref(db, `${TRASLADOS_PATH}/${id}`), {
		...limpiar(data),
		updatedAt: Date.now(),
	});
}

export async function eliminarTraslado(id) {
	await remove(ref(db, `${TRASLADOS_PATH}/${id}`));
}

/* ============ IMPORTAR ============ */
export async function importarTraslados(lista) {
	if (!lista.length) return [];
	const ids = await reservarIds(lista.length);
	const ahora = Date.now();
	const updates = {};
	lista.forEach((item, i) => {
		const id = ids[i];
		updates[`${TRASLADOS_PATH}/${id}`] = {
			id,
			...limpiar(item),
			createdAt: ahora,
			updatedAt: ahora,
		};
	});
	await update(ref(db), updates);
	return ids;
}

/* ============ EXPORTAR ============ */
export function exportarExcel(traslados) {
	const filas = traslados.map((t) => ({
		Fecha: mostrarFecha(t.fecha),
		"Hora Salida": t.horaSalida || "",
		"KM Inicial": Number(t.kmInicial) || 0,
		"KM Final": Number(t.kmFinal) || 0,
		"KM Recorridos": kmRecorridos(t),
		Inicio: t.inicio || "",
		Final: t.final || "",
		"Combustible (Lts)": Number(t.combustibleLitros) || 0,
		"Combustible ($)": Number(t.combustiblePrecio) || 0,
		Chofer: t.choferNombre || "",
		Enfermero: t.enfermero || "",
		Paciente: t.paciente || "",
		Motivo: t.motivo || "",
	}));

	const ws = XLSX.utils.json_to_sheet(filas);
	ws["!cols"] = [
		{ wch: 12 },
		{ wch: 10 },
		{ wch: 11 },
		{ wch: 11 },
		{ wch: 13 },
		{ wch: 20 },
		{ wch: 20 },
		{ wch: 16 },
		{ wch: 15 },
		{ wch: 22 },
		{ wch: 22 },
		{ wch: 22 },
		{ wch: 30 },
	];

	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Traslados");

	const hoy = new Date();
	const nombre = `traslados_${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}.xlsx`;
	XLSX.writeFile(wb, nombre);
}

export function descargarPlantilla() {
	const ejemplo = [
		{
			Fecha: "01/12/2025",
			"Hora Salida": "08:30",
			"KM Inicial": 120000,
			"KM Final": 120045,
			Inicio: "Base Central",
			Final: "Hospital Italiano",
			"Combustible (Lts/$)": "5.5 / $6500",
			Chofer: "Pérez, Juan",
			Enfermero: "López, Ana",
			Paciente: "Gómez, María",
			Motivo: "Traslado programado diálisis",
		},
	];
	const ws = XLSX.utils.json_to_sheet(ejemplo);
	ws["!cols"] = [
		{ wch: 12 },
		{ wch: 10 },
		{ wch: 11 },
		{ wch: 11 },
		{ wch: 20 },
		{ wch: 20 },
		{ wch: 18 },
		{ wch: 22 },
		{ wch: 22 },
		{ wch: 22 },
		{ wch: 30 },
	];
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, "Traslados");
	XLSX.writeFile(wb, "plantilla_traslados.xlsx");
}

/* ============ STATS ============ */
export function calcularStats(traslados) {
	// Caso vacío
	if (!traslados.length) {
		return {
			total: 0,
			kmTotal: 0,
			litrosTotal: 0,
			precioTotal: 0,
			promedioKm: 0,
			promedioLitros: 0,
			viajeMasLargoKm: null,
			viajeMasLargoHs: null,
			topChoferesViajes: [],
			topChoferesKm: [],
			topEnfermerosViajes: [],
			topEnfermerosKm: [],
		};
	}

	/* ---------- TOTALES ---------- */
	const kmTotal = traslados.reduce((s, t) => s + kmRecorridos(t), 0);
	const litrosTotal = traslados.reduce(
		(s, t) => s + (Number(t.combustibleLitros) || 0),
		0,
	);
	const precioTotal = traslados.reduce(
		(s, t) => s + (Number(t.combustiblePrecio) || 0),
		0,
	);

	/* ---------- VIAJE MÁS LARGO (KM) ---------- */
	const viajeMasLargoKm = traslados.reduce(
		(max, t) => (kmRecorridos(t) > kmRecorridos(max) ? t : max),
		traslados[0],
	);

	/* ---------- VIAJE MÁS LARGO (DURACIÓN) ---------- */
	const conDuracion = traslados
		.map((t) => ({ t, min: duracionMinutos(t) }))
		.filter((x) => x.min != null);
	const viajeMasLargoHs = conDuracion.length
		? conDuracion.reduce(
				(max, x) => (x.min > max.min ? x : max),
				conDuracion[0],
			)
		: null;

	/* ---------- RANKING CHOFERES ---------- */
	const porChofer = {};
	traslados.forEach((t) => {
		const key = t.choferNombre || t.choferId || "Sin asignar";
		if (!porChofer[key])
			porChofer[key] = { nombre: key, viajes: 0, km: 0, litros: 0 };
		porChofer[key].viajes += 1;
		porChofer[key].km += kmRecorridos(t);
		porChofer[key].litros += Number(t.combustibleLitros) || 0;
	});
	const ranking = Object.values(porChofer);

	const topChoferesViajes = [...ranking]
		.sort((a, b) => b.viajes - a.viajes)
		.slice(0, 5);
	const topChoferesKm = [...ranking].sort((a, b) => b.km - a.km).slice(0, 5);

	/* ---------- RANKING ENFERMEROS ---------- */
	const porEnfermero = {};
	traslados.forEach((t) => {
		if (!t.enfermero) return;
		const key = t.enfermero;
		if (!porEnfermero[key])
			porEnfermero[key] = { nombre: key, viajes: 0, km: 0 };
		porEnfermero[key].viajes += 1;
		porEnfermero[key].km += kmRecorridos(t);
	});
	const rankingEnf = Object.values(porEnfermero);

	const topEnfermerosViajes = [...rankingEnf]
		.sort((a, b) => b.viajes - a.viajes)
		.slice(0, 5);
	const topEnfermerosKm = [...rankingEnf]
		.sort((a, b) => b.km - a.km)
		.slice(0, 5);

	/* ---------- RETURN ---------- */
	return {
		total: traslados.length,
		kmTotal,
		litrosTotal,
		precioTotal,
		promedioKm: kmTotal / traslados.length,
		promedioLitros: litrosTotal / traslados.length,
		viajeMasLargoKm:
			kmRecorridos(viajeMasLargoKm) > 0 ? viajeMasLargoKm : null,
		viajeMasLargoHs: viajeMasLargoHs
			? { ...viajeMasLargoHs.t, _min: viajeMasLargoHs.min }
			: null,
		topChoferesViajes,
		topChoferesKm,
		topEnfermerosViajes,
		topEnfermerosKm,
	};
}

/* ============ VACÍO ============ */
export const TRASLADO_VACIO = {
	fecha: new Date().toISOString().slice(0, 10),
	horaSalida: "",
	horaLlegada: "",
	kmInicial: "",
	kmFinal: "",
	inicio: "",
	final: "",
	combustibleLitros: "",
	combustiblePrecio: "",
	choferId: null,
	choferNombre: "",
	enfermeroId: null,
	enfermero: "",
	paciente: "",
	motivo: "",
};
