import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
} from "@jest/globals";
import { RefreshTokenService } from "../../src/services/refreshTokenService.js";
import { prisma } from "../../src/config/prisma.js";
import {
    cleanupTestData,
    generateTestEmail,
    createTestUser,
    createTestRefreshToken,
} from "../helpers/testHelpers.js";

describe("RefreshTokenService - Unit Tests", () => {
    beforeAll(async () => {
        await cleanupTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    beforeEach(async () => {
        await cleanupTestData();
    });

    describe("generateRefreshToken", () => {
        it("debe generar un token único", () => {
            const token1 = RefreshTokenService.generateRefreshToken();
            const token2 = RefreshTokenService.generateRefreshToken();

            expect(token1).toBeTruthy();
            expect(token2).toBeTruthy();
            expect(token1).not.toBe(token2);
            expect(token1.length).toBe(128); // 64 bytes en hex
        });
    });

    describe("createRefreshToken", () => {
        it("debe crear un refresh token en la base de datos", async () => {
            const user = await createTestUser({
                email: generateTestEmail("createtoken"),
            });

            const token = await RefreshTokenService.createRefreshToken(
                user.id,
                "TestDevice",
                "127.0.0.1",
            );

            expect(token).toHaveProperty("id");
            expect(token).toHaveProperty("token");
            expect(token.userId).toBe(user.id);
            expect(token.deviceInfo).toBe("TestDevice");
            expect(token.ipAddress).toBe("127.0.0.1");
            expect(token.isRevoked).toBe(false);
        });
    });

    describe("validateRefreshToken", () => {
        it("debe validar un token válido", async () => {
            const user = await createTestUser({
                email: generateTestEmail("validate"),
            });
            const refreshToken = await createTestRefreshToken(user.id);

            const result = await RefreshTokenService.validateRefreshToken(
                refreshToken.token,
            );

            expect(result.token).toBe(refreshToken.token);
            expect(result.user).toBeTruthy();
            expect(result.user.id).toBe(user.id);
        });

        it("debe fallar con token inválido", async () => {
            await expect(
                RefreshTokenService.validateRefreshToken("invalid-token"),
            ).rejects.toThrow("Refresh token inválido");
        });

        it("debe fallar y revocar token expirado", async () => {
            const user = await createTestUser({
                email: generateTestEmail("expired"),
            });
            const expiredToken = await createTestRefreshToken(user.id, -1);

            await expect(
                RefreshTokenService.validateRefreshToken(expiredToken.token),
            ).rejects.toThrow("Refresh token expirado");

            const token = await prisma.refreshToken.findUnique({
                where: { token: expiredToken.token },
            });
            expect(token.isRevoked).toBe(true);
        });

        it("debe revocar familia de tokens si se detecta reutilización", async () => {
            const user = await createTestUser({
                email: generateTestEmail("reuse"),
            });
            const token1 = await createTestRefreshToken(user.id);
            const token2 = await createTestRefreshToken(user.id);

            // Revocar token1
            await RefreshTokenService.revokeRefreshToken(token1.token);

            // Intentar usar token1 revocado
            await expect(
                RefreshTokenService.validateRefreshToken(token1.token),
            ).rejects.toThrow("Refresh token revocado");

            // Verificar que token2 también fue revocado
            const token2Data = await prisma.refreshToken.findUnique({
                where: { token: token2.token },
            });
            expect(token2Data.isRevoked).toBe(true);
        });
    });

    describe("revokeRefreshToken", () => {
        it("debe revocar un token", async () => {
            const user = await createTestUser({
                email: generateTestEmail("revoke"),
            });
            const refreshToken = await createTestRefreshToken(user.id);

            await RefreshTokenService.revokeRefreshToken(refreshToken.token);

            const token = await prisma.refreshToken.findUnique({
                where: { token: refreshToken.token },
            });
            expect(token.isRevoked).toBe(true);
        });

        it("debe registrar el token de reemplazo", async () => {
            const user = await createTestUser({
                email: generateTestEmail("replace"),
            });
            const refreshToken = await createTestRefreshToken(user.id);
            const newToken = "new-token-replacement";

            await RefreshTokenService.revokeRefreshToken(
                refreshToken.token,
                newToken,
            );

            const token = await prisma.refreshToken.findUnique({
                where: { token: refreshToken.token },
            });
            expect(token.replacedBy).toBe(newToken);
        });
    });

    describe("cleanExpiredTokens", () => {
        it("debe eliminar tokens expirados", async () => {
            const user = await createTestUser({
                email: generateTestEmail("cleanup"),
            });

            await createTestRefreshToken(user.id); // Token válido
            const expired1 = await createTestRefreshToken(user.id, -1);
            const expired2 = await createTestRefreshToken(user.id, -2);

            await RefreshTokenService.cleanExpiredTokens();

            const allTokens = await prisma.refreshToken.findMany({
                where: { userId: user.id },
            });

            expect(allTokens.length).toBe(1);
        });
    });

    describe("revokeAllUserTokens", () => {
        it("debe revocar todos los tokens activos de un usuario", async () => {
            const user = await createTestUser({
                email: generateTestEmail("revokeall"),
            });

            await createTestRefreshToken(user.id);
            await createTestRefreshToken(user.id);
            await createTestRefreshToken(user.id);

            await RefreshTokenService.revokeAllUserTokens(user.id);

            const activeTokens = await prisma.refreshToken.findMany({
                where: {
                    userId: user.id,
                    isRevoked: false,
                },
            });

            expect(activeTokens.length).toBe(0);
        });
    });

    describe("getUserActiveTokens", () => {
        it("debe retornar solo tokens activos del usuario", async () => {
            const user = await createTestUser({
                email: generateTestEmail("active"),
            });

            const active1 = await createTestRefreshToken(user.id);
            const active2 = await createTestRefreshToken(user.id);
            await createTestRefreshToken(user.id, -1); // Expirado

            const revokedToken = await createTestRefreshToken(user.id);
            await RefreshTokenService.revokeRefreshToken(revokedToken.token);

            const activeTokens = await RefreshTokenService.getUserActiveTokens(
                user.id,
            );

            expect(activeTokens.length).toBe(2);
            const tokenIds = activeTokens.map((t) => t.id);
            expect(tokenIds).toContain(active1.id);
            expect(tokenIds).toContain(active2.id);
        });
    });
});
