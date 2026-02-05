import crypto from "crypto";
import { prisma } from "../config/prisma.js";
import { sendVerificationEmail } from "./emailService.js";

class VerificationService {
    static generateCode() {
        return crypto.randomInt(100000, 999999).toString();
    }

    static async createVerification(userId) {
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

        const code = this.generateCode();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const verification = await prisma.verificationCode.create({
            data: {
                code,
                userId,
                expiresAt,
            },
        });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true },
        });

        if (user?.email) {
            await sendVerificationEmail(user.email, code);
        }

        return verification;
    }

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

        await prisma.verificationCode.update({
            where: { id: verification.id },
            data: { isUsed: true },
        });

        await prisma.user.update({
            where: { id: userId },
            data: { isVerified: true },
        });

        return true;
    }

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

        return await this.createVerification(user.id);
    }

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
