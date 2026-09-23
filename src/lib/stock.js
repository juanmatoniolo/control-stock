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
import { normalizarFecha, mostrarFecha } from "./combustible";

/* ======================================================
   PATHS
   ====================================================== */
export const PRODUCTOS_PATH = "productos";
export const MOVIMIENTOS_PATH = "movimientos_stock";
export const CONTADOR_MOVS = "contadores/movimientos_stock";

/* ======================================================
   AUTOINCREMENTAL
   ====================================================== */
export async function reservarIdsMov(cantidad = 1) {
	const counterRef = ref(db, CONTADOR_MOVS);
	const result = await runTransaction(
		counterRef,
		(current) => (current || 0) + cantidad,
	);
	const fin = result.snapshot.val();
	const inicio = fin - cantidad + 1;
	return Array.from({ length: cantidad }, (_, i) => inicio + i);
}

/* ======================================================
   SUSCRIPCIONES
   ====================================================== */
export function suscribirProductos(callback) {
	const r = ref(db, PRODUCTOS_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) return callback([]);
		const arr = Object.values(snap.val()).sort((a, b) =>
			String(a.codigo || "").localeCompare(String(b.codigo || "")),
		);
		callback(arr);
	});
}

export function suscribirMovimientos(callback) {
	const r = ref(db, MOVIMIENTOS_PATH);
	return onValue(r, (snap) => {
		if (!snap.exists()) return callback([]);
		const arr = Object.values(snap.val()).sort((a, b) => {
			const ka = `${a.fecha || ""} ${a.id}`;
			const kb = `${b.fecha || ""} ${b.id}`;
			return kb.localeCompare(ka);
		});
		callback(arr);
	});
}

/* ======================================================
   HELPERS DE ITEMS
   ====================================================== */
// Devuelve items normalizados de un movimiento (compatibilidad con datos viejos)
export function itemsDe(mov) {
	if (!mov) return [];
	if (Array.isArray(mov.items) && mov.items.length) {
		return mov.items.map((it, i) => ({
			codigo: String(it.codigo || "").trim(),
			producto: String(it.producto || "").trim(),
			marca: String(it.marca || "").trim(),
			cantidad: Number(it.cantidad) || 0,
			numeroLote: String(it.numeroLote || "").trim(),
			vencimiento: normalizarFecha(it.vencimiento),
			precioUnitario: Number(it.precioUnitario) || 0,
			precioTotal: Number(it.precioTotal) || 0,
			_idx: i,
		}));
	}
	// Compatibilidad: movimiento de 1 solo item (formato viejo)
	if (mov.codigo) {
		return [
			{
				codigo: mov.codigo,
				producto: mov.producto || "",
				marca: mov.marca || "",
				cantidad: Number(mov.cantidad) || 0,
				numeroLote: mov.numeroLote || "",
				vencimiento: mov.vencimiento || "",
				precioUnitario: Number(mov.precioUnitario) || 0,
				precioTotal: Number(mov.precioTotal) || 0,
				_idx: 0,
			},
		];
	}
	return [];
}

function limpiarItem(it) {
	const cantidad = Number(it.cantidad) || 0;
	const precioUnitario = Number(it.precioUnitario) || 0;
	return {
		codigo: String(it.codigo || "").trim(),
		producto: String(it.producto || "").trim(),
		marca: String(it.marca || "").trim(),
		cantidad,
		numeroLote: String(it.numeroLote || "").trim(),
		vencimiento: normalizarFecha(it.vencimiento),
		precioUnitario,
		precioTotal: Number(it.precioTotal) || cantidad * precioUnitario,
	};
}

/* ======================================================
   PRODUCTOS
   ====================================================== */
function limpiarProducto(data) {
	return {
		codigo: String(data.codigo || "").trim(),
		producto: String(data.producto || "").trim(),
		stockInicial: Number(data.stockInicial) || 0,
		stockMinimo: Number(data.stockMinimo) || 0,
		activo: data.activo !== false,
	};
}

