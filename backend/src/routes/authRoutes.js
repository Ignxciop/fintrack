import { Router } from "express";
import { AuthController } from "../controllers/authController.js";
import {
    registerValidator,
    loginValidator,
    verifyEmailValidator,
    resendVerificationValidator,
    validate,
} from "../validators/authValidator.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// POST /api/auth/register
router.post("/register", registerValidator, validate, AuthController.register);

// POST /api/auth/login
router.post("/login", loginValidator, validate, AuthController.login);

// POST /api/auth/verify-email - Verificar email con código
router.post(
    "/verify-email",
    verifyEmailValidator,
    validate,
    AuthController.verifyEmail,
);

// POST /api/auth/resend-verification - Reenviar código de verificación
router.post(
    "/resend-verification",
    resendVerificationValidator,
    validate,
    AuthController.resendVerification,
);

// POST /api/auth/refresh - Renovar access token
router.post("/refresh", AuthController.refresh);

// POST /api/auth/logout - Cerrar sesión actual
router.post("/logout", AuthController.logout);

// POST /api/auth/logout-all - Cerrar todas las sesiones
router.post("/logout-all", authenticate, AuthController.logoutAll);

// GET /api/auth/me
router.get("/me", authenticate, AuthController.getMe);

// GET /api/auth/sessions - Ver sesiones activas
router.get("/sessions", authenticate, AuthController.getActiveSessions);

export default router;
