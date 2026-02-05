import { Router } from "express";
import { RecurringService } from "../services/recurringService.js";
import { RecurringProcessor } from "../services/recurringProcessor.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/recurrings - Obtener todos los recurrentes del usuario
router.get("/", async (req, res, next) => {
    try {
        const recurrings = await RecurringService.getRecurrings(
            req.user.userId,
        );
        res.json({
            success: true,
            data: recurrings,
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/recurrings/:id - Obtener un recurrente específico
router.get("/:id", async (req, res, next) => {
    try {
        const recurring = await RecurringService.getRecurringById(
            req.user.userId,
            req.params.id,
        );
        res.json({
            success: true,
            data: recurring,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/recurrings - Crear nuevo recurrente
router.post("/", async (req, res, next) => {
    try {
        const recurring = await RecurringService.createRecurring(
            req.user.userId,
            req.body,
        );
        res.status(201).json({
            success: true,
            data: recurring,
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/recurrings/:id - Actualizar recurrente
router.put("/:id", async (req, res, next) => {
    try {
        const recurring = await RecurringService.updateRecurring(
            req.user.userId,
            req.params.id,
            req.body,
        );
        res.json({
            success: true,
            data: recurring,
        });
    } catch (error) {
        next(error);
    }
});

// PATCH /api/recurrings/:id/toggle - Activar/desactivar recurrente
router.patch("/:id/toggle", async (req, res, next) => {
    try {
        const recurring = await RecurringService.toggleActive(
            req.user.userId,
            req.params.id,
        );
        res.json({
            success: true,
            data: recurring,
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/recurrings/:id - Eliminar recurrente
router.delete("/:id", async (req, res, next) => {
    try {
        const result = await RecurringService.deleteRecurring(
            req.user.userId,
            req.params.id,
        );
        res.json({
            success: true,
            data: result,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/recurrings/process - Procesar todos los recurrentes manualmente (útil para testing)
router.post("/process", async (req, res, next) => {
    try {
        const result = await RecurringProcessor.processAllRecurrings();
        res.json({
            success: true,
            data: result,
            message: `Procesados: ${result.processed}, Creados: ${result.created}, Errores: ${result.errors}`,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/recurrings/:id/execute - Ejecutar un recurrente específico manualmente
router.post("/:id/execute", async (req, res, next) => {
    try {
        // Verificar que el recurrente pertenezca al usuario
        await RecurringService.getRecurringById(req.user.userId, req.params.id);

        const executed = await RecurringProcessor.processRecurringById(
            req.params.id,
        );

        res.json({
            success: true,
            data: { executed },
            message: executed
                ? "Transacción creada exitosamente"
                : "El recurrente no necesita ejecutarse todavía",
        });
    } catch (error) {
        next(error);
    }
});

export default router;
