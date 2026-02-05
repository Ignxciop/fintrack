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

            if (response.data.requiresVerification) {
                return { requiresVerification: true };
            }

            const { user, accessToken, refreshToken } = response.data;
            if (accessToken && refreshToken) {
                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", refreshToken);
                setUser(user);
            }
        } catch (error) {
            throw error;
        }
    };

    const logout = async () => {
        try {
            await authService.logout();
        } catch (error) {
            logger.error("Error al cerrar sesión:", error);
        } finally {
            // Limpiar siempre el estado local y localStorage
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            setUser(null);
        }
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
