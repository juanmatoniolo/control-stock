"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import {
    IconHome,
    IconStock,
    IconFuel,
    IconProviders,
    IconTruck,
    IconInvoice,
} from "@/components/Icons";

const MENU = [
    { href: "/dashboard", label: "Inicio", icon: IconHome },
    { href: "/dashboard/stock", label: "Stock", icon: IconStock },
    { href: "/dashboard/combustible", label: "Combustible", icon: IconFuel },
    { href: "/dashboard/proveedores", label: "Proveedores", icon: IconProviders },
    { href: "/dashboard/traslados", label: "Traslados", icon: IconTruck },
    { href: "/dashboard/facturas", label: "Facturas", icon: IconInvoice },
];

export default function DashboardLayout({ children }) {
    return (
        <ProtectedRoute roles={["root"]}>
            <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
                <Sidebar items={MENU} title="Control de Stock" />
                <main className="flex-1 min-w-0 w-full">
                    <div className="p-4 sm:p-6 lg:p-8 pt-32 md:pt-6 lg:pt-8 pb-28 md:pb-6 lg:pb-8">
                        <div className="content-container">{children}</div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}