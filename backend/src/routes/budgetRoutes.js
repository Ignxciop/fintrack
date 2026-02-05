import express from "express";
import * as BudgetService from "../services/budgetService.js";
import { authenticate } from "../middlewares/auth.js";
import logger from "../config/logger.js";

const router = express.Router();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticate);

// Obtener todos los presupuestos del usuario con su estado
router.get("/", async (req, res) => {
    try {
        const budgets = await BudgetService.getAllBudgetsStatus(
            req.user.userId,
        );
        res.json(budgets);
    } catch (error) {
        logger.error("Error al obtener presupuestos:", error);
        res.status(500).json({
            error: "Error al obtener presupuestos",
        });
    }
});

// Obtener un presupuesto específico
router.get("/:id", async (req, res) => {
    try {
        const budget = await BudgetService.getBudgetById(
            req.user.userId,
            req.params.id,
        );

        if (!budget) {
            return res.status(404).json({ error: "Presupuesto no encontrado" });
        }

        res.json(budget);
    } catch (error) {
        logger.error("Error al obtener presupuesto:", error);
        res.status(500).json({
            error: "Error al obtener presupuesto",
        });
    }
});

// Obtener el estado detallado de un presupuesto (con transacciones)
router.get("/:id/status", async (req, res) => {
    try {
        const status = await BudgetService.getBudgetStatus(
            req.user.userId,
            req.params.id,
        );
        res.json(status);
    } catch (error) {
        logger.error("Error al obtener estado del presupuesto:", error);
        if (error.message === "Presupuesto no encontrado") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
            error: "Error al obtener estado del presupuesto",
        });
    }
});

// Crear un nuevo presupuesto
router.post("/", async (req, res) => {
    try {
        const { name, amount, period, categoryId, accountId, startDate } =
            req.body;

        if (!name || !amount || !period || !startDate) {
            return res.status(400).json({
                error: "Nombre, monto, período y fecha de inicio son requeridos",
            });
        }

        const budget = await BudgetService.createBudget(req.user.userId, {
            name,
            amount,
            period,
            categoryId,
            accountId,
            startDate,
        });

        res.status(201).json(budget);
    } catch (error) {
        logger.error("Error al crear presupuesto:", error);
        res.status(400).json({
            error: error.message || "Error al crear presupuesto",
        });
    }
});

// Actualizar un presupuesto
router.put("/:id", async (req, res) => {
    try {
        const { name, amount, period, categoryId, accountId, startDate } =
            req.body;

        const budget = await BudgetService.updateBudget(
            req.user.userId,
            req.params.id,
            {
                name,
                amount,
                period,
                categoryId,
                accountId,
                startDate,
            },
        );

        res.json(budget);
    } catch (error) {
        logger.error("Error al actualizar presupuesto:", error);
        if (error.message === "Presupuesto no encontrado") {
            return res.status(404).json({ error: error.message });
        }
        res.status(400).json({
            error: error.message || "Error al actualizar presupuesto",
        });
    }
});

// Activar/desactivar un presupuesto
router.patch("/:id/toggle", async (req, res) => {
    try {
        const budget = await BudgetService.toggleActive(
            req.user.userId,
            req.params.id,
        );
        res.json(budget);
    } catch (error) {
        logger.error("Error al cambiar estado del presupuesto:", error);
        if (error.message === "Presupuesto no encontrado") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
            error: "Error al cambiar estado del presupuesto",
        });
    }
});

// Eliminar un presupuesto
router.delete("/:id", async (req, res) => {
    try {
        const result = await BudgetService.deleteBudget(
            req.user.userId,
            req.params.id,
        );
        res.json(result);
    } catch (error) {
        logger.error("Error al eliminar presupuesto:", error);
        if (error.message === "Presupuesto no encontrado") {
            return res.status(404).json({ error: error.message });
        }
        res.status(500).json({
            error: "Error al eliminar presupuesto",
        });
    }
});

export default router;
