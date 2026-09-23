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
