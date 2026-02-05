import { Router } from "express";
import { CategoryService } from "../services/categoryService.js";
import { authenticate } from "../middlewares/auth.js";

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticate);

// GET /api/categories - Obtener todas las categorías del usuario
router.get("/", async (req, res, next) => {
    try {
        const categories = await CategoryService.getCategories(req.user.userId);
        res.json({
            success: true,
            data: categories,
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/categories - Crear nueva categoría
router.post("/", async (req, res, next) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: "El nombre es requerido",
            });
        }

        const category = await CategoryService.createCategory(
            req.user.userId,
            name,
        );
        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/categories/:id - Eliminar categoría
router.delete("/:id", async (req, res, next) => {
    try {
        const result = await CategoryService.deleteCategory(
            req.user.userId,
            req.params.id,
        );
        res.json({
            success: true,
            message: result.message,
        });
    } catch (error) {
        next(error);
    }
});

export default router;
