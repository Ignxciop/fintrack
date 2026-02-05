import crypto from "crypto";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { config } from "../config/config.js";

export class RefreshTokenService {
    // Genera un refresh token aleatorio y seguro
    static generateRefreshToken() {
        return crypto.randomBytes(64).toString("hex");
    }

    // Crea un refresh token en la base de datos
    static async createRefreshToken(
        userId,
        deviceInfo = null,
        ipAddress = null,
    ) {
        const token = this.generateRefreshToken();
        const expiresAt = new Date();
        const daysToExpire = parseInt(
            config.jwtRefreshExpiresIn.replace("d", ""),
        );
        expiresAt.setDate(expiresAt.getDate() + daysToExpire);

        const refreshToken = await prisma.refreshToken.create({
            data: {
                token,
                userId,
                expiresAt,
                deviceInfo,
                ipAddress,
            },
        });

        return refreshToken;
    }

    // Valida un refresh token
    static async validateRefreshToken(token) {
        const refreshToken = await prisma.refreshToken.findUnique({
            where: { token },
            include: { user: true },
        });

        if (!refreshToken) {
            const error = new Error("Refresh token inválido");
            error.statusCode = 401;
            throw error;
        }

        // Verificar si ha expirado
        if (new Date() > refreshToken.expiresAt) {
            await this.revokeRefreshToken(token);
            const error = new Error("Refresh token expirado");
            error.statusCode = 401;
            throw error;
        }

        if (refreshToken.isRevoked) {
            if (refreshToken.replacedBy) {
                const replacementToken = await prisma.refreshToken.findUnique({
                    where: { token: refreshToken.replacedBy },
                    include: { user: true },
                });

                if (
                    replacementToken &&
                    !replacementToken.isRevoked &&
                    new Date() <= replacementToken.expiresAt
                ) {
                    return replacementToken;
                }
            }

            await this.revokeTokenFamily(token);
            const error = new Error(
                "Refresh token revocado. Por seguridad, se han revocado todos tus tokens.",
            );
            error.statusCode = 401;
            throw error;
        }

        return refreshToken;
    }

    // Revoca un refresh token
    static async revokeRefreshToken(token, replacedBy = null) {
        await prisma.refreshToken.update({
            where: { token },
            data: {
                isRevoked: true,
                replacedBy,
            },
        });
    }

    // Revoca toda la familia de tokens (en caso de detección de reutilización)
    static async revokeTokenFamily(token) {
        const currentToken = await prisma.refreshToken.findUnique({
            where: { token },
        });

        if (!currentToken) return;

        // Revocar el token actual
        await this.revokeRefreshToken(token);

        // Revocar todos los tokens del mismo usuario creados después de este
        await prisma.refreshToken.updateMany({
            where: {
                userId: currentToken.userId,
                createdAt: {
                    gte: currentToken.createdAt,
                },
                isRevoked: false,
            },
            data: {
                isRevoked: true,
            },
        });
    }

    // Limpia tokens expirados
    static async cleanExpiredTokens() {
        await prisma.refreshToken.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });
    }

    // Revoca todos los tokens de un usuario
    static async revokeAllUserTokens(userId) {
        await prisma.refreshToken.updateMany({
            where: {
                userId,
                isRevoked: false,
            },
            data: {
                isRevoked: true,
            },
        });
    }

    // Obtiene todos los tokens activos de un usuario
    static async getUserActiveTokens(userId) {
        return await prisma.refreshToken.findMany({
            where: {
                userId,
                isRevoked: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            select: {
                id: true,
                deviceInfo: true,
                ipAddress: true,
                createdAt: true,
                expiresAt: true,
            },
        });
    }
}
