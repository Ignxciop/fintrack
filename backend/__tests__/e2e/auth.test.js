import {
    describe,
    it,
    expect,
    beforeAll,
    afterAll,
    beforeEach,
} from "@jest/globals";
import request from "supertest";
import app from "../setup/testApp.js";
import { prisma } from "../../src/config/prisma.js";
import {
    cleanupTestData,
    generateTestEmail,
    createTestUser,
} from "../helpers/testHelpers.js";

describe("Auth API - E2E Tests", () => {
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

    describe("POST /api/auth/register", () => {
        it("debe registrar un nuevo usuario y retornar tokens", async () => {
            const email = generateTestEmail("register");
            const userData = {
                email,
                password: "password123",
                name: "Test",
                lastname: "User",
            };

            const response = await request(app)
                .post("/api/auth/register")
                .send(userData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("accessToken");
            expect(response.body.data).toHaveProperty("refreshToken");
            expect(response.body.data.user.email).toBe(email);
            expect(response.body.data.user).not.toHaveProperty("password");
        });

        it("debe fallar con email duplicado", async () => {
            const email = generateTestEmail("duplicate");
            const userData = {
                email,
                password: "password123",
                name: "Test",
                lastname: "User",
            };

            await request(app).post("/api/auth/register").send(userData);

            const response = await request(app)
                .post("/api/auth/register")
                .send(userData)
                .expect(409);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("El usuario ya existe");
        });

        it("debe fallar con datos inválidos", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({
                    email: "invalid-email",
                    password: "123", // muy corta
                    name: "T", // muy corto
                })
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Errores de validación");
            expect(response.body.errors).toBeTruthy();
        });

        it("debe fallar sin campos requeridos", async () => {
            const response = await request(app)
                .post("/api/auth/register")
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/auth/login", () => {
        it("debe iniciar sesión con credenciales válidas", async () => {
            const email = generateTestEmail("login");
            const password = "password123";
            await createTestUser({ email, password });

            const response = await request(app)
                .post("/api/auth/login")
                .send({ email, password })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("user");
            expect(response.body.data).toHaveProperty("accessToken");
            expect(response.body.data).toHaveProperty("refreshToken");
            expect(response.body.data.user.email).toBe(email);
        });

        it("debe fallar con email inexistente", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: generateTestEmail("nonexistent"),
                    password: "password123",
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Credenciales inválidas");
        });

        it("debe fallar con contraseña incorrecta", async () => {
            const email = generateTestEmail("wrongpass");
            await createTestUser({ email, password: "correctpassword" });

            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email,
                    password: "wrongpassword",
                })
                .expect(401);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Credenciales inválidas");
        });

        it("debe fallar con datos inválidos", async () => {
            const response = await request(app)
                .post("/api/auth/login")
                .send({
                    email: "not-an-email",
                    password: "",
                })
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/auth/refresh", () => {
        it("debe renovar tokens con un refresh token válido", async () => {
            const email = generateTestEmail("refresh");
            const password = "password123";
            await createTestUser({ email, password });

            // Login para obtener tokens
            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({ email, password });

            const { refreshToken } = loginResponse.body.data;

            // Usar refresh token
            const response = await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken })
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty("accessToken");
            expect(response.body.data).toHaveProperty("refreshToken");
            expect(response.body.data.refreshToken).not.toBe(refreshToken); // Debe ser un nuevo token
        });

        it("debe fallar sin refresh token", async () => {
            const response = await request(app)
                .post("/api/auth/refresh")
                .send({})
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe("Refresh token requerido");
        });

        it("debe fallar con refresh token inválido", async () => {
            const response = await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken: "invalid-token-12345" })
                .expect(401);

            expect(response.body.success).toBe(false);
        });

        it("debe fallar al reutilizar un refresh token", async () => {
            const email = generateTestEmail("reuse");
            const password = "password123";
            await createTestUser({ email, password });

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({ email, password });

            const { refreshToken } = loginResponse.body.data;

            // Primer uso (válido)
            await request(app).post("/api/auth/refresh").send({ refreshToken });

            // Segundo uso (reuso - debe fallar)
            const response = await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken })
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/auth/logout", () => {
        it("debe cerrar sesión exitosamente", async () => {
            const email = generateTestEmail("logout");
            const password = "password123";
            await createTestUser({ email, password });

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({ email, password });

            const { refreshToken } = loginResponse.body.data;

            const response = await request(app)
                .post("/api/auth/logout")
                .send({ refreshToken })
                .expect(200);

            expect(response.body.success).toBe(true);

            // Intentar usar el token después del logout
            await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken })
                .expect(401);
        });
    });

    describe("GET /api/auth/me", () => {
        it("debe retornar información del usuario autenticado", async () => {
            const email = generateTestEmail("getme");
            const password = "password123";
            await createTestUser({ email, password });

            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({ email, password });

            const { accessToken } = loginResponse.body.data;

            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(email);
            expect(response.body.data.user).not.toHaveProperty("password");
        });

        it("debe fallar sin token de autenticación", async () => {
            const response = await request(app).get("/api/auth/me").expect(401);

            expect(response.body.success).toBe(false);
        });

        it("debe fallar con token inválido", async () => {
            const response = await request(app)
                .get("/api/auth/me")
                .set("Authorization", "Bearer invalid-token")
                .expect(401);

            expect(response.body.success).toBe(false);
        });
    });

    describe("POST /api/auth/logout-all", () => {
        it("debe cerrar todas las sesiones del usuario", async () => {
            const email = generateTestEmail("logoutall");
            const password = "password123";
            await createTestUser({ email, password });

            // Crear múltiples sesiones
            const login1 = await request(app)
                .post("/api/auth/login")
                .send({ email, password });
            const login2 = await request(app)
                .post("/api/auth/login")
                .send({ email, password });

            const { accessToken } = login1.body.data;
            const { refreshToken: refreshToken1 } = login1.body.data;
            const { refreshToken: refreshToken2 } = login2.body.data;

            // Cerrar todas las sesiones
            const response = await request(app)
                .post("/api/auth/logout-all")
                .set("Authorization", `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);

            // Intentar usar ambos refresh tokens
            await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken: refreshToken1 })
                .expect(401);

            await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken: refreshToken2 })
                .expect(401);
        });
    });

    describe("GET /api/auth/sessions", () => {
        it("debe retornar sesiones activas del usuario", async () => {
            const email = generateTestEmail("sessions");
            const password = "password123";
            await createTestUser({ email, password });

            // Crear múltiples sesiones
            const login1 = await request(app)
                .post("/api/auth/login")
                .send({ email, password });
            await request(app)
                .post("/api/auth/login")
                .send({ email, password });

            const { accessToken } = login1.body.data;

            const response = await request(app)
                .get("/api/auth/sessions")
                .set("Authorization", `Bearer ${accessToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.sessions).toBeTruthy();
            expect(response.body.data.sessions.length).toBeGreaterThanOrEqual(
                2,
            );
        });
    });

    describe("Full Auth Flow", () => {
        it("debe completar un flujo completo de autenticación", async () => {
            const email = generateTestEmail("fullflow");
            const password = "password123";

            // 1. Registro
            const registerResponse = await request(app)
                .post("/api/auth/register")
                .send({
                    email,
                    password,
                    name: "Test",
                    lastname: "User",
                })
                .expect(201);

            expect(registerResponse.body.data).toHaveProperty("accessToken");
            let { accessToken, refreshToken } = registerResponse.body.data;

            // 2. Obtener información del usuario
            const meResponse = await request(app)
                .get("/api/auth/me")
                .set("Authorization", `Bearer ${accessToken}`)
                .expect(200);

            expect(meResponse.body.data.user.email).toBe(email);

            // 3. Renovar tokens
            const refreshResponse = await request(app)
                .post("/api/auth/refresh")
                .send({ refreshToken })
                .expect(200);

            accessToken = refreshResponse.body.data.accessToken;
            refreshToken = refreshResponse.body.data.refreshToken;

            // 4. Logout
            await request(app)
                .post("/api/auth/logout")
                .send({ refreshToken })
                .expect(200);

            // 5. Login nuevamente
            const loginResponse = await request(app)
                .post("/api/auth/login")
                .send({ email, password })
                .expect(200);

            expect(loginResponse.body.data).toHaveProperty("accessToken");
        });
    });
});