export async function crearProducto(data) {
	const payload = limpiarProducto(data);
	if (!payload.codigo) throw new Error("Código requerido");

	const existente = await new Promise((res) => {
		const unsub = suscribirProductos((arr) => {
			unsub();
			res(arr.find((p) => p.codigo === payload.codigo));
		});
	});
	if (existente) throw new Error("Ya existe un producto con ese código");

	const final = { ...payload, createdAt: Date.now(), updatedAt: Date.now() };
	await set(ref(db, `${PRODUCTOS_PATH}/${payload.codigo}`), final);
	return final;
}

export async function actualizarProducto(codigo, data) {
	await update(ref(db, `${PRODUCTOS_PATH}/${codigo}`), {
		...limpiarProducto({ ...data, codigo }),
		updatedAt: Date.now(),
	});
}

export async function eliminarProducto(codigo) {
	await remove(ref(db, `${PRODUCTOS_PATH}/${codigo}`));
}

export const PRODUCTO_VACIO = {
	codigo: "",
	producto: "",
	stockInicial: "",
	stockMinimo: 5,
	activo: true,
};

/* ======================================================
   MOVIMIENTOS
   ====================================================== */
function limpiarMovimiento(data) {
	const tipo = data.tipo === "salida" ? "salida" : "entrada";
	const base = {
		tipo,
		fecha: normalizarFecha(data.fecha),
	};

	if (tipo === "entrada") {
		// Una entrada = un producto (una factura por producto)
		return {
			...base,
			codigo: String(data.codigo || "").trim(),
			producto: String(data.producto || "").trim(),
			cantidad: Number(data.cantidad) || 0,
			marca: String(data.marca || "").trim(),
			numeroLote: String(data.numeroLote || "").trim(),
			vencimiento: normalizarFecha(data.vencimiento),
			precioUnitario: Number(data.precioUnitario) || 0,
			precioTotal: Number(data.precioTotal) || 0,
			numeroFactura: String(data.numeroFactura || "").trim(),
		};
	}

	// Salida: puede tener múltiples items
	const itemsRaw = Array.isArray(data.items) ? data.items : [];
	const items = itemsRaw
		.map(limpiarItem)
		.filter((it) => it.codigo && it.cantidad > 0);

	const cantidadTotal = items.reduce((s, it) => s + it.cantidad, 0);
	const precioTotalGlobal = items.reduce((s, it) => s + it.precioTotal, 0);

	return {
		...base,
		movimiento: String(data.movimiento || data.destino || "").trim(),
		observaciones: String(data.observaciones || "").trim(),
		usuario: String(data.usuario || "").trim(),
		usuarioNombre: String(data.usuarioNombre || "").trim(),
		items,
		cantidadTotal,
		precioTotalGlobal,
		// Compatibilidad: si hay 1 solo item, espejamos los campos
		...(items.length === 1
			? {
					codigo: items[0].codigo,
					producto: items[0].producto,
					cantidad: items[0].cantidad,
					marca: items[0].marca,
					numeroLote: items[0].numeroLote,
					vencimiento: items[0].vencimiento,
					precioUnitario: items[0].precioUnitario,
					precioTotal: items[0].precioTotal,
				}
			: {}),
	};
}

export async function crearMovimiento(data) {
	const [id] = await reservarIdsMov(1);
	const payload = {
		id,
		...limpiarMovimiento(data),
		createdAt: Date.now(),
		updatedAt: Date.now(),
	};
	await set(ref(db, `${MOVIMIENTOS_PATH}/${id}`), payload);
	return payload;
}

export async function actualizarMovimiento(id, data) {
	await update(ref(db, `${MOVIMIENTOS_PATH}/${id}`), {
		...limpiarMovimiento(data),
		updatedAt: Date.now(),
	});
}

export async function eliminarMovimiento(id) {
	await remove(ref(db, `${MOVIMIENTOS_PATH}/${id}`));
}

export const MOVIMIENTO_VACIO = {
	tipo: "entrada",
	fecha: new Date().toISOString().slice(0, 10),
	// Entrada
	codigo: "",
	producto: "",
	cantidad: "",
	marca: "",
	numeroLote: "",
	vencimiento: "",
	precioUnitario: "",
	precioTotal: "",
	numeroFactura: "",
	// Salida
	movimiento: "",
	observaciones: "",
	usuario: "",
	usuarioNombre: "",
	items: [],
};

/* ======================================================
   CÁLCULO DE STOCK
   ====================================================== */
