import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../config/prisma.js";
import { config } from "../config/config.js";
import { RefreshTokenService } from "./refreshTokenService.js";

export class AuthService {
    // Genera un access token JWT
    static generateAccessToken(userId) {
        return jwt.sign({ userId }, config.jwtSecret, {
            expiresIn: config.jwtExpiresIn,
        });
    }

    static async register(userData, deviceInfo = null, ipAddress = null) {
        const { email, password, name, lastname } = userData;

        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            const error = new Error("El usuario ya existe");
            error.statusCode = 409;
            throw error;
        }

        // Hash de la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear usuario
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
                lastname: lastname || "",
            },
            select: {
                id: true,
                email: true,
                name: true,
                lastname: true,
                createdAt: true,
            },
        });

        // Generar tokens
        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = await RefreshTokenService.createRefreshToken(
            user.id,
            deviceInfo,
            ipAddress,
        );

        return {
            user,
            accessToken,
            refreshToken: refreshToken.token,
        };
    }

    static async login(credentials, deviceInfo = null, ipAddress = null) {
        const { email, password } = credentials;

        // Buscar usuario
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            const error = new Error("Credenciales inválidas");
            error.statusCode = 401;
            throw error;
        }

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            const error = new Error("Credenciales inválidas");
            error.statusCode = 401;
            throw error;
        }

        // Generar tokens
        const accessToken = this.generateAccessToken(user.id);
        const refreshToken = await RefreshTokenService.createRefreshToken(
            user.id,
            deviceInfo,
            ipAddress,
        );

        // Retornar usuario sin contraseña
        const { password: _, ...userWithoutPassword } = user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken: refreshToken.token,
        };
    }

    static async refreshAccessToken(
        refreshTokenString,
        deviceInfo = null,
        ipAddress = null,
    ) {
        // Validar el refresh token
        const refreshToken =
            await RefreshTokenService.validateRefreshToken(refreshTokenString);

        // Generar nuevo access token
        const accessToken = this.generateAccessToken(refreshToken.userId);

        // Rotar el refresh token (best practice)
        const newRefreshToken = await RefreshTokenService.createRefreshToken(
            refreshToken.userId,
            deviceInfo,
            ipAddress,
        );

        // Revocar el refresh token antiguo
        await RefreshTokenService.revokeRefreshToken(
            refreshTokenString,
            newRefreshToken.token,
        );

        // Retornar usuario sin contraseña
        const { password: _, ...userWithoutPassword } = refreshToken.user;

        return {
            user: userWithoutPassword,
            accessToken,
            refreshToken: newRefreshToken.token,
        };
    }

    static async logout(refreshTokenString) {
        if (refreshTokenString) {
            await RefreshTokenService.revokeRefreshToken(refreshTokenString);
        }
        return { message: "Logout exitoso" };
    }

    static async logoutAll(userId) {
        await RefreshTokenService.revokeAllUserTokens(userId);
        return { message: "Se han cerrado todas las sesiones" };
    }

    static async getMe(userId) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                lastname: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            throw error;
        }

        return user;
    }

    static async getActiveSessions(userId) {
        return await RefreshTokenService.getUserActiveTokens(userId);
    }
}
