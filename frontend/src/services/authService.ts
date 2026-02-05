import api from "../lib/api";

export interface User {
    id: string;
    email: string;
    name: string;
    lastname: string;
    isVerified: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AuthResponse {
    success: boolean;
    message: string;
    data: {
        user: User;
        accessToken?: string;
        refreshToken?: string;
        requiresVerification?: boolean;
    };
}

export interface RegisterData {
    email: string;
    password: string;
    name: string;
    lastname: string;
}

export interface LoginData {
    email: string;
    password: string;
}

export const authService = {
    // Registro de usuario
    register: async (data: RegisterData): Promise<AuthResponse> => {
        const response = await api.post("/auth/register", data);
        return response.data;
    },

    login: async (data: LoginData): Promise<AuthResponse> => {
        const response = await api.post("/auth/login", data);
        return response.data;
    },

    logout: async (): Promise<void> => {
        const refreshToken = localStorage.getItem("refreshToken");
        if (refreshToken) {
            await api.post("/auth/logout", { refreshToken });
        }
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
    },

    getMe: async (): Promise<User> => {
        const response = await api.get("/auth/me");
        return response.data.data.user;
    },

    refreshToken: async (refreshToken: string): Promise<AuthResponse> => {
        const response = await api.post("/auth/refresh", { refreshToken });
        return response.data;
    },

    verifyEmail: async (email: string, code: string): Promise<AuthResponse> => {
        const response = await api.post("/auth/verify-email", { email, code });
        return response.data;
    },

    resendVerification: async (
        email: string,
    ): Promise<{ success: boolean; message: string }> => {
        const response = await api.post("/auth/resend-verification", { email });
        return response.data;
    },
};
