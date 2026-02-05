import { prisma } from "../config/prisma.js";

export class CategoryService {
    static async getCategories(userId) {
        return await prisma.category.findMany({
            where: { userId },
            orderBy: { name: "asc" },
        });
    }

    static async createCategory(userId, name) {
        // Verificar si ya existe una categoría con ese nombre
        const existing = await prisma.category.findUnique({
            where: {
                userId_name: {
                    userId,
                    name: name.trim(),
                },
            },
        });

        if (existing) {
            const error = new Error("Ya existe una categoría con ese nombre");
            error.statusCode = 400;
            throw error;
        }

        return await prisma.category.create({
            data: {
                userId,
                name: name.trim(),
            },
        });
    }

    static async deleteCategory(userId, categoryId) {
        const category = await prisma.category.findFirst({
            where: { id: categoryId, userId },
        });

        if (!category) {
            const error = new Error("Categoría no encontrada");
            error.statusCode = 404;
            throw error;
        }

        await prisma.category.delete({
            where: { id: categoryId },
        });

        return { message: "Categoría eliminada correctamente" };
    }
}
