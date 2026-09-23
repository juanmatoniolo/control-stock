"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { db } from "@/lib/firebase";

const AuthContext = createContext(null);
const STORAGE_KEY = "control-stock-session";

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Restaurar sesión guardada al montar
    useEffect(() => {
        try {
            const raw = localStorage.getItem(STORAGE_KEY);
            if (raw) setUser(JSON.parse(raw));
        } catch (e) {
            console.error("Error restaurando sesión:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    async function login(usuario, password) {
        if (!usuario || !password) {
            return { ok: false, error: "Completá usuario y contraseña" };
        }

        try {
            const snap = await get(ref(db, "usuarios"));
            if (!snap.exists()) {
                return { ok: false, error: "No hay usuarios registrados" };
            }

            const usuarios = snap.val();
            const encontrado = Object.values(usuarios).find(
                (u) =>
                    u.usuario?.toLowerCase() === usuario.toLowerCase().trim() &&
                    u.password === password
            );

            if (!encontrado) {
                return { ok: false, error: "Usuario o contraseña incorrectos" };
            }

            const sesion = {
                usuario: encontrado.usuario,
                nombre: encontrado.nombre,
                rol: encontrado.rol,
                loginAt: new Date().toISOString(),
            };

            localStorage.setItem(STORAGE_KEY, JSON.stringify(sesion));
            setUser(sesion);
            return { ok: true, user: sesion };
        } catch (e) {
            console.error("Error en login:", e);
            return { ok: false, error: "Error de conexión. Intentá de nuevo." };
        }
    }

    function logout() {
        localStorage.removeItem(STORAGE_KEY);
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth debe usarse dentro de <AuthProvider>");
    return ctx;
}