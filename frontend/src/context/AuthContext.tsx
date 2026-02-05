import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { authService } from "../services/authService";
import type { User } from "../services/authService";
import logger from "../lib/logger";

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        password: string,
        name: string,
        lastname: string,
    ) => Promise<{ requiresVerification?: boolean } | void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
    children,
}) => {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Verificar si hay un usuario autenticado al cargar la app
    useEffect(() => {
        const initAuth = async () => {
            const token = localStorage.getItem("accessToken");
            if (token) {
                try {
                    const userData = await authService.getMe();
                    setUser(userData);
                } catch (error) {
                    logger.error("Error al obtener usuario:", error);
                    localStorage.removeItem("accessToken");
                    localStorage.removeItem("refreshToken");
                }
            }
            setIsLoading(false);
        };

        initAuth();
    }, []);

    const login = async (email: string, password: string) => {
        try {
            const response = await authService.login({ email, password });
            const { user, accessToken, refreshToken } = response.data;

            if (accessToken && refreshToken) {
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                setUser(user);
            }
        } catch (error) {
            // Re-lanzar el error para que LoginPage pueda manejarlo
            throw error;
        }
    };

    const register = async (
        email: string,
        password: string,
        name: string,
        lastname: string,
    ) => {
        try {
            const response = await authService.register({
                email,
                password,
                name,
                lastname,
            });

            // Si requiere verificación, retornar para que RegisterPage maneje la redirección
            if (response.data.requiresVerification) {
                return { requiresVerification: true };
            }

            // Si no requiere verificación, guardar tokens y usuario
            const { user, accessToken, refreshToken } = response.data;
            if (accessToken && refreshToken) {
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                setUser(user);
            }
        } catch (error) {
            // Re-lanzar el error para que RegisterPage pueda manejarlo
            throw error;
        }
    };

    const logout = async () => {
        await authService.logout();
        setUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth debe ser usado dentro de un AuthProvider");
    }
    return context;
};
