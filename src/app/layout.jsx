import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";

export const metadata = {
  // ============================================
  // BÁSICO
  // ============================================
  title: {
    default: "Minerva y Apolo — Control de Stock",
    template: "%s · Minerva y Apolo",
  },
  description:
    "Sistema de gestión de stock, combustible, choferes, traslados, proveedores y libro contable.",
  applicationName: "Minerva y Apolo",
  generator: "Next.js",
  keywords: [
    "control de stock",
    "Minerva y Apolo",
    "gestión",
    "farmacia",
    "ambulancia",
    "combustible",
    "proveedores",
    "libro contable",
  ],
  authors: [{ name: "Minerva y Apolo" }],
  creator: "Minerva y Apolo",
  publisher: "Minerva y Apolo",

  // ============================================
  // ICONOS
  // ============================================
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon0.svg", type: "image/svg+xml" },
      { url: "/icon1.png", type: "image/png", sizes: "any" },
      { url: "/web-app-manifest-192x192.png", type: "image/png", sizes: "192x192" },
      { url: "/web-app-manifest-512x512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/web-app-manifest-192x192.png", sizes: "192x192", type: "image/png" },
    ],
  },

  // ============================================
  // PWA MANIFEST
  // ============================================
  manifest: "/manifest.json",

  // ============================================
  // OPEN GRAPH (WhatsApp, Facebook, etc.)
  // ============================================
  openGraph: {
    type: "website",
    locale: "es_AR",
    url: "/",
    siteName: "Minerva y Apolo",
    title: "Minerva y Apolo — Control de Stock",
    description:
      "Sistema de gestión de stock, combustible, choferes, traslados, proveedores y libro contable.",
    images: [
      {
        url: "/banner.png",
        width: 1200,
        height: 630,
        alt: "Minerva y Apolo — Control de Stock",
      },
    ],
  },

  // ============================================
  // TWITTER CARD
  // ============================================
  twitter: {
    card: "summary_large_image",
    title: "Minerva y Apolo — Control de Stock",
    description:
      "Sistema de gestión de stock, combustible, choferes, traslados, proveedores y libro contable.",
    images: ["/banner.png"],
  },

  // ============================================
  // PWA — Indicaciones para el navegador
  // ============================================
  appleWebApp: {
    capable: true,
    title: "Minerva y Apolo",
    statusBarStyle: "black-translucent",
  },
  formatDetection: {
    telephone: false,
  },

  // ============================================
  // MISC
  // ============================================
  metadataBase: new URL("https://control-de-stock-962ab.web.app"), // ⚠️ cambiá por tu dominio real
  viewport: {
    width: "device-width",
    initialScale: 1,
    maximumScale: 5,
    userScalable: true,
    themeColor: [
      { media: "(prefers-color-scheme: light)", color: "#0ea5e9" },
      { media: "(prefers-color-scheme: dark)", color: "#0f172a" },
    ],
  },
};

// Script anti-flash: aplica tema y tamaño de fuente
const bootScript = `
(function() {
  try {
    var t = localStorage.getItem('control-stock-theme');
    if (!t) {
      t = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (t === 'dark') document.documentElement.classList.add('dark');

    var f = localStorage.getItem('control-stock-fontsize');
    if (f === 'lg' || f === 'xl') {
      document.documentElement.setAttribute('data-font', f);
    }
  } catch(e) {}
})();
`;

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: bootScript }} />
        {/* Apple PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Minerva y Apolo" />
        {/* Android PWA */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
      </head>
      <body className="antialiased bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <ThemeProvider>
          <FontSizeProvider>
            <AuthProvider>{children}</AuthProvider>
          </FontSizeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}