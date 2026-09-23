"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { IconHome, IconBox, IconExit } from "@/components/Icons";

const MENU = [
    { href: "/farmacia", label: "Inicio", icon: IconHome },
    { href: "/farmacia/inventario", label: "Inventario", icon: IconBox },
    { href: "/farmacia/egresos", label: "Egresos", icon: IconExit },
];

export default function FarmaciaLayout({ children }) {
    return (
        <ProtectedRoute roles={["vendedor", "root"]}>
            <div className="flex min-h-screen bg-slate-100 dark:bg-slate-950 transition-colors">
                <Sidebar items={MENU} title="Farmacia" />
                <main className="flex-1 min-w-0 w-full">
                    <div className="p-4 sm:p-6 lg:p-8 pt-32 md:pt-6 lg:pt-8 pb-28 md:pb-6 lg:pb-8">
                        <div className="content-container">{children}</div>
                    </div>
                </main>
            </div>
        </ProtectedRoute>
    );
}