export function calcularStock(productos, movimientos) {
	const mapa = {};

	productos.forEach((p) => {
		mapa[p.codigo] = {
			codigo: p.codigo,
			producto: p.producto,
			stockInicial: Number(p.stockInicial) || 0,
			stockMinimo: Number(p.stockMinimo) || 0,
			activo: p.activo !== false,
			entradas: 0,
			salidas: 0,
			stockActual: Number(p.stockInicial) || 0,
			// Datos del último lote ingresado (para autocompletar salidas)
			ultimoPrecioUnitario: 0,
			ultimaMarca: "",
			ultimoLote: "",
			ultimoVencimiento: "",
			// Fechas
			ultimaEntradaFecha: "",
			ultimaSalidaFecha: "",
			proximoVencimiento: "",
			huerfano: false,
		};
	});

	// Recorrer todos los movimientos
	movimientos.forEach((m) => {
		const items = itemsDe(m);

		items.forEach((it) => {
			const cod = it.codigo;
			if (!cod) return;

			if (!mapa[cod]) {
				mapa[cod] = {
					codigo: cod,
					producto: it.producto || "(sin nombre)",
					stockInicial: 0,
					stockMinimo: 0,
					activo: true,
					entradas: 0,
					salidas: 0,
					stockActual: 0,
					ultimoPrecioUnitario: 0,
					ultimaMarca: "",
					ultimoLote: "",
					ultimoVencimiento: "",
					ultimaEntradaFecha: "",
					ultimaSalidaFecha: "",
					proximoVencimiento: "",
					huerfano: true,
				};
			}

			const item = mapa[cod];
			const cantidad = Number(it.cantidad) || 0;

			if (m.tipo === "entrada") {
				item.entradas += cantidad;
				// Actualizar datos del lote más reciente
				if (it.precioUnitario)
					item.ultimoPrecioUnitario = Number(it.precioUnitario) || 0;
				if (it.marca) item.ultimaMarca = it.marca;
				if (it.numeroLote) item.ultimoLote = it.numeroLote;
				if (it.vencimiento) item.ultimoVencimiento = it.vencimiento;

				if (
					!item.ultimaEntradaFecha ||
					m.fecha > item.ultimaEntradaFecha
				) {
					item.ultimaEntradaFecha = m.fecha;
				}
				if (it.vencimiento) {
					const hoy = new Date().toISOString().slice(0, 10);
					if (it.vencimiento >= hoy) {
						if (
							!item.proximoVencimiento ||
							it.vencimiento < item.proximoVencimiento
						) {
							item.proximoVencimiento = it.vencimiento;
						}
					}
				}
			} else if (m.tipo === "salida") {
				item.salidas += cantidad;
				if (
					!item.ultimaSalidaFecha ||
					m.fecha > item.ultimaSalidaFecha
				) {
					item.ultimaSalidaFecha = m.fecha;
				}
			}
		});
	});

	// Calcular estado
	Object.values(mapa).forEach((item) => {
		item.stockActual = item.stockInicial + item.entradas - item.salidas;

		if (item.stockActual <= 0) {
			item.estado = "sin-stock";
			item.estadoLabel = "Sin stock";
		} else if (item.stockActual <= (item.stockMinimo || 0)) {
			item.estado = "bajo";
			item.estadoLabel = "Stock bajo";
		} else {
			item.estado = "normal";
			item.estadoLabel = "Normal";
		}
	});

	return Object.values(mapa).sort((a, b) =>
		String(a.codigo).localeCompare(String(b.codigo)),
	);
}

/* ======================================================
   EXPORTAR EXCEL
   ====================================================== */
