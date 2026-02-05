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
    },

    debug: (...args: unknown[]) => {
        if (isDevelopment) {
            console.debug(...args);
        }
    },
};

export default logger;
