/**
 * Logger wrapper para frontend
 * En producción no imprime logs, solo en desarrollo
 */

const isDevelopment = import.meta.env.DEV;

const logger = {
    log: (...args: unknown[]) => {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    info: (...args: unknown[]) => {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    warn: (...args: unknown[]) => {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    error: (...args: unknown[]) => {
        if (isDevelopment) {
            console.error(...args);
        }
        // En producción, podrías enviar errores a un servicio como Sentry
        // if (!isDevelopment) {
        //     Sentry.captureException(args[0]);
        // }
    },

    debug: (...args: unknown[]) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },
};

export default logger;
