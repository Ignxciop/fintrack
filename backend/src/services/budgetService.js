import { prisma } from "../config/prisma.js";
import logger from "../config/logger.js";

/**
 * Obtiene todos los presupuestos del usuario con relaciones
 */
export async function getBudgets(userId) {
    return await prisma.budget.findMany({
        where: { userId },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });
}

/**
 * Obtiene un presupuesto por ID
 */
export async function getBudgetById(userId, budgetId) {
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });

    if (!budget || budget.userId !== userId) {
        return null;
    }

    return budget;
}

/**
 * Crea un nuevo presupuesto
 */
export async function createBudget(userId, data) {
    const { name, amount, period, categoryId, accountId, startDate } = data;

    // Validar que la categoría pertenece al usuario si se proporciona
    if (categoryId) {
        const category = await prisma.category.findUnique({
            where: { id: categoryId },
        });

        if (!category || category.userId !== userId) {
            throw new Error("Categoría no válida o no pertenece al usuario");
        }
    }

    // Validar que la cuenta pertenece al usuario si se proporciona
    if (accountId) {
        const account = await prisma.account.findUnique({
            where: { id: accountId },
        });

        if (!account || account.userId !== userId) {
            throw new Error("Cuenta no válida o no pertenece al usuario");
        }
    }

    // Validar que el monto es positivo
    if (parseFloat(amount) <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }

    return await prisma.budget.create({
        data: {
            userId,
            name,
            amount,
            period,
            categoryId,
            accountId,
            startDate: new Date(startDate),
            isActive: true,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });
}

/**
 * Actualiza un presupuesto existente
 */
export async function updateBudget(userId, budgetId, data) {
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
    });

    if (!budget || budget.userId !== userId) {
        throw new Error("Presupuesto no encontrado");
    }

    const { name, amount, period, categoryId, accountId, startDate } = data;

    // Validar que la categoría pertenece al usuario si se proporciona
    if (categoryId !== undefined) {
        if (categoryId) {
            const category = await prisma.category.findUnique({
                where: { id: categoryId },
            });

            if (!category || category.userId !== userId) {
                throw new Error(
                    "Categoría no válida o no pertenece al usuario",
                );
            }
        }
    }

    // Validar que la cuenta pertenece al usuario si se proporciona
    if (accountId !== undefined) {
        if (accountId) {
            const account = await prisma.account.findUnique({
                where: { id: accountId },
            });

            if (!account || account.userId !== userId) {
                throw new Error("Cuenta no válida o no pertenece al usuario");
            }
        }
    }

    // Validar que el monto es positivo si se proporciona
    if (amount !== undefined && parseFloat(amount) <= 0) {
        throw new Error("El monto debe ser mayor a 0");
    }

    return await prisma.budget.update({
        where: { id: budgetId },
        data: {
            ...(name !== undefined && { name }),
            ...(amount !== undefined && { amount }),
            ...(period !== undefined && { period }),
            ...(categoryId !== undefined && { categoryId }),
            ...(accountId !== undefined && { accountId }),
            ...(startDate !== undefined && { startDate: new Date(startDate) }),
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });
}

/**
 * Elimina un presupuesto
 */
export async function deleteBudget(userId, budgetId) {
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
    });

    if (!budget || budget.userId !== userId) {
        throw new Error("Presupuesto no encontrado");
    }

    await prisma.budget.delete({
        where: { id: budgetId },
    });

    return { message: "Presupuesto eliminado correctamente" };
}

/**
 * Activa o desactiva un presupuesto
 */
export async function toggleActive(userId, budgetId) {
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
    });

    if (!budget || budget.userId !== userId) {
        throw new Error("Presupuesto no encontrado");
    }

    return await prisma.budget.update({
        where: { id: budgetId },
        data: {
            isActive: !budget.isActive,
        },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });
}

/**
 * Calcula el período actual según el presupuesto
 */
