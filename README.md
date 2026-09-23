{
"proyecto": {
"nombre": "control-stock",
"descripcion": "App web para gestión de stock, combustible, proveedores, traslados, facturas y farmacia",
"stack": {
"framework": "Next.js 16.3.6 (App Router)",
"ui": "React 19.2.8",
"estilos": "Tailwind CSS v4 (vía @tailwindcss/postcss)",
"base_de_datos": "Firebase Realtime Database (firebase ^12.19.0)",
"lenguaje": "JavaScript (JSX)",
"autenticacion": "Login propio contra /usuarios en Realtime DB (NO Firebase Auth)"
},
"entorno": {
"sistema_operativo": "Windows",
"shell": "PowerShell",
"ruta_proyecto": "C:\\Users\\juanma\\Desktop\\control-stock",
"dev_server": "npm run dev → http://localhost:3000"
}
},

"firebase": {
"proyecto_id": "control-de-stock-962ab",
"database_url": "https://control-de-stock-962ab-default-rtdb.firebaseio.com",
"reglas_actuales": {
"read": true,
"write": true,
"nota": "TEMPORAL - abiertas solo para desarrollo, cerrar antes de producción"
},
"env_local": {
"archivo": ".env.local",
"variables": [
"NEXT_PUBLIC_FIREBASE_API_KEY",
"NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN",
"NEXT_PUBLIC_FIREBASE_DATABASE_URL",
"NEXT_PUBLIC_FIREBASE_PROJECT_ID",
"NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
"NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
"NEXT_PUBLIC_FIREBASE_APP_ID",
"NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID"
],
"estado": "creado y funcionando"
}
},

"estructura_actual": {
"src": {
"app": {
"layout.jsx": "MODIFICADO - envuelve con <AuthProvider>, lang=es, metadata configurada",
"page.jsx": "MODIFICADO - redirect raíz según sesión (/login, /dashboard o /farmacia)",
"globals.css": "MODIFICADO - solo @import 'tailwindcss'",
"login": {
"page.jsx": "COMPLETO - form usuario/password, Suspense, redirección por rol, manejo de errores"
},
"dashboard": {
"page.jsx": "PLACEHOLDER - protegido para rol 'root', botón logout, saludo",
"stock/page.jsx": "VACÍO",
"combustible/page.jsx": "VACÍO",
"proveedores/page.jsx": "VACÍO",
"traslados/page.jsx": "VACÍO",
"facturas/page.jsx": "VACÍO"
},
"farmacia": {
"page.jsx": "PLACEHOLDER - protegido para 'vendedor' y 'root', botón logout",
"egresos/page.jsx": "VACÍO"
}
},
"components": {
"ProtectedRoute.jsx": "COMPLETO - verifica sesión + rol, redirige según corresponda, maneja loading",
"Sidebar.jsx": "VACÍO",
"ui": {
"Button.jsx": "VACÍO",
"Input.jsx": "VACÍO",
"Card.jsx": "VACÍO"
}
},
"context": {
"AuthContext.jsx": "COMPLETO - login(), logout(), user, loading, persistencia en localStorage (key: control-stock-session)"
},
"hooks": {
"useAuth.js": "COMPLETO - re-exporta useAuth desde context"
},
"lib": {
"firebase.js": "COMPLETO - inicializa app + exporta db (Realtime Database)"
}
},
"scripts": {
"seed.mjs": "COMPLETO - crea usuarios root y vendedor en /usuarios (idempotente)"
},
"configs_raiz": {
"package.json": "OK - type NO es module (se usa .mjs para scripts)",
"postcss.config.mjs": "OK - plugin @tailwindcss/postcss",
"tailwind.config.js": "NO EXISTE (correcto para Tailwind v4)",
"next.config.mjs": "por defecto",
".gitignore": "por defecto (.env\* ignorado)",
".env.local": "creado con claves Firebase"
}
},

"base_de_datos": {
"usuarios": {
"root": {
"usuario": "root",
"password": "root1234",
"nombre": "Administrador",
"rol": "root"
},
"vendedor": {
"usuario": "vendedor",
"password": "vende1234",
"nombre": "Vendedor Farmacia",
"rol": "vendedor"
}
},
"nodos_planeados": {
"usuarios": "✅ creado",
"stock": "⏳ pendiente",
"combustible": "⏳ pendiente",
"proveedores": "⏳ pendiente",
"traslados": "⏳ pendiente",
"facturas": "⏳ pendiente",
"farmacia/egresos": "⏳ pendiente"
}
},

"funcionalidades_ok": [
"Login con usuario/password contra Realtime DB",
"Sesión persistente en localStorage (sobrevive reload)",
"Redirección automática según rol (root → /dashboard, vendedor → /farmacia)",
"Protección de rutas por rol (ProtectedRoute)",
"Logout funcional",
"Redirect raíz / según estado de sesión",
"Tailwind v4 funcionando",
"Script de seed para crear usuarios"
],

"pendiente_por_hacer": {
"prioridad_alta": [
"Sidebar / layout compartido para dashboard (menú lateral con secciones)",
"Componentes UI reutilizables (Button, Input, Card)",
"Módulo Farmacia - Egresos de medicación (formulario + listado) - único permitido a vendedor",
"CRUD Stock (ingreso/egreso, alertas de stock bajo, vencimientos)",
"CRUD Proveedores",
"CRUD Combustible (cargas por vehículo, km, litros)",
"CRUD Traslados (origen, destino, items)",
"CRUD Facturas (proveedor, monto, tipo, fecha)"
],
"prioridad_media": [
"Roles y permisos finos (root ve todo, vendedor solo farmacia/egresos)",
"Hashing de contraseñas (actualmente en texto plano)",
"Validaciones de formularios",
"Notificaciones / toasts",
"Filtros y búsqueda en listados",
"Exportar a PDF/Excel",
"Historial de movimientos por usuario"
],
"prioridad_baja": [
"Reglas de seguridad en Realtime DB para producción",
"Migrar a Firebase Auth (opcional si se quiere login más robusto)",
"Responsive móvil fino",
"Modo oscuro",
"Dashboard con métricas/gráficos",
"PWA / instalable"
]
},

"decisiones_tecnicas": {
"auth": "Login propio contra /usuarios. Sin Firebase Auth para simplificar.",
"passwords": "Texto plano por ahora (migrar a bcrypt más adelante)",
"persistencia_sesion": "localStorage con key 'control-stock-session'",
"rutas_protegidas": "vía <ProtectedRoute roles={[...]}>",
"estilos": "Tailwind v4 con @import (sin tailwind.config.js)",
"idioma_ui": "Español (Argentina)"
},

"siguiente_paso_sugerido": "Sidebar + layout del dashboard (menú con: Stock, Combustible, Proveedores, Traslados, Facturas) y layout de Farmacia (Egresos)"
}

