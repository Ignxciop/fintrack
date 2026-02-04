import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { sendVerificationEmail } from "./emailService.js";

class VerificationService {
    /**
     * Generar código de verificación de 6 dígitos
     */
    static generateCode() {
        return crypto.randomInt(100000, 999999).toString();
    }

    /**
     * Crear código de verificación para un usuario
     */
    static async createVerification(userId) {
        // Invalidar códigos anteriores del usuario
        await prisma.verificationCode.updateMany({
            where: {
                userId,
                isUsed: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            data: {
                isUsed: true,
            },
        });

        // Generar nuevo código
        const code = this.generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutos

        const verification = await prisma.verificationCode.create({
            data: {
                code,
                userId,
                expiresAt,
            },
        });

        // Obtener email del usuario para enviar el código
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        // Enviar email con el código
        if (user?.email) {
            await sendVerificationEmail(user.email, code);
        }

        return verification;
    }

    /**
     * Validar código de verificación
     */
    static async validateCode(userId, code) {
        const verification = await prisma.verificationCode.findFirst({
            where: {
                userId,
                code,
                isUsed: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
        });

        if (!verification) {
            const error = new Error(
                "Código inválido o expirado. Solicita uno nuevo.",
            );
            error.statusCode = 400;
            throw error;
        }

        // Marcar como usado
        await prisma.verificationCode.update({
            where: { id: verification.id },
            data: { isUsed: true },
        });

        // Marcar usuario como verificado
        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });

        return true;
    }

    /**
     * Reenviar código de verificación
     */
    static async resendCode(email) {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            const error = new Error("Usuario no encontrado");
            error.statusCode = 404;
            throw error;
        }

        if (user.isVerified) {
            const error = new Error("El usuario ya está verificado");
            error.statusCode = 400;
            throw error;
        }

        // Crear nuevo código
        return await this.createVerification(user.id);
    }

    /**
     * Limpiar códigos expirados (tarea de mantenimiento)
     */
    static async cleanExpiredCodes() {
        const result = await prisma.verificationCode.deleteMany({
            where: {
                expiresAt: {
                    lt: new Date(),
                },
            },
        });

        return result.count;
    }

    /**
     * Obtener usuario por email para verificación
     */
    static async getUserByEmail(email) {
        return await prisma.user.findUnique({
            where: { email },
            select: {
                id: true,
                email: true,
                isVerified: true,
            },
        });
    }
}

export default VerificationService;
