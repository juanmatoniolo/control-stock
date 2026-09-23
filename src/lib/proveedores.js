//// src\lib\proveedores.js
import {
	ref,
	get,
	set,
	update,
	remove,
	runTransaction,
	onValue,
} from "firebase/database";
import { db } from "./firebase";

export const PROVEEDORES_PATH = "proveedores";
export const CONTADOR_PATH = "contadores/proveedores";

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
   LEER
   ====================================================== */
export function suscribirProveedores(callback) {
	const r = ref(db, PROVEEDORES_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) {
			callback([]);
			return;
		}
		const arr = Object.values(snap.val()).sort((a, b) => a.id - b.id);
		callback(arr);
	});
}

export async function leerProveedores() {
	const snap = await get(ref(db, PROVEEDORES_PATH));
	if (!snap.exists()) return [];
	return Object.values(snap.val()).sort((a, b) => a.id - b.id);
}

/* ======================================================
   CREAR
   ====================================================== */
export async function crearProveedor(data) {
	const [id] = await reservarIds(1);
	const payload = {
		id,
		proveedor: (data.proveedor || "").trim(),
		cuit: (data.cuit || "").trim(),
		situacion: (data.situacion || "").trim(),
		banco: (data.banco || "").trim(),
		cbu: (data.cbu || "").trim(),
		alias: (data.alias || "").trim(),
		email: (data.email || "").trim(),
		telefono: (data.telefono || "").trim(),
		direccion: (data.direccion || "").trim(),
		rubro: (data.rubro || "").trim(),
		aliasRcel: (data.aliasRcel || "").trim(),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${PROVEEDORES_PATH}/${id}`), payload);
	return payload;
}

/* ======================================================
   ACTUALIZAR
   ====================================================== */
export async function actualizarProveedor(id, data) {
	const payload = {
		proveedor: (data.proveedor || "").trim(),
		cuit: (data.cuit || "").trim(),
		situacion: (data.situacion || "").trim(),
		banco: (data.banco || "").trim(),
		cbu: (data.cbu || "").trim(),
		alias: (data.alias || "").trim(),
		email: (data.email || "").trim(),
		telefono: (data.telefono || "").trim(),
		direccion: (data.direccion || "").trim(),
		rubro: (data.rubro || "").trim(),
		aliasRcel: (data.aliasRcel || "").trim(),
		updatedAt: Date.now(),
	};
	await update(ref(db, `${PROVEEDORES_PATH}/${id}`), payload);
}

/* ======================================================
   ELIMINAR
   ====================================================== */
export async function eliminarProveedor(id) {
	await remove(ref(db, `${PROVEEDORES_PATH}/${id}`));
}

/* ======================================================
   IMPORTAR EN LOTE
   ====================================================== */
export async function importarProveedores(lista) {
	if (!lista.length) return [];

	const ids = await reservarIds(lista.length);
	const ahora = Date.now();
	const updates = {};

	lista.forEach((item, i) => {
		const id = ids[i];
		updates[`${PROVEEDORES_PATH}/${id}`] = {
			id,
			proveedor: (item.proveedor || "").trim(),
			cuit: (item.cuit || "").trim(),
			situacion: (item.situacion || "").trim(),
			banco: (item.banco || "").trim(),
			cbu: (item.cbu || "").trim(),
			alias: (item.alias || "").trim(),
			email: (item.email || "").trim(),
			telefono: (item.telefono || "").trim(),
			direccion: (item.direccion || "").trim(),
			rubro: (item.rubro || "").trim(),
			aliasRcel: (item.aliasRcel || "").trim(),
			createdAt: ahora,
			updatedAt: ahora,
		};
	});

	await update(ref(db), updates);
	return ids;
}

/* ======================================================
   HELPERS
   ====================================================== */
export const PROVEEDOR_VACIO = {
	proveedor: "",
	cuit: "",
	situacion: "",
	banco: "",
	cbu: "",
	alias: "",
	email: "",
	telefono: "",
	direccion: "",
	rubro: "",
	aliasRcel: "",
};
