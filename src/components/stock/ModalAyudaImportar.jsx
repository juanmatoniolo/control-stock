"use client";

import Modal from "@/components/ui/Modal";
import { descargarPlantillaStock } from "@/lib/stock";

function Seccion({ titulo, color, children }) {
    return (
        <div className={`rounded-lg border-l-4 ${color} bg-slate-50 dark:bg-slate-800/40 p-3`}>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                {titulo}
            </h3>
            {children}
        </div>
    );
}

function Campo({ nombre, obligatorio, descripcion, ejemplo }) {
    return (
        <div className="flex items-start gap-2 py-1.5 border-b border-slate-100 dark:border-slate-800/60 last:border-0">
            <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-bold flex-shrink-0 mt-0.5 ${obligatorio
                    ? "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-400"
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
                    }`}
            >
                {obligatorio ? "SÍ" : "NO"}
            </span>
            <div className="min-w-0 flex-1">
                <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {nombre}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {descripcion}
                </p>
                {ejemplo && (
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 italic">
                        Ej: {ejemplo}
                    </p>
                )}
            </div>
        </div>
    );
}

export default function ModalAyudaImportar({ open, onClose }) {
    return (
        <Modal open={open} onClose={onClose} title="Cómo importar tu planilla de stock" size="lg">
            <div className="space-y-4">
                {/* INTRO */}
                <div className="bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-900 rounded-lg p-3">
                    <p className="text-sm text-sky-800 dark:text-sky-300">
                        Tu Excel debe tener <strong>hasta 3 hojas</strong> con los nombres{" "}
                        <strong>PRODUCTOS</strong>, <strong>ENTRADAS</strong> y{" "}
                        <strong>SALIDAS</strong>. Puede faltar alguna.
                    </p>
                </div>

                {/* FÓRMULA */}
                <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3">
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 mb-1">
                        🧮 Cómo se calcula el stock
                    </p>
                    <p className="text-sm text-emerald-800 dark:text-emerald-300 font-mono">
                        Stock actual = Stock inicial + Entradas − Salidas
                    </p>
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1.5">
                        El <strong>stock inicial</strong> es la cantidad que ya tenés al crear el producto.
                        Sirve para no tener que cargar todas las compras históricas.
                    </p>
                </div>

                {/* BOTÓN DESCARGAR */}
                <button
                    onClick={descargarPlantillaStock}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Descargar plantilla con ejemplo
                </button>

                {/* HOJA PRODUCTOS */}
                <Seccion titulo="📋 Hoja 1: PRODUCTOS" color="border-sky-500">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Catálogo + stock de cada producto. El <strong>código</strong> es único y se usa en entradas y salidas.
                    </p>
                    <div>
                        <Campo nombre="CODIGO" obligatorio descripcion="Identificador único del producto" ejemplo="MED-0001" />
                        <Campo nombre="PRODUCTO" obligatorio descripcion="Nombre completo" ejemplo="Ibuprofeno 400mg x 20 comp" />
                        <Campo nombre="STOCK INICIAL" descripcion="Cantidad actual al crear el producto" ejemplo="40" />
                        <Campo nombre="STOCK MINIMO" descripcion="Alerta cuando el stock baja de este número" ejemplo="10" />
                        <Campo nombre="ACTIVO" descripcion="SI o NO. Vacío = SI" ejemplo="SI" />
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-2">
                        ℹ Si la hoja viene con columnas <em>TOTAL ENTRADAS</em> / <em>TOTAL SALIDAS</em> /{" "}
                        <em>STOCK ACTUAL</em>, se usa <em>STOCK ACTUAL</em> para reconstruir el inicial automáticamente.
                    </p>
                </Seccion>

                {/* HOJA ENTRADAS */}
                <Seccion titulo="📥 Hoja 2: ENTRADAS" color="border-emerald-500">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Compras / ingresos al stock.
                    </p>
                    <div>
                        <Campo nombre="FECHA" obligatorio descripcion="dd/mm/aaaa o fecha nativa de Excel" ejemplo="01/12/2025" />
                        <Campo nombre="Nº DE FACTURA" descripcion="Número del comprobante" ejemplo="A-0001-00012345" />
                        <Campo nombre="CANTIDAD" obligatorio descripcion="Unidades que ingresan" ejemplo="50" />
                        <Campo nombre="CODIGO" obligatorio descripcion="Debe coincidir con PRODUCTOS" ejemplo="MED-0001" />
                        <Campo nombre="PRODUCTO" descripcion="Informativo (puede repetir el de PRODUCTOS)" ejemplo="Ibuprofeno 400mg x 20 comp" />
                        <Campo nombre="MARCA" descripcion="Laboratorio / fabricante" ejemplo="Roemmers" />
                        <Campo nombre="Nº DE LOTE" descripcion="Lote del proveedor" ejemplo="L-2025-001" />
                        <Campo nombre="VTO" descripcion="Vencimiento (dd/mm/aaaa)" ejemplo="01/12/2026" />
                        <Campo nombre="PRECIO UNITARIO" descripcion="Precio por unidad" ejemplo="850.50" />
                        <Campo nombre="PRECIO TOTAL" descripcion="Cantidad × precio unitario" ejemplo="42525.00" />
                    </div>
                </Seccion>

                {/* HOJA SALIDAS */}
                <Seccion titulo="📤 Hoja 3: SALIDAS" color="border-red-500">
                    <p className="text-xs text-slate-600 dark:text-slate-400 mb-2">
                        Salidas internas de stock. Ahora también incluye datos del lote que sale.
                    </p>
                    <div>
                        <Campo nombre="FECHA" obligatorio descripcion="dd/mm/aaaa" ejemplo="02/12/2025" />
                        <Campo nombre="MOVIMIENTO" obligatorio descripcion="A dónde va el producto (reemplaza Nº de Factura)" ejemplo="Hospital Italiano" />
                        <Campo nombre="CANTIDAD" obligatorio descripcion="Unidades que salen" ejemplo="5" />
                        <Campo nombre="CODIGO" obligatorio descripcion="Debe coincidir con PRODUCTOS" ejemplo="MED-0001" />
                        <Campo nombre="PRODUCTO" descripcion="Informativo" ejemplo="Ibuprofeno 400mg x 20 comp" />
                        <Campo nombre="MARCA" descripcion="Laboratorio del lote que sale" ejemplo="Roemmers" />
                        <Campo nombre="Nº DE LOTE" descripcion="Lote que se está dando salida" ejemplo="L-2025-001" />
                        <Campo nombre="VTO" descripcion="Vencimiento del lote" ejemplo="01/12/2026" />
                        <Campo nombre="PRECIO UNITARIO" descripcion="Precio unitario del lote" ejemplo="850.50" />
                        <Campo nombre="PRECIO TOTAL" descripcion="Cantidad × precio unitario" ejemplo="4252.50" />
                        <Campo nombre="OBSERVACIONES" descripcion="Paciente, receta, nota..." ejemplo="Paciente Gómez, María" />
                        <Campo nombre="USUARIO" descripcion="Quién autoriza la salida" ejemplo="Vendedor Farmacia" />
                    </div>
                </Seccion>

                {/* TIPS */}
                <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-3 space-y-1.5">
                    <p className="text-xs font-bold text-amber-800 dark:text-amber-300">
                        💡 Tips importantes
                    </p>
                    <ul className="text-xs text-amber-700 dark:text-amber-400 space-y-1 list-disc list-inside">
                        <li>
                            Los nombres de las hojas deben contener las palabras{" "}
                            <strong>PRODUCTO</strong>, <strong>ENTRADA</strong> o{" "}
                            <strong>SALIDA</strong> (no importan mayúsculas ni acentos).
                        </li>
                        <li>
                            Los <strong>códigos deben coincidir exactamente</strong> entre las 3 hojas.
                        </li>
                        <li>
                            Si un movimiento tiene un código que no está en PRODUCTOS, se creará
                            automáticamente (producto sin ficha).
                        </li>
                        <li>Fechas: <code>dd/mm/aaaa</code> o fecha nativa de Excel.</li>
                        <li>Decimales: <code>.</code> o <code>,</code>.</li>
                    </ul>
                </div>

                <div className="flex justify-end pt-2">
                    <button
                        onClick={onClose}
                        className="px-4 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
                    >
                        Entendido
                    </button>
                </div>
            </div>
        </Modal>
    );
}