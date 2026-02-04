import VerificationService from "../../src/services/verificationService.js";
import { prisma } from "../../src/config/prisma.js";
import { generateTestEmail, cleanupTestData } from "../helpers/testHelpers.js";

describe("VerificationService", () => {
    beforeEach(async () => {
        await cleanupTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
        await prisma.$disconnect();
    });

    describe("generateCode", () => {
        it("debe generar un código de 6 dígitos", () => {
            const code = VerificationService.generateCode();
            expect(code).toHaveLength(6);
            expect(Number(code)).toBeGreaterThanOrEqual(100000);
            expect(Number(code)).toBeLessThanOrEqual(999999);
        });
    });

    describe("createVerification", () => {
        it("debe crear un código de verificación para un usuario", async () => {
            const user = await prisma.user.create({
                data: {
                    email: generateTestEmail(),
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            const verification = await VerificationService.createVerification(
                user.id,
            );

            expect(verification).toHaveProperty("code");
            expect(verification).toHaveProperty("userId", user.id);
            expect(verification.expiresAt).toBeInstanceOf(Date);

            // Verificar que el código expira en ~5 minutos
            const expiresIn = verification.expiresAt.getTime() - Date.now();
            expect(expiresIn).toBeGreaterThan(4.9 * 60 * 1000);
            expect(expiresIn).toBeLessThan(5.1 * 60 * 1000);
        });

        it("debe invalidar códigos anteriores al crear uno nuevo", async () => {
            const user = await prisma.user.create({
                data: {
                    email: generateTestEmail(),
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            const firstCode = await VerificationService.createVerification(
                user.id,
            );
            const secondCode = await VerificationService.createVerification(
                user.id,
            );

            const firstCodeInDb = await prisma.verificationCode.findUnique({
                where: { id: firstCode.id },
            });

            expect(firstCodeInDb.isUsed).toBe(true);
            expect(secondCode.isUsed).toBe(false);
        });
    });

    describe("validateCode", () => {
        it("debe validar código correcto y marcar usuario como verificado", async () => {
            const user = await prisma.user.create({
                data: {
                    email: generateTestEmail(),
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            const verification = await VerificationService.createVerification(
                user.id,
            );

            await expect(
                VerificationService.validateCode(user.id, verification.code),
            ).resolves.toBe(true);

            const updatedUser = await prisma.user.findUnique({
                where: { id: user.id },
            });

            expect(updatedUser.isVerified).toBe(true);
        });

        it("debe rechazar código inválido", async () => {
            const user = await prisma.user.create({
                data: {
                    email: generateTestEmail(),
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            await expect(
                VerificationService.validateCode(user.id, "999999"),
            ).rejects.toThrow("Código inválido o expirado");
        });

        it("debe rechazar código expirado", async () => {
            const user = await prisma.user.create({
                data: {
                    email: generateTestEmail(),
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            const verification = await prisma.verificationCode.create({
                data: {
                    code: "123456",
                    userId: user.id,
                    expiresAt: new Date(Date.now() - 1000), // Expirado hace 1 segundo
                },
            });

            await expect(
                VerificationService.validateCode(user.id, verification.code),
            ).rejects.toThrow("Código inválido o expirado");
        });

        it("debe rechazar código ya usado", async () => {
            const user = await prisma.user.create({
                data: {
                    email: generateTestEmail(),
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            const verification = await VerificationService.createVerification(
                user.id,
            );

            // Usar el código una vez
            await VerificationService.validateCode(user.id, verification.code);

            // Intentar usarlo de nuevo
            await expect(
                VerificationService.validateCode(user.id, verification.code),
            ).rejects.toThrow("Código inválido o expirado");
        });
    });

    describe("resendCode", () => {
        it("debe reenviar código para usuario no verificado", async () => {
            const email = generateTestEmail();
            const user = await prisma.user.create({
                data: {
                    email,
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            const verification = await VerificationService.resendCode(email);

            expect(verification).toHaveProperty("code");
            expect(verification.userId).toBe(user.id);
        });

        it("debe rechazar reenvío para usuario no encontrado", async () => {
            await expect(
                VerificationService.resendCode("noexiste_test@example.com"),
            ).rejects.toThrow("Usuario no encontrado");
        });

        it("debe rechazar reenvío para usuario ya verificado", async () => {
            const email = generateTestEmail();
            await prisma.user.create({
                data: {
                    email,
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: true,
                },
            });

            await expect(VerificationService.resendCode(email)).rejects.toThrow(
                "El usuario ya está verificado",
            );
        });
    });

    describe("cleanExpiredCodes", () => {
        it("debe eliminar códigos expirados", async () => {
            const user = await prisma.user.create({
                data: {
                    email: generateTestEmail(),
                    password: "hashedpassword",
                    name: "Test",
                    lastname: "User",
                    isVerified: false,
                },
            });

            // Crear código expirado
            await prisma.verificationCode.create({
                data: {
                    code: "111111",
                    userId: user.id,
                    expiresAt: new Date(Date.now() - 10000),
                },
            });

            // Crear código válido
            await prisma.verificationCode.create({
                data: {
                    code: "222222",
                    userId: user.id,
                    expiresAt: new Date(Date.now() + 10000),
                },
            });

            const count = await VerificationService.cleanExpiredCodes();

            expect(count).toBe(1);

            const remainingCodes = await prisma.verificationCode.findMany({
                where: { userId: user.id },
            });

            expect(remainingCodes).toHaveLength(1);
            expect(remainingCodes[0].code).toBe("222222");
        });
    });
});
