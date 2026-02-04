import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
} from "@jest/globals";
import { AuthService } from "../../src/services/authService.js";
import { RefreshTokenService } from "../../src/services/refreshTokenService.js";
import { prisma } from "../../src/config/prisma.js";
import {
    cleanupTestData,
    generateTestEmail,
    createTestUser,
    createTestRefreshToken,
} from "../helpers/testHelpers.js";

describe("AuthService - Unit Tests", () => {
    beforeAll(async () => {
        // Limpiar datos de prueba antes de comenzar
        await cleanupTestData();
    });

    afterAll(async () => {
        // Limpiar datos de prueba después de terminar
        await cleanupTestData();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        // Limpiar entre cada test
        await cleanupTestData();
    });

    describe("register", () => {
        it("debe registrar un nuevo usuario exitosamente", async () => {
            const email = generateTestEmail("register");
            const userData = {
                email,
                password: "password123",
                name: "Test",
                lastname: "User",
            };

            const result = await AuthService.register(userData);

            expect(result).toHaveProperty("user");
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result.user.email).toBe(email);
            expect(result.user).not.toHaveProperty("password");
        });

        it("debe fallar si el usuario ya existe", async () => {
            const email = generateTestEmail("duplicate");
            const userData = {
                email,
                password: "password123",
                name: "Test",
                lastname: "User",
            };

            await AuthService.register(userData);

            await expect(AuthService.register(userData)).rejects.toThrow(
                "El usuario ya existe",
            );
        });

        it("debe hashear la contraseña", async () => {
            const email = generateTestEmail("hash");
            const userData = {
                email,
                password: "password123",
                name: "Test",
                lastname: "User",
            };

            await AuthService.register(userData);

            const user = await prisma.user.findUnique({ where: { email } });
            expect(user.password).not.toBe("password123");
            expect(user.password).toMatch(/^\$2[aby]\$.{56}$/); // bcrypt format
        });
    });

    describe("login", () => {
        it("debe iniciar sesión con credenciales válidas", async () => {
            const email = generateTestEmail("login");
            const password = "password123";

            // Crear usuario primero
            await createTestUser({ email, password });

            const result = await AuthService.login({ email, password });

            expect(result).toHaveProperty("user");
            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result.user.email).toBe(email);
        });

        it("debe fallar con email inválido", async () => {
            await expect(
                AuthService.login({
                    email: generateTestEmail("nonexistent"),
                    password: "password123",
                }),
            ).rejects.toThrow("Credenciales inválidas");
        });

        it("debe fallar con contraseña incorrecta", async () => {
            const email = generateTestEmail("wrongpass");
            await createTestUser({ email, password: "correctpass" });

            await expect(
                AuthService.login({
                    email,
                    password: "wrongpassword",
                }),
            ).rejects.toThrow("Credenciales inválidas");
        });
    });

    describe("refreshAccessToken", () => {
        it("debe renovar el access token con un refresh token válido", async () => {
            const user = await createTestUser({
                email: generateTestEmail("refresh"),
            });
            const refreshToken = await createTestRefreshToken(user.id);

            const result = await AuthService.refreshAccessToken(
                refreshToken.token,
            );

            expect(result).toHaveProperty("accessToken");
            expect(result).toHaveProperty("refreshToken");
            expect(result.user.id).toBe(user.id);

            // El token viejo debe estar revocado
            const oldToken = await prisma.refreshToken.findUnique({
                where: { token: refreshToken.token },
            });
            expect(oldToken.isRevoked).toBe(true);
        });

        it("debe fallar con refresh token inválido", async () => {
            await expect(
                AuthService.refreshAccessToken("invalid-token-12345"),
            ).rejects.toThrow("Refresh token inválido");
        });

        it("debe fallar con refresh token expirado", async () => {
            const user = await createTestUser({
                email: generateTestEmail("expired"),
            });
            const expiredToken = await createTestRefreshToken(user.id, -1); // Expirado hace 1 día

            await expect(
                AuthService.refreshAccessToken(expiredToken.token),
            ).rejects.toThrow("Refresh token expirado");
        });

        it("debe revocar toda la familia de tokens si se detecta reutilización", async () => {
            const user = await createTestUser({
                email: generateTestEmail("reuse"),
            });
            const refreshToken = await createTestRefreshToken(user.id);

            // Primer uso (válido)
            await AuthService.refreshAccessToken(refreshToken.token);

            // Segundo uso (reuso detectado)
            await expect(
                AuthService.refreshAccessToken(refreshToken.token),
            ).rejects.toThrow("Refresh token revocado");

            // Verificar que todos los tokens del usuario están revocados
            const activeTokens = await prisma.refreshToken.findMany({
                where: {
                    userId: user.id,
                    isRevoked: false,
                },
            });
            expect(activeTokens.length).toBe(0);
        });
    });

    describe("logout", () => {
        it("debe revocar el refresh token al hacer logout", async () => {
            const user = await createTestUser({
                email: generateTestEmail("logout"),
            });
            const refreshToken = await createTestRefreshToken(user.id);

            await AuthService.logout(refreshToken.token);

            const token = await prisma.refreshToken.findUnique({
                where: { token: refreshToken.token },
            });
            expect(token.isRevoked).toBe(true);
        });
    });

    describe("logoutAll", () => {
        it("debe revocar todos los tokens del usuario", async () => {
            const user = await createTestUser({
                email: generateTestEmail("logoutall"),
            });

            // Crear múltiples refresh tokens
            await createTestRefreshToken(user.id);
            await createTestRefreshToken(user.id);
            await createTestRefreshToken(user.id);

            await AuthService.logoutAll(user.id);

            const activeTokens = await prisma.refreshToken.findMany({
                where: {
                    userId: user.id,
                    isRevoked: false,
                },
            });
            expect(activeTokens.length).toBe(0);
        });
    });

    describe("getMe", () => {
        it("debe retornar información del usuario", async () => {
            const user = await createTestUser({
                email: generateTestEmail("getme"),
            });

            const result = await AuthService.getMe(user.id);

            expect(result.id).toBe(user.id);
            expect(result.email).toBe(user.email);
            expect(result).not.toHaveProperty("password");
        });

        it("debe fallar con ID inválido", async () => {
            await expect(
                AuthService.getMe("00000000-0000-0000-0000-000000000000"),
            ).rejects.toThrow("Usuario no encontrado");
        });
    });

    describe("getActiveSessions", () => {
        it("debe retornar sesiones activas del usuario", async () => {
            const user = await createTestUser({
                email: generateTestEmail("sessions"),
            });

            await createTestRefreshToken(user.id);
            await createTestRefreshToken(user.id);

            const sessions = await AuthService.getActiveSessions(user.id);

            expect(sessions.length).toBe(2);
            expect(sessions[0]).toHaveProperty("deviceInfo");
            expect(sessions[0]).toHaveProperty("createdAt");
        });

        it("no debe retornar tokens expirados o revocados", async () => {
            const user = await createTestUser({
                email: generateTestEmail("sessions2"),
            });

            const activeToken = await createTestRefreshToken(user.id);
            await createTestRefreshToken(user.id, -1); // Expirado
            const revokedToken = await createTestRefreshToken(user.id);

            // Revocar uno
            await RefreshTokenService.revokeRefreshToken(revokedToken.token);

            const sessions = await AuthService.getActiveSessions(user.id);

            expect(sessions.length).toBe(1);
            expect(sessions[0].id).toBe(activeToken.id);
        });
    });
});
