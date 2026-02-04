import { prisma } from "../../src/config/prisma.js";

/**
 * Limpia todos los datos de prueba (con sufijo _test en email)
 */
export async function cleanupTestData() {
    try {
        // Eliminar tokens de usuarios de prueba
        await prisma.refreshToken.deleteMany({
            where: {
                user: {
                    email: {
                        contains: "_test@",
                    },
                },
            },
        });

        // Eliminar usuarios de prueba
        await prisma.user.deleteMany({
            where: {
                email: {
                    contains: "_test@",
                },
            },
        });
    } catch (error) {
        console.error("Error al limpiar datos de prueba:", error);
    }
}

/**
 * Genera un email único para pruebas
 */
export function generateTestEmail(prefix = "user") {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${prefix}_${timestamp}_${random}_test@example.com`;
}

/**
 * Crea un usuario de prueba
 */
export async function createTestUser(data = {}) {
    const email = data.email || generateTestEmail();
    const password = data.password || "password123";
    const name = data.name || "Test User";
    const lastname = data.lastname || "Test Lastname";

    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword,
            name,
            lastname,
        },
    });

    return { ...user, plainPassword: password };
}

/**
 * Crea un refresh token de prueba
 */
export async function createTestRefreshToken(userId, expiresInDays = 7) {
    const crypto = await import("crypto");
    const token = crypto.randomBytes(64).toString("hex");
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    return await prisma.refreshToken.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });
}

/**
 * Espera un tiempo determinado (útil para tests asíncronos)
 */
export function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