export function exportarExcel(productos, movimientos, stock) {
	const wb = XLSX.utils.book_new();

	// HOJA 1: PRODUCTOS
	const hojaProductos = stock.map((s) => ({
		CODIGO: s.codigo,
		PRODUCTO: s.producto,
		"STOCK INICIAL": s.stockInicial,
		"TOTAL ENTRADAS": s.entradas,
		"TOTAL SALIDAS": s.salidas,
		"STOCK ACTUAL": s.stockActual,
		"STOCK MINIMO": s.stockMinimo,
		ESTADO: s.estadoLabel,
		ACTIVO: s.activo !== false ? "SI" : "NO",
	}));
	const wsProd = XLSX.utils.json_to_sheet(hojaProductos, {
		header: [
			"CODIGO",
			"PRODUCTO",
			"STOCK INICIAL",
			"TOTAL ENTRADAS",
			"TOTAL SALIDAS",
			"STOCK ACTUAL",
			"STOCK MINIMO",
			"ESTADO",
			"ACTIVO",
		],
	});
	wsProd["!cols"] = [
		{ wch: 14 },
		{ wch: 38 },
		{ wch: 14 },
		{ wch: 14 },
		{ wch: 14 },
		{ wch: 14 },
		{ wch: 14 },
		{ wch: 12 },
		{ wch: 8 },
	];
	XLSX.utils.book_append_sheet(wb, wsProd, "PRODUCTOS");

	// HOJA 2: ENTRADAS
	const hojaEntradas = [];
	movimientos
		.filter((m) => m.tipo === "entrada")
		.forEach((m) => {
			itemsDe(m).forEach((it) => {
				hojaEntradas.push({
					FECHA: mostrarFecha(m.fecha),
					"Nº DE FACTURA": m.numeroFactura || "",
					CANTIDAD: it.cantidad,
					CODIGO: it.codigo,
					PRODUCTO: it.producto,
					MARCA: it.marca || "",
					"Nº DE LOTE": it.numeroLote || "",
					VTO: mostrarFecha(it.vencimiento),
					"PRECIO UNITARIO": it.precioUnitario || 0,
					"PRECIO TOTAL": it.precioTotal || 0,
				});
			});
		});

	const wsEnt = XLSX.utils.json_to_sheet(hojaEntradas, {
		header: [
			"FECHA",
			"Nº DE FACTURA",
			"CANTIDAD",
			"CODIGO",
			"PRODUCTO",
			"MARCA",
			"Nº DE LOTE",
			"VTO",
			"PRECIO UNITARIO",
			"PRECIO TOTAL",
		],
	});
	wsEnt["!cols"] = [
		{ wch: 12 },
		{ wch: 20 },
		{ wch: 10 },
		{ wch: 14 },
		{ wch: 30 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 12 },
		{ wch: 16 },
		{ wch: 16 },
	];
	XLSX.utils.book_append_sheet(wb, wsEnt, "ENTRADAS");

	// HOJA 3: SALIDAS
	const hojaSalidas = [];
	movimientos
		.filter((m) => m.tipo === "salida")
		.forEach((m) => {
			itemsDe(m).forEach((it) => {
				hojaSalidas.push({
					FECHA: mostrarFecha(m.fecha),
					MOVIMIENTO: m.movimiento || "",
					CANTIDAD: it.cantidad,
					CODIGO: it.codigo,
					PRODUCTO: it.producto,
					MARCA: it.marca || "",
					"Nº DE LOTE": it.numeroLote || "",
					VTO: mostrarFecha(it.vencimiento),
					"PRECIO UNITARIO": it.precioUnitario || 0,
					"PRECIO TOTAL": it.precioTotal || 0,
					OBSERVACIONES: m.observaciones || "",
					USUARIO: m.usuarioNombre || m.usuario || "",
				});
			});
		});

	const wsSal = XLSX.utils.json_to_sheet(hojaSalidas, {
		header: [
			"FECHA",
			"MOVIMIENTO",
			"CANTIDAD",
			"CODIGO",
			"PRODUCTO",
			"MARCA",
			"Nº DE LOTE",
			"VTO",
			"PRECIO UNITARIO",
			"PRECIO TOTAL",
			"OBSERVACIONES",
			"USUARIO",
		],
	});
	wsSal["!cols"] = [
		{ wch: 12 },
		{ wch: 26 },
		{ wch: 10 },
		{ wch: 14 },
		{ wch: 30 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 12 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 30 },
		{ wch: 20 },
	];
	XLSX.utils.book_append_sheet(wb, wsSal, "SALIDAS");

	const hoy = new Date();
	const nombre = `stock_${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}.xlsx`;
	XLSX.writeFile(wb, nombre);
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

const MAPA_PRODUCTOS = {
	codigo: "codigo",
	producto: "producto",
	stockinicial: "stockInicial",
	stocktotal: "stockInicial",
	stockactual: "stockActualRaw",
	totalentradas: "entradasRaw",
	totalsalidas: "salidasRaw",
	stockminimo: "stockMinimo",
	minimo: "stockMinimo",
	activo: "activoRaw",
};

const MAPA_ENTRADAS = {
	fecha: "fecha",
	numerofactura: "numeroFactura",
	nfactura: "numeroFactura",
	factura: "numeroFactura",
	cantidad: "cantidad",
	codigo: "codigo",
	producto: "producto",
	marca: "marca",
	numerolote: "numeroLote",
	nlote: "numeroLote",
	lote: "numeroLote",
	vto: "vencimiento",
	vencimiento: "vencimiento",
	preciounitario: "precioUnitario",
	preciototal: "precioTotal",
};

const MAPA_SALIDAS = {
	fecha: "fecha",
	movimiento: "movimiento",
	destino: "movimiento",
	cantidad: "cantidad",
	codigo: "codigo",
	producto: "producto",
	marca: "marca",
	numerolote: "numeroLote",
	nlote: "numeroLote",
	lote: "numeroLote",
	vto: "vencimiento",
	vencimiento: "vencimiento",
	preciounitario: "precioUnitario",
	preciototal: "precioTotal",
	observaciones: "observaciones",
	usuario: "usuario",
};

function leerHoja(sheet, mapa) {
	const rows = XLSX.utils.sheet_to_json(sheet, {
		header: 1,
		defval: "",
		raw: false,
		dateNF: "dd/mm/yyyy",
	});
	if (rows.length < 2) return [];
	const rawHeaders = rows[0].map((h) => String(h || "").trim());
	const mapped = rawHeaders.map((h) => mapa[normalizarHeader(h)] || null);
	return rows
		.slice(1)
		.filter((r) => r.some((c) => String(c || "").trim() !== ""))
		.map((row) => {
			const obj = {};
			mapped.forEach((key, i) => {
				if (!key) return;
				obj[key] = row[i];
			});
			return obj;
		})
		.filter((o) => o.codigo);
}

export function parsearExcelStock(buffer) {
	const wb = XLSX.read(buffer, { cellDates: true });
	const nombres = wb.SheetNames.map((n) => normalizarHeader(n));
	const idxProductos = nombres.findIndex((n) => n.includes("producto"));
	const idxEntradas = nombres.findIndex((n) => n.includes("entrada"));
	const idxSalidas = nombres.findIndex((n) => n.includes("salida"));

	const resultado = { productos: [], movimientos: [] };

	if (idxProductos >= 0) {
		const raw = leerHoja(
			wb.Sheets[wb.SheetNames[idxProductos]],
			MAPA_PRODUCTOS,
		);
		resultado.productos = raw.map((p) => {
			let stockInicial =
				Number(String(p.stockInicial || "").replace(",", ".")) || 0;
			const stockActualRaw =
				Number(String(p.stockActualRaw || "").replace(",", ".")) || 0;
			const entradasRaw =
				Number(String(p.entradasRaw || "").replace(",", ".")) || 0;
			const salidasRaw =
				Number(String(p.salidasRaw || "").replace(",", ".")) || 0;
			if (!stockInicial && stockActualRaw) {
				stockInicial = Math.max(
					0,
					stockActualRaw - entradasRaw + salidasRaw,
				);
			}
			return {
				codigo: String(p.codigo || "").trim(),
				producto: String(p.producto || "").trim(),
				stockInicial,
				stockMinimo:
					Number(String(p.stockMinimo || "").replace(",", ".")) || 0,
				activo:
					String(p.activoRaw || "")
						.trim()
						.toUpperCase() !== "NO",
			};
		});
	}

	if (idxEntradas >= 0) {
		const raw = leerHoja(
			wb.Sheets[wb.SheetNames[idxEntradas]],
			MAPA_ENTRADAS,
		);
		resultado.movimientos.push(
			...raw.map((m) => ({
				tipo: "entrada",
				fecha: normalizarFecha(m.fecha),
				numeroFactura: String(m.numeroFactura || "").trim(),
				cantidad:
					Number(String(m.cantidad || "").replace(",", ".")) || 0,
				codigo: String(m.codigo || "").trim(),
				producto: String(m.producto || "").trim(),
				marca: String(m.marca || "").trim(),
				numeroLote: String(m.numeroLote || "").trim(),
				vencimiento: normalizarFecha(m.vencimiento),
				precioUnitario:
					Number(String(m.precioUnitario || "").replace(",", ".")) ||
					0,
				precioTotal:
					Number(String(m.precioTotal || "").replace(",", ".")) || 0,
			})),
		);
	}

	if (idxSalidas >= 0) {
		const raw = leerHoja(
			wb.Sheets[wb.SheetNames[idxSalidas]],
			MAPA_SALIDAS,
		);
		resultado.movimientos.push(
			...raw.map((m) => ({
				tipo: "salida",
				fecha: normalizarFecha(m.fecha),
				movimiento: String(m.movimiento || "").trim(),
				items: [
					{
						codigo: String(m.codigo || "").trim(),
						producto: String(m.producto || "").trim(),
						marca: String(m.marca || "").trim(),
						cantidad:
							Number(
								String(m.cantidad || "").replace(",", "."),
							) || 0,
						numeroLote: String(m.numeroLote || "").trim(),
						vencimiento: normalizarFecha(m.vencimiento),
						precioUnitario:
							Number(
								String(m.precioUnitario || "").replace(
									",",
									".",
								),
							) || 0,
						precioTotal:
							Number(
								String(m.precioTotal || "").replace(",", "."),
							) || 0,
					},
				],
				observaciones: String(m.observaciones || "").trim(),
				usuario: String(m.usuario || "").trim(),
				usuarioNombre: String(m.usuario || "").trim(),
			})),
		);
	}

	return resultado;
}

export async function importarExcelStock(buffer, opciones = {}) {
	const { crearProductosFaltantes = true } = opciones;
	const { productos, movimientos } = parsearExcelStock(buffer);

	const updates = {};
	const ahora = Date.now();
	const codigosNuevos = new Set();

	for (const p of productos) {
		if (!p.codigo) continue;
		codigosNuevos.add(p.codigo);
		updates[`${PRODUCTOS_PATH}/${p.codigo}`] = {
			codigo: p.codigo,
			producto: p.producto || "",
			stockInicial: p.stockInicial || 0,
			stockMinimo: p.stockMinimo || 0,
			activo: p.activo !== false,
			createdAt: ahora,
			updatedAt: ahora,
		};
	}

	if (crearProductosFaltantes) {
		const codigosMov = new Set();
		movimientos.forEach((m) =>
			itemsDe(m).forEach((it) => it.codigo && codigosMov.add(it.codigo)),
		);
		for (const cod of codigosMov) {
			if (!codigosNuevos.has(cod)) {
				const mov = movimientos.find((m) =>
					itemsDe(m).some((it) => it.codigo === cod),
				);
				const it = mov
					? itemsDe(mov).find((x) => x.codigo === cod)
					: null;
				updates[`${PRODUCTOS_PATH}/${cod}`] = {
					codigo: cod,
					producto: it?.producto || "(sin nombre)",
					stockInicial: 0,
					stockMinimo: 0,
					activo: true,
					createdAt: ahora,
					updatedAt: ahora,
				};
			}
		}
	}

	const ids = await reservarIdsMov(movimientos.length);
	movimientos.forEach((m, i) => {
		const id = ids[i];
		updates[`${MOVIMIENTOS_PATH}/${id}`] = {
			id,
			...limpiarMovimiento(m),
			createdAt: ahora,
			updatedAt: ahora,
		};
	});

	if (Object.keys(updates).length) {
		await update(ref(db), updates);
	}

	return {
		productos: productos.length,
		movimientos: movimientos.length,
	};
}

/* ======================================================
   ESTADOS VISUALES
   ====================================================== */
export const ESTADOS = {
	normal: {
		label: "Normal",
		color: "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400",
	},
	bajo: {
		label: "Stock bajo",
		color: "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400",
	},
	"sin-stock": {
		label: "Sin stock",
		color: "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400",
	},
};

/* ======================================================
   MOVIMIENTOS FRECUENTES
   ====================================================== */
export const MOVIMIENTOS_FRECUENTES = [
	"Farmacia externa",
	"Hospital Italiano",
	"Hospital Austral",
	"Clínica Bazterrica",
	"Paciente ambulatorio",
	"Uso interno",
	"Traslado a otra base",
];

/* ======================================================
   PLANTILLA
   ====================================================== */
export function descargarPlantillaStock() {
	const wb = XLSX.utils.book_new();

	const productosDemo = [
		{
			CODIGO: "MED-0001",
			PRODUCTO: "Ibuprofeno 400mg x 20 comp",
			"STOCK INICIAL": 40,
			"STOCK MINIMO": 10,
			ACTIVO: "SI",
		},
		{
			CODIGO: "MED-0002",
			PRODUCTO: "Amoxicilina 500mg x 21 comp",
			"STOCK INICIAL": 20,
			"STOCK MINIMO": 8,
			ACTIVO: "SI",
		},
	];
	const wsProd = XLSX.utils.json_to_sheet(productosDemo, {
		header: [
			"CODIGO",
			"PRODUCTO",
			"STOCK INICIAL",
			"STOCK MINIMO",
			"ACTIVO",
		],
	});
	wsProd["!cols"] = [
		{ wch: 14 },
		{ wch: 40 },
		{ wch: 16 },
		{ wch: 14 },
		{ wch: 10 },
	];
	XLSX.utils.book_append_sheet(wb, wsProd, "PRODUCTOS");

	const entradasDemo = [
		{
			FECHA: "01/12/2025",
			"Nº DE FACTURA": "A-0001-00012345",
			CANTIDAD: 50,
			CODIGO: "MED-0001",
			PRODUCTO: "Ibuprofeno 400mg x 20 comp",
			MARCA: "Roemmers",
			"Nº DE LOTE": "L-2025-001",
			VTO: "01/12/2026",
			"PRECIO UNITARIO": 850.5,
			"PRECIO TOTAL": 42525.0,
		},
	];
	const wsEnt = XLSX.utils.json_to_sheet(entradasDemo, {
		header: [
			"FECHA",
			"Nº DE FACTURA",
			"CANTIDAD",
			"CODIGO",
			"PRODUCTO",
			"MARCA",
			"Nº DE LOTE",
			"VTO",
			"PRECIO UNITARIO",
			"PRECIO TOTAL",
		],
	});
	wsEnt["!cols"] = [
		{ wch: 12 },
		{ wch: 20 },
		{ wch: 10 },
		{ wch: 14 },
		{ wch: 34 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 12 },
		{ wch: 16 },
		{ wch: 16 },
	];
	XLSX.utils.book_append_sheet(wb, wsEnt, "ENTRADAS");

	const salidasDemo = [
		{
			FECHA: "02/12/2025",
			MOVIMIENTO: "Hospital Italiano",
			CANTIDAD: 5,
			CODIGO: "MED-0001",
			PRODUCTO: "Ibuprofeno 400mg x 20 comp",
			MARCA: "Roemmers",
			"Nº DE LOTE": "L-2025-001",
			VTO: "01/12/2026",
			"PRECIO UNITARIO": 850.5,
			"PRECIO TOTAL": 4252.5,
			OBSERVACIONES: "Paciente Gómez",
			USUARIO: "Vendedor Farmacia",
		},
	];
	const wsSal = XLSX.utils.json_to_sheet(salidasDemo, {
		header: [
			"FECHA",
			"MOVIMIENTO",
			"CANTIDAD",
			"CODIGO",
			"PRODUCTO",
			"MARCA",
			"Nº DE LOTE",
			"VTO",
			"PRECIO UNITARIO",
			"PRECIO TOTAL",
			"OBSERVACIONES",
			"USUARIO",
		],
	});
	wsSal["!cols"] = [
		{ wch: 12 },
		{ wch: 26 },
		{ wch: 10 },
		{ wch: 14 },
		{ wch: 34 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 12 },
		{ wch: 16 },
		{ wch: 16 },
		{ wch: 34 },
		{ wch: 20 },
	];
	XLSX.utils.book_append_sheet(wb, wsSal, "SALIDAS");

	XLSX.writeFile(wb, "plantilla_stock.xlsx");
}
