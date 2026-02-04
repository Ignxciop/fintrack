/**
 * Validador de emails para rechazar dominios temporales/desechables
 */

// Lista de dominios permitidos (principales proveedores)
const ALLOWED_DOMAINS = [
    // Google
    "gmail.com",
    "googlemail.com",

    // Microsoft
    "hotmail.com",
    "outlook.com",
    "live.com",
    "msn.com",

    // Yahoo
    "yahoo.com",
    "yahoo.es",
    "yahoo.com.mx",
    "yahoo.com.ar",

    // Apple
    "icloud.com",
    "me.com",
    "mac.com",

    // AOL
    "aol.com",

    // Proton
    "protonmail.com",
    "proton.me",
    "pm.me",

    // Otros proveedores latinoamericanos
    "hotmail.es",
    "outlook.es",
    "terra.com",
    "terra.cl",
    "terra.com.mx",
    "uol.com.br",

    // Proveedores corporativos comunes
    "zoho.com",
    "mail.com",
    "gmx.com",
    "fastmail.com",
];

// Lista de dominios temporales/desechables más comunes (blacklist)
const TEMPORARY_DOMAINS = [
    "10minutemail.com",
    "guerrillamail.com",
    "mailinator.com",
    "tempmail.com",
    "throwaway.email",
    "temp-mail.org",
    "yopmail.com",
    "maildrop.cc",
    "trashmail.com",
    "dispostable.com",
    "fakeinbox.com",
    "getnada.com",
    "mintemail.com",
    "mytrashmail.com",
    "sharklasers.com",
    "spam4.me",
    "tempinbox.com",
    "tempr.email",
    "throwam.com",
];

/**
 * Extrae el dominio de un email
 */
export const extractDomain = (email) => {
    const parts = email.toLowerCase().trim().split("@");
    return parts.length === 2 ? parts[1] : null;
};

/**
 * Valida que el email sea de un proveedor legítimo
 * @param {string} email - Email a validar
 * @returns {object} { valid: boolean, reason?: string }
 */
export const validateEmailDomain = (email) => {
    if (!email || typeof email !== "string") {
        return { valid: false, reason: "Email inválido" };
    }

    const domain = extractDomain(email);

    if (!domain) {
        return { valid: false, reason: "Formato de email inválido" };
    }

    // Verificar si está en la lista negra (dominios temporales)
    if (TEMPORARY_DOMAINS.includes(domain)) {
        return {
            valid: false,
            reason: "No se permiten correos temporales o desechables",
        };
    }

    // Verificar si está en la lista blanca (dominios permitidos)
    if (!ALLOWED_DOMAINS.includes(domain)) {
        return {
            valid: false,
            reason: `El dominio ${domain} no está en la lista de proveedores permitidos. Usa Gmail, Hotmail, Yahoo, iCloud u otro proveedor reconocido.`,
        };
    }

    return { valid: true };
};

/**
 * Valida que el formato del email sea correcto (regex básico)
 */
export const validateEmailFormat = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

/**
 * Validación completa del email
 */
export const validateEmail = (email) => {
    // Validar formato
    if (!validateEmailFormat(email)) {
        return { valid: false, reason: "Formato de email inválido" };
    }

    // Validar dominio
    return validateEmailDomain(email);
};
