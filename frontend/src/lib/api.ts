import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "/api";

// Crear instancia de axios
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Interceptor para agregar el token a cada petición
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("accessToken");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Interceptor para renovar el token automáticamente
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Si el error es 401 y no hemos intentado renovar el token
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                if (!refreshToken) {
                    throw new Error("No refresh token");
                }

                const { data } = await axios.post(`${API_URL}/auth/refresh`, {
                    refreshToken,
                });

                const { accessToken, refreshToken: newRefreshToken } =
                    data.data;

                localStorage.setItem("accessToken", accessToken);
                localStorage.setItem("refreshToken", newRefreshToken);

                originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                return api(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("refreshToken");
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);

export default api;
