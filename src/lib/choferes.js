import {
	ref,
	set,
	update,
	remove,
	runTransaction,
	onValue,
} from "firebase/database";
import { db } from "./firebase";
import { normalizarFecha } from "./combustible";

export const CHOFERES_PATH = "choferes"; // ⚠ Se mantiene el path para no romper datos
export const CONTADOR_PATH = "contadores/choferes";

/* ======================================================
   ROLES
   ====================================================== */
export const ROLES = {
	chofer: {
		label: "Chofer",
		color: "bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400",
		icon: "🚑",
	},
	enfermero: {
		label: "Enfermero/a",
		color: "bg-violet-50 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400",
		icon: "💉",
	},
	ambos: {
		label: "Chofer + Enfermero",
		color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
		icon: "🚑💉",
	},
};

// ¿Puede conducir?
export function esChofer(p) {
	return !p || !p.rol || p.rol === "chofer" || p.rol === "ambos";
}

// ¿Puede asistir como enfermero?
export function esEnfermero(p) {
	return p?.rol === "enfermero" || p?.rol === "ambos";
}

/* ======================================================
   AUTOINCREMENTAL
   ====================================================== */
export async function reservarIdChofer() {
	const counterRef = ref(db, CONTADOR_PATH);
	const result = await runTransaction(
		counterRef,
		(current) => (current || 0) + 1,
	);
	return result.snapshot.val();
}

/* ======================================================
   SUSCRIPCIONES
   ====================================================== */
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

// Solo los activos que pueden conducir (para usar en traslados y combustible)
export function suscribirConductoresActivos(callback) {
	return suscribirChoferes((arr) =>
		callback(arr.filter((c) => c.activo !== false && esChofer(c))),
	);
}

// Solo los activos que pueden asistir como enfermeros
export function suscribirEnfermerosActivos(callback) {
	return suscribirChoferes((arr) =>
		callback(arr.filter((c) => c.activo !== false && esEnfermero(c))),
	);
}

/* ======================================================
   CRUD
   ====================================================== */
function limpiar(data) {
	const rol = ["chofer", "enfermero", "ambos"].includes(data.rol)
		? data.rol
		: "chofer";
	return {
		nombre: (data.nombre || "").trim(),
		apellido: (data.apellido || "").trim(),
		dni: (data.dni || "").trim(),
		telefono: (data.telefono || "").trim(),
		email: (data.email || "").trim(),
		rol,
		// Chofer
		licencia: (data.licencia || "").trim(),
		licenciaVencimiento: normalizarFecha(data.licenciaVencimiento),
		// Enfermero
		matricula: (data.matricula || "").trim(),
		matriculaVencimiento: normalizarFecha(data.matriculaVencimiento),
		// Común
		direccion: (data.direccion || "").trim(),
		fechaNacimiento: normalizarFecha(data.fechaNacimiento),
		notas: (data.notas || "").trim(),
		activo: data.activo !== false,
	};
}

export async function crearChofer(data) {
	const id = await reservarIdChofer();
	const payload = {
		id,
		...limpiar(data),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${CHOFERES_PATH}/${id}`), payload);
	return payload;
}

export async function actualizarChofer(id, data) {
	await update(ref(db, `${CHOFERES_PATH}/${id}`), {
		...limpiar(data),
		updatedAt: Date.now(),
	});
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

/* ======================================================
   HELPERS
   ====================================================== */
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
	rol: "chofer",
	licencia: "",
	licenciaVencimiento: "",
	matricula: "",
	matriculaVencimiento: "",
	direccion: "",
	fechaNacimiento: "",
	notas: "",
	activo: true,
};
