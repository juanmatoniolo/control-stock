import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";

export const metadata = {
  title: "Control de Stock",
  description: "Sistema de gestión de stock, combustible y farmacia",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className="antialiased" suppressHydrationWarning>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}