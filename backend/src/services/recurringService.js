import { prisma } from "../config/prisma.js";

export class RecurringService {
    static async getRecurrings(userId) {
        return await prisma.recurring.findMany({
            where: { userId },
            include: {
                account: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }

    static async getRecurringById(userId, recurringId) {
        const recurring = await prisma.recurring.findUnique({
            where: { id: recurringId },
            include: {
                account: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });

        if (!recurring) {
            const error = new Error("Recurrente no encontrado");
            error.statusCode = 404;
            throw error;
        }

        if (recurring.userId !== userId) {
            const error = new Error("No autorizado");
            error.statusCode = 403;
            throw error;
        }

        return recurring;
    }

    static async createRecurring(userId, data) {
        const {
            accountId,
            type,
            amount,
            categoryId,
            description,
            frequency,
            interval,
            startDate,
            endDate,
        } = data;

        // Validar que la cuenta pertenezca al usuario
        const account = await prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account || account.userId !== userId) {
            const error = new Error("Cuenta no encontrada");
            error.statusCode = 404;
            throw error;
        }

        // Si se especifica categoría, validar que pertenezca al usuario
        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
            });

            if (!category || category.userId !== userId) {
                const error = new Error("Categoría no encontrada");
                error.statusCode = 404;
                throw error;
            }
        }

        // Validar intervalo
        if (interval < 1) {
            const error = new Error("El intervalo debe ser mayor o igual a 1");
            error.statusCode = 400;
            throw error;
        }

        // Validar fechas
        const start = new Date(startDate);
        if (endDate) {
            const end = new Date(endDate);
            if (end <= start) {
                const error = new Error(
                    "La fecha de fin debe ser posterior a la fecha de inicio",
                );
                error.statusCode = 400;
                throw error;
            }
        }

        return await prisma.recurring.create({
            data: {
                userId,
                accountId,
                type,
                amount,
                categoryId: categoryId || null,
                description: description || null,
                frequency,
                interval: interval || 1,
                startDate: start,
                endDate: endDate ? new Date(endDate) : null,
            },
            include: {
                account: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    static async updateRecurring(userId, recurringId, data) {
        // Verificar propiedad
        const existing = await this.getRecurringById(userId, recurringId);

        const {
            accountId,
            type,
            amount,
            categoryId,
            description,
            frequency,
            interval,
            startDate,
            endDate,
        } = data;

        // Validar cuenta si se proporciona
        if (accountId && accountId !== existing.accountId) {
            const account = await prisma.account.findUnique({
                where: { id: accountId },
            });

            if (!account || account.userId !== userId) {
                const error = new Error("Cuenta no encontrada");
                error.statusCode = 404;
                throw error;
            }
        }

        // Validar categoría si se proporciona
        if (categoryId !== undefined) {
            if (categoryId) {
                const category = await prisma.category.findUnique({
                    where: { id: categoryId },
                });

                if (!category || category.userId !== userId) {
                    const error = new Error("Categoría no encontrada");
                    error.statusCode = 404;
                    throw error;
                }
            }
        }

        // Validar intervalo
        if (interval !== undefined && interval < 1) {
            const error = new Error("El intervalo debe ser mayor o igual a 1");
            error.statusCode = 400;
            throw error;
        }

        // Validar fechas
        if (startDate || endDate) {
            const start = startDate ? new Date(startDate) : existing.startDate;
            const end = endDate ? new Date(endDate) : existing.endDate;

            if (end && end <= start) {
                const error = new Error(
                    "La fecha de fin debe ser posterior a la fecha de inicio",
                );
                error.statusCode = 400;
                throw error;
            }
        }

        const updateData = {};
        if (accountId) updateData.accountId = accountId;
        if (type) updateData.type = type;
        if (amount !== undefined) updateData.amount = amount;
        if (categoryId !== undefined)
            updateData.categoryId = categoryId || null;
        if (description !== undefined)
            updateData.description = description || null;
        if (frequency) updateData.frequency = frequency;
        if (interval !== undefined) updateData.interval = interval;
        if (startDate) updateData.startDate = new Date(startDate);
        if (endDate !== undefined)
            updateData.endDate = endDate ? new Date(endDate) : null;

        return await prisma.recurring.update({
            where: { id: recurringId },
            data: updateData,
            include: {
                account: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }

    static async deleteRecurring(userId, recurringId) {
        // Verificar propiedad
        await this.getRecurringById(userId, recurringId);

        await prisma.recurring.delete({
            where: { id: recurringId },
        });

        return { success: true };
    }

    static async toggleActive(userId, recurringId) {
        const recurring = await this.getRecurringById(userId, recurringId);

        return await prisma.recurring.update({
            where: { id: recurringId },
            data: { isActive: !recurring.isActive },
            include: {
                account: {
                    select: {
                        id: true,
                        name: true,
                        type: true,
                    },
                },
                category: {
                    select: {
                        id: true,
                        name: true,
                    },
                },
            },
        });
    }
}
