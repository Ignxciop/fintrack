import { prisma } from "../config/prisma.js";
import { TransactionService } from "./transactionService.js";
import logger from "../config/logger.js";

export class RecurringProcessor {
    /**
     * Procesa todos los recurrentes activos y crea transacciones cuando corresponda
     */
    static async processAllRecurrings() {
        try {
            logger.info("Iniciando procesamiento de recurrentes...");

            // Obtener todos los recurrentes activos
            const recurrings = await prisma.recurring.findMany({
                where: {
                    isActive: true,
                },
                include: {
                    account: true,
                },
            });

            logger.info(`Encontrados ${recurrings.length} recurrentes activos`);

            let processedCount = 0;
            let createdCount = 0;
            let errorCount = 0;

            for (const recurring of recurrings) {
                try {
                    const created = await this.processRecurring(recurring);
                    if (created) {
                        createdCount++;
                    }
                    processedCount++;
                } catch (error) {
                    errorCount++;
                    logger.error(
                        `Error procesando recurrente ${recurring.id}:`,
                        error,
                    );
                }
            }

            logger.info(
                `Procesamiento completado. Procesados: ${processedCount}, Creados: ${createdCount}, Errores: ${errorCount}`,
            );

            return {
                processed: processedCount,
                created: createdCount,
                errors: errorCount,
            };
        } catch (error) {
            logger.error("Error en processAllRecurrings:", error);
            throw error;
        }
    }

    /**
     * Procesa un recurrente individual y crea la transacción si corresponde
     */
    static async processRecurring(recurring) {
        const now = new Date();

        // Verificar si está fuera del rango de fechas
        if (now < new Date(recurring.startDate)) {
            return false;
        }

        if (recurring.endDate && now > new Date(recurring.endDate)) {
            // Desactivar recurrente que ya pasó su fecha de fin
            await prisma.recurring.update({
                where: { id: recurring.id },
                data: { isActive: false },
            });
            logger.info(
                `Recurrente ${recurring.id} desactivado (fecha de fin alcanzada)`,
            );
            return false;
        }

        // Calcular si debe ejecutarse
        const shouldExecute = this.shouldExecuteToday(recurring);

        if (!shouldExecute) {
            return false;
        }

        // Crear la transacción
        await this.createTransactionFromRecurring(recurring);

        // Actualizar lastExecutedAt
        await prisma.recurring.update({
            where: { id: recurring.id },
            data: { lastExecutedAt: now },
        });

        logger.info(`Transacción creada desde recurrente ${recurring.id}`);

        return true;
    }

    /**
     * Determina si el recurrente debe ejecutarse hoy
     */
    static shouldExecuteToday(recurring) {
        const now = new Date();
        now.setHours(0, 0, 0, 0); // Resetear a medianoche

        // Si nunca se ha ejecutado, verificar si debe ejecutarse basándose en startDate
        if (!recurring.lastExecutedAt) {
            const startDate = new Date(recurring.startDate);
            startDate.setHours(0, 0, 0, 0);
            return now >= startDate;
        }

        const lastExecuted = new Date(recurring.lastExecutedAt);
        lastExecuted.setHours(0, 0, 0, 0);

        // Calcular próxima fecha de ejecución
        const nextExecutionDate = this.calculateNextExecutionDate(
            lastExecuted,
            recurring.frequency,
            recurring.interval,
        );

        return now >= nextExecutionDate;
    }

    /**
     * Calcula la próxima fecha de ejecución basándose en la última ejecución
     */
    static calculateNextExecutionDate(lastDate, frequency, interval) {
        const nextDate = new Date(lastDate);

        switch (frequency) {
            case "DAILY":
                nextDate.setDate(nextDate.getDate() + interval);
                break;
            case "WEEKLY":
                nextDate.setDate(nextDate.getDate() + interval * 7);
                break;
            case "MONTHLY":
                nextDate.setMonth(nextDate.getMonth() + interval);
                break;
            case "YEARLY":
                nextDate.setFullYear(nextDate.getFullYear() + interval);
                break;
        }

        return nextDate;
    }

    /**
     * Crea una transacción desde un recurrente
     */
    static async createTransactionFromRecurring(recurring) {
        const transactionData = {
            accountId: recurring.accountId,
            type: recurring.type,
            amount: parseFloat(recurring.amount.toString()),
            categoryId: recurring.categoryId || undefined,
            description: recurring.description
                ? `[Auto] ${recurring.description}`
                : "[Auto] Movimiento recurrente",
            date: new Date().toISOString(),
        };

        return await TransactionService.createTransaction(
            recurring.userId,
            transactionData,
        );
    }

    /**
     * Procesa un recurrente específico manualmente (útil para testing)
     */
    static async processRecurringById(recurringId) {
        const recurring = await prisma.recurring.findUnique({
            where: { id: recurringId },
            include: {
                account: true,
            },
        });

        if (!recurring) {
            throw new Error("Recurrente no encontrado");
        }

        return await this.processRecurring(recurring);
    }
}
