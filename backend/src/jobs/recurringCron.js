import cron from "node-cron";
import { RecurringProcessor } from "../services/recurringProcessor.js";
import { config } from "../config/config.js";
import logger from "../config/logger.js";

/**
 * Configura y ejecuta el cron job para procesar recurrentes
 * - Producción: Cada 12 horas (00:00 y 12:00)
 * - Desarrollo: Cada 5 minutos
 */
export function startRecurringCron() {
    const isProduction = config.nodeEnv === "production";

    // Producción: cada 12 horas | Desarrollo: cada 5 minutos
    const cronExpression = isProduction ? "0 */12 * * *" : "*/5 * * * *";
    const environment = isProduction ? "PRODUCCIÓN" : "DESARROLLO";

    logger.info(
        `[${environment}] Configurando cron job para recurrentes: ${cronExpression}`,
    );

    cron.schedule(cronExpression, async () => {
        logger.info(
            `[${environment}] Ejecutando procesamiento programado de recurrentes...`,
        );
        try {
            const result = await RecurringProcessor.processAllRecurrings();
            logger.info(
                `[${environment}] Procesamiento de recurrentes completado:`,
                result,
            );
        } catch (error) {
            logger.error(
                `[${environment}] Error en cron job de recurrentes:`,
                error,
            );
        }
    });

    logger.info(
        `[${environment}] Cron job de recurrentes iniciado exitosamente`,
    );
}
