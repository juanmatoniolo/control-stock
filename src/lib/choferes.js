import {
	ref,
	set,
	update,
	remove,
	runTransaction,
	onValue,
} from "firebase/database";
import { db } from "./firebase";

export const CHOFERES_PATH = "choferes";
export const CONTADOR_PATH = "contadores/choferes";

/* ============ AUTOINCREMENTAL ============ */
export async function reservarIdChofer() {
	const counterRef = ref(db, CONTADOR_PATH);
	const result = await runTransaction(
		counterRef,
		(current) => (current || 0) + 1,
	);
	return result.snapshot.val();
}

/* ============ SUSCRIPCIONES ============ */
export function suscribirChoferes(callback) {
	const r = ref(db, CHOFERES_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) {
			callback([]);
			return;
		}
		const arr = Object.values(snap.val()).sort((a, b) => {
			const ka = `${a.apellido || ""} ${a.nombre || ""}`.toLowerCase();
			const kb = `${b.apellido || ""} ${b.nombre || ""}`.toLowerCase();
			return ka.localeCompare(kb);
		});
		callback(arr);
	});
}

export function suscribirChoferesActivos(callback) {
	return suscribirChoferes((arr) =>
		callback(arr.filter((c) => c.activo !== false)),
	);
}

/* ============ CRUD ============ */
export async function crearChofer(data) {
	const id = await reservarIdChofer();
	const payload = {
		id,
		nombre: (data.nombre || "").trim(),
		apellido: (data.apellido || "").trim(),
		dni: (data.dni || "").trim(),
		telefono: (data.telefono || "").trim(),
		email: (data.email || "").trim(),
		licencia: (data.licencia || "").trim(),
		licenciaVencimiento: (data.licenciaVencimiento || "").trim(),
		direccion: (data.direccion || "").trim(),
		fechaNacimiento: (data.fechaNacimiento || "").trim(),
		notas: (data.notas || "").trim(),
		activo: data.activo !== false,
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${CHOFERES_PATH}/${id}`), payload);
	return payload;
}

export async function actualizarChofer(id, data) {
	const payload = {
		nombre: (data.nombre || "").trim(),
		apellido: (data.apellido || "").trim(),
		dni: (data.dni || "").trim(),
		telefono: (data.telefono || "").trim(),
		email: (data.email || "").trim(),
		licencia: (data.licencia || "").trim(),
		licenciaVencimiento: (data.licenciaVencimiento || "").trim(),
		direccion: (data.direccion || "").trim(),
		fechaNacimiento: (data.fechaNacimiento || "").trim(),
		notas: (data.notas || "").trim(),
		activo: data.activo !== false,
		updatedAt: Date.now(),
	};
	await update(ref(db, `${CHOFERES_PATH}/${id}`), payload);
}

export async function toggleActivoChofer(id, activo) {
	await update(ref(db, `${CHOFERES_PATH}/${id}`), {
		activo,
		updatedAt: Date.now(),
	});
}

export async function eliminarChofer(id) {
	await remove(ref(db, `${CHOFERES_PATH}/${id}`));
}

/* ============ HELPERS ============ */
export function nombreCompleto(c) {
	if (!c) return "";
	const ape = c.apellido?.trim() || "";
	const nom = c.nombre?.trim() || "";
	return ape && nom ? `${ape}, ${nom}` : ape || nom || "";
}

export const CHOFER_VACIO = {
	nombre: "",
	apellido: "",
	dni: "",
	telefono: "",
	email: "",
	licencia: "",
	licenciaVencimiento: "",
	direccion: "",
	fechaNacimiento: "",
	notas: "",
	activo: true,
};
