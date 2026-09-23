import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { FontSizeProvider } from "@/context/FontSizeContext";

export const metadata = {
  title: "Control de Stock",
  description: "Sistema de gestión de stock, combustible y farmacia",
};

// Script anti-flash: aplica tema y tamaño de fuente
// ANTES de que React monte, para evitar parpadeos
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