function getCurrentPeriod(budget) {
    const now = new Date();
    const startDate = new Date(budget.startDate);

    switch (budget.period) {
        case "WEEKLY": {
            // Calcular semanas desde startDate
            const weeksSinceStart = Math.floor(
                (now - startDate) / (7 * 24 * 60 * 60 * 1000),
            );
            const periodStart = new Date(startDate);
            periodStart.setDate(periodStart.getDate() + weeksSinceStart * 7);
            const periodEnd = new Date(periodStart);
            periodEnd.setDate(periodEnd.getDate() + 7);
            return { start: periodStart, end: periodEnd };
        }
        case "MONTHLY": {
            // Usar el mismo día del mes como startDate
            const periodStart = new Date(
                now.getFullYear(),
                now.getMonth(),
                startDate.getDate(),
            );
            if (periodStart > now) {
                periodStart.setMonth(periodStart.getMonth() - 1);
            }
            const periodEnd = new Date(periodStart);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            return { start: periodStart, end: periodEnd };
        }
        case "YEARLY": {
            // Usar el mismo mes y día como startDate
            const periodStart = new Date(
                now.getFullYear(),
                startDate.getMonth(),
                startDate.getDate(),
            );
            if (periodStart > now) {
                periodStart.setFullYear(periodStart.getFullYear() - 1);
            }
            const periodEnd = new Date(periodStart);
            periodEnd.setFullYear(periodEnd.getFullYear() + 1);
            return { start: periodStart, end: periodEnd };
        }
        default:
            return { start: startDate, end: now };
    }
}

/**
 * Obtiene el estado y gasto actual de un presupuesto
 */
export async function getBudgetStatus(userId, budgetId) {
    const budget = await prisma.budget.findUnique({
        where: { id: budgetId },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
    });

    if (!budget || budget.userId !== userId) {
        throw new Error("Presupuesto no encontrado");
    }

    // Calcular el período actual
    const { start, end } = getCurrentPeriod(budget);

    // Construir filtros para transacciones
    const where = {
        account: {
            userId,
        },
        type: "EXPENSE", // Solo gastos
        date: {
            gte: start,
            lt: end,
        },
    };

    // Agregar filtros opcionales
    if (budget.categoryId) {
        where.categoryId = budget.categoryId;
    }

    if (budget.accountId) {
        where.accountId = budget.accountId;
    }

    // Obtener transacciones que afectan este presupuesto
    const transactions = await prisma.transaction.findMany({
        where,
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
        orderBy: { date: "desc" },
    });

    // Calcular total gastado
    const spent = transactions.reduce(
        (sum, transaction) => sum + parseFloat(transaction.amount),
        0,
    );

    // Calcular porcentaje
    const percentage = (spent / parseFloat(budget.amount)) * 100;

    // Determinar estado
    let status = "ok";
    if (percentage >= 100) {
        status = "exceeded";
    } else if (percentage >= 70) {
        status = "warning";
    }

    return {
        budget,
        spent,
        percentage: Math.min(percentage, 100),
        status,
        period: {
            start,
            end,
        },
        transactions,
    };
}

/**
 * Obtiene el estado de todos los presupuestos del usuario
 */
export async function getAllBudgetsStatus(userId) {
    const budgets = await prisma.budget.findMany({
        where: { userId },
        include: {
            category: {
                select: {
                    id: true,
                    name: true,
                },
            },
            account: {
                select: {
                    id: true,
                    name: true,
                    type: true,
                },
            },
        },
        orderBy: { createdAt: "desc" },
    });

    const budgetsWithStatus = await Promise.all(
        budgets.map(async (budget) => {
            try {
                const { start, end } = getCurrentPeriod(budget);

                const where = {
                    account: {
                        userId,
                    },
                    type: "EXPENSE",
                    date: {
                        gte: start,
                        lt: end,
                    },
                };

                if (budget.categoryId) {
                    where.categoryId = budget.categoryId;
                }

                if (budget.accountId) {
                    where.accountId = budget.accountId;
                }

                const transactions = await prisma.transaction.findMany({
                    where,
                });

                const spent = transactions.reduce(
                    (sum, transaction) => sum + parseFloat(transaction.amount),
                    0,
                );

                const percentage = (spent / parseFloat(budget.amount)) * 100;

                let status = "ok";
                if (percentage >= 100) {
                    status = "exceeded";
                } else if (percentage >= 70) {
                    status = "warning";
                }

                return {
                    ...budget,
                    spent,
                    percentage: Math.min(percentage, 100),
                    status,
                };
            } catch (error) {
                logger.error(
                    `Error calculando estado de presupuesto ${budget.id}:`,
                    error,
                );
                return {
                    ...budget,
                    spent: 0,
                    percentage: 0,
                    status: "ok",
                };
            }
        }),
    );

    return budgetsWithStatus;
}