// Padding fluido

<div className="p-4 sm:p-6 lg:p-8">

// Grid que se adapta

<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">

// Texto fluido

<h1 className="text-xl sm:text-2xl lg:text-3xl">

// Botones que ocupan todo en mobile
<button className="w-full sm:w-auto px-4 py-2.5">

// Ocultar/mostrar según tamaño

<div className="hidden md:block">Solo desktop</div>
<div className="md:hidden">Solo mobile</div>

// Flex que se apila en mobile

<div className="flex flex-col sm:flex-row gap-3">

{
"proyecto": {
"nombre": "control-stock",
"descripcion": "App web para gestión de stock, combustible, proveedores, traslados, facturas y farmacia (egresos de medicación)",
"objetivo_final": "Sistema interno de gestión con roles diferenciados (root/vendedor), modo oscuro, escalabilidad de fuente, y responsive total desde iPhone SE (375px) hasta monitores grandes",
"estado_actual": "En desarrollo — módulo de Proveedores completado, base sólida lista"
},

"stack_tecnico": {
"framework": "Next.js 16.3.6 (App Router + Turbopack)",
"react": "19.2.8",
"estilos": "Tailwind CSS v4 (config vía CSS, sin tailwind.config.js)",
"base_de_datos": "Firebase Realtime Database",
"librerias_extra": ["xlsx (para importar Excel de proveedores)", "firebase ^12.19.0"],
"lenguaje": "JavaScript (JSX)",
"autenticacion": "Login propio contra /usuarios (NO Firebase Auth)",
"entorno": {
"os": "Windows",
"shell": "PowerShell",
"ruta": "C:\\Users\\juanma\\Desktop\\control-stock",
"dev": "npm run dev → http://localhost:3000"
}
},

"firebase*config": {
"proyecto_id": "control-de-stock-962ab",
"database_url": "https://control-de-stock-962ab-default-rtdb.firebaseio.com",
"reglas_actuales": { ".read": true, ".write": true, "nota": "TEMPORAL - abiertas para desarrollo" },
"env_local": "8 variables NEXT_PUBLIC_FIREBASE*\* configuradas",
"archivo_conexion": "src/lib/firebase.js → exporta { db }"
},

"estructura_del_proyecto": {
"src/app": {
"layout.jsx": "RootLayout: ThemeProvider + FontSizeProvider + AuthProvider + bootScript anti-flash",
"page.jsx": "Redirect raíz según sesión",
"globals.css": "Tailwind v4 + dark mode + escala de fuente (data-font) + utilidades responsive",
"login/page.jsx": "Login con resolverDestino() según rol",
"dashboard": {
"layout.jsx": "Sidebar + ProtectedRoute(root) + padding responsive",
"page.jsx": "Home con cards de módulos",
"proveedores/page.jsx": "✅ COMPLETO — CRUD + Excel + Detalle + WhatsApp + Dark",
"stock/page.jsx": "Placeholder",
"combustible/page.jsx": "Placeholder",
"traslados/page.jsx": "Placeholder",
"facturas/page.jsx": "Placeholder"
},
"farmacia": {
"layout.jsx": "Sidebar + ProtectedRoute(vendedor/root) + padding responsive",
"page.jsx": "Home con acceso rápido a egresos",
"egresos/page.jsx": "Placeholder"
}
},
"src/components": {
"Sidebar.jsx": "Sidebar desktop colapsable + header mobile + bottom nav + ThemeToggle + FontSizeToggle",
"ProtectedRoute.jsx": "Verificación de sesión y rol con redirect",
"Icons.jsx": "Iconos SVG reutilizables",
"ui": {
"Modal.jsx": "Modal responsive con dark",
"CopyButton.jsx": "Copiar al portapapeles con feedback ✓",
"ThemeToggle.jsx": "Switch de tema claro/oscuro",
"FontSizeToggle.jsx": "3 niveles A/A+/A++",
"Button.jsx": "Placeholder",
"Input.jsx": "Placeholder",
"Card.jsx": "Placeholder"
},
"proveedores": {
"FormProveedor.jsx": "Formulario con 11 campos + dark",
"ModalImportar.jsx": "Importar Excel con mapeo automático de headers",
"ModalDetalle.jsx": "Vista completa con secciones + WhatsApp + Llamar + Email + Copy"
}
},
"src/context": {
"AuthContext.jsx": "login/logout/user/loading + persistencia en localStorage (control-stock-session)",
"ThemeContext.jsx": "Tema dark/light + persistencia (control-stock-theme) + detección de sistema",
"FontSizeContext.jsx": "3 niveles de fuente + persistencia (control-stock-fontsize)"
},
"src/hooks": {
"useAuth.js": "Re-export del contexto",
"useTheme.js": "Re-export del contexto",
"useFontSize.js": "Re-export + FONT_SIZES"
},
"src/lib": {
"firebase.js": "Inicialización de Firebase + exporta db",
"proveedores.js": "CRUD + autoincremental con runTransaction + importación en lote",
"whatsapp.js": "Helper para normalizar teléfonos argentinos y generar links wa.me/tel/mailto"
},
"scripts": {
"seed.mjs": "Crea usuarios root y vendedor en /usuarios (idempotente)"
}
},

"base_de_datos_firebase": {
"usuarios": {
"root": { "usuario": "root", "password": "root1234", "nombre": "Administrador", "rol": "root" },
"vendedor": { "usuario": "vendedor", "password": "vende1234", "nombre": "Vendedor Farmacia", "rol": "vendedor" }
},
"proveedores": {
"path": "/proveedores/{id}",
"campos": ["id", "proveedor", "cuit", "situacion", "banco", "cbu", "alias", "email", "telefono", "direccion", "rubro", "aliasRcel", "createdAt", "updatedAt"],
"id_autoincremental": "vía /contadores/proveedores con runTransaction"
},
"nodos_planeados": ["stock", "combustible", "traslados", "facturas", "farmacia/egresos"]
},

"funcionalidades_implementadas": {
"autenticacion": [
"Login con usuario/password contra Realtime DB",
"Sesión persistente en localStorage",
"Redirección por rol (root → /dashboard, vendedor → /farmacia)",
"Protección de rutas con ProtectedRoute",
"Logout funcional"
],
"ui_ux": [
"Dark mode con switch (detecta preferencia del sistema)",
"3 niveles de tamaño de fuente (16/18/20px) con persistencia",
"Sidebar desktop colapsable con tooltips",
"Mobile: header arriba + bottom nav abajo (sin hamburguesa)",
"Responsive desde 375px (iPhone SE) hasta monitores 4K",
"Modal reutilizable responsive (bottom-sheet en mobile)"
],
"modulo_proveedores": [
"CRUD completo (crear, leer, actualizar, eliminar)",
"IDs autoincrementales únicos",
"Búsqueda en vivo (nombre, CUIT, CBU, alias, rubro, teléfono)",
"Importación desde Excel (.xlsx/.xls/.csv) con mapeo automático de headers",
"Botones de copiar al portapapeles con feedback visual",
"Botón de WhatsApp con mensaje precargado (normaliza teléfonos AR)",
"Modal de detalle con secciones (Contacto, Banco, Fiscal, Ubicación)",
"Vista tabla en desktop + cards en mobile"
]
},

"pendiente_por_hacer": {
"modulos_crud": [
"🚚 Traslados (origen, destino, items, fecha)",
"⛽ Combustible (cargas por vehículo, litros, km)",
"📦 Stock (ingreso/egreso, alertas de stock bajo, vencimientos)",
"📄 Facturas (proveedor, monto, tipo, fecha) - orden cronológico",
"💊 Farmacia → Egresos de medicación (único para vendedor)"
],
"mejoras_transversales": [
"Aplicar dark a: stock, combustible, traslados, facturas, egresos, login",
"Aplicar tamaño de fuente al login",
"Dashboard con métricas/gráficos",
"Notificaciones / toasts",
"Exportar a PDF/Excel",
"Historial de movimientos por usuario",
"Hashing de contraseñas (bcrypt)",
"Reglas de seguridad en Realtime DB para producción",
"Responsive fino del login en mobile"
]
},

"decisiones_tecnicas_importantes": {
"autenticacion": "Login propio contra /usuarios. Sin Firebase Auth (por simplicidad). Contraseñas en texto plano por ahora.",
"roles": "Solo 2: root (acceso total) y vendedor (solo farmacia/egresos). El root puede acceder también a /farmacia.",
"persistencia": "localStorage con keys: control-stock-session, control-stock-theme, control-stock-fontsize",
"autoincremental": "Uso de runTransaction de Firebase en /contadores/{coleccion} para IDs únicos",
"responsive_mobile": "NO usar hamburguesa — usar header sticky arriba + bottom nav fijo abajo",
"dark_mode": "Tailwind v4 con @custom-variant dark + clase .dark en <html>",
"escala_fuente": "data-font en <html> (base/lg/xl) + font-size en rem (16/18/20px)",
"anti_flash": "Script inline en <head> del RootLayout que aplica tema y fuente antes del render",
"idioma_ui": "Español (Argentina)"
},

"metodologia_de_trabajo": {
"principios": [
"Todo en español: variables, comentarios, textos de UI",
"Mobile-first siempre: iPhone SE (375px) como mínimo soportado",
"Nunca asumir que un archivo se creó — verificar con Test-Path",
"Usar notepad para archivos nuevos: primero New-Item, después notepad",
"Nunca modificar package.json (type: module) — usar .mjs para scripts",
"Componentes reutilizables antes que código duplicado",
"Dark mode desde el inicio, no como afterthought",
"Accesibilidad: inputs de 16px en mobile (evita zoom iOS), botones ≥44px"
],
"formato_de_entrega": [
"Comandos PowerShell primero (crear carpeta/archivo)",
"Luego el contenido completo del archivo listo para copiar/pegar",
"Nunca fragmentos — siempre el archivo entero",
"Después de cada módulo: checklist de pruebas",
"Reiniciar con: Remove-Item .next -Recurse -Force + npm run dev",
"Recordar hard refresh: Ctrl + Shift + R"
],
"flujo_por_modulo": [
"1. Definir estructura de datos en Firebase",
"2. Crear src/lib/{modulo}.js con helpers CRUD",
"3. Crear componentes UI (forms, modales)",
"4. Crear página principal con listado responsive (tabla desktop + cards mobile)",
"5. Aplicar dark mode a todo",
"6. Checklist de pruebas + fix"
],
"convenciones_de_codigo": {
"paths_absolutos": "usar @/... (ej: @/lib/firebase)",
"nombres_archivos": "PascalCase para componentes, camelCase para libs/hooks",
"client_components": "Todos los que usan hooks/eventos llevan 'use client' al inicio",
"estilos": "Clases utilitarias de Tailwind, sin CSS modules",
"colores_dark": "Fondo slate-950, cards slate-900, bordes slate-800, textos slate-100/400"
}
},

"errores_comunes_y_soluciones": {
"layout_no_se_aplica": "Verificar Test-Path del layout.jsx. Debe tener contenido (>500 bytes) y 'use client' + export default",
"hydration_mismatch": "Agregar suppressHydrationWarning al <body> del RootLayout",
"turbopack_root_warning": "Agregar turbopack.root a next.config.mjs si hay package.json fuera del proyecto",
"seed_no_corre": "El archivo debe terminar en .mjs, no .js (para usar import sin type:module)",
"sidebar_no_se_ve": "Verificar que el layout esté en la carpeta correcta: src/app/dashboard/layout.jsx y no src/app/dashboard/proveedores/layout.jsx"
},

"comandos_utiles": {
"dev": "npm run dev",
"limpiar_cache": "Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue",
"crear_archivo": "New-Item -ItemType File -Force -Path 'ruta\\archivo.jsx' | Out-Null; notepad ruta\\archivo.jsx",
"verificar_archivos": "Test-Path src\\app\\dashboard\\layout.jsx",
"seed_usuarios": "node scripts\\seed.mjs"
},

"siguiente_paso": "Módulo de Traslados — CRUD con campos: origen, destino, items (array), fecha, responsable, observaciones. Aplicar dark mode desde el inicio. Reutilizar patrones de Proveedores: tabla desktop + cards mobile + modal detalle + autoincremental."
}
