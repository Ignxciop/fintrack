/**
 * Servicio de envío de emails
 * Configurado para Gmail SMTP
 */

import nodemailer from "nodemailer";
import logger from "../config/logger.js";

// Configuración de Gmail SMTP
// Soporta múltiples formatos de variables de entorno
const emailUser =
    process.env.GMAIL_USER || process.env.SMTP_USER || process.env.EMAIL_USER;
const emailPass =
    process.env.GMAIL_APP_PASSWORD ||
    process.env.SMTP_PASS ||
    process.env.EMAIL_PASS;

if (!emailUser || !emailPass) {
    logger.error("❌ ERROR: Faltan credenciales de email en el archivo .env");
    logger.error("   Configura una de estas combinaciones:");
    logger.error("   - GMAIL_USER y GMAIL_APP_PASSWORD");
    logger.error("   - SMTP_USER y SMTP_PASS");
    logger.error("   - EMAIL_USER y EMAIL_PASS");
}

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587"),
    secure: process.env.SMTP_PORT === "465", // true para 465, false para 587
    auth: {
        user: emailUser,
        pass: emailPass,
    },
});

// Verificar conexión al iniciar
transporter.verify((error, success) => {
    if (error) {
        logger.error({ err: error }, "❌ Error al conectar con Gmail SMTP");
    } else {
        logger.info("✅ Servidor de email listo para enviar mensajes");
    }
});

export const sendVerificationEmail = async (email, code) => {
    try {
        await transporter.sendMail({
            from: `"FinTrack" <${emailUser}>`,
            to: email,
            subject: "Verifica tu email - FinTrack",
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
                        <h1 style="color: white; margin: 0;">FinTrack</h1>
                    </div>
                    <div style="background: #f9fafb; padding: 40px; border-radius: 0 0 10px 10px;">
                        <h2 style="color: #1f2937; margin-top: 0;">Verifica tu email</h2>
                        <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
                            Gracias por registrarte en FinTrack. Para completar tu registro, ingresa el siguiente código de verificación:
                        </p>
                        <div style="background: white; padding: 25px; text-align: center; margin: 30px 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                            <div style="font-size: 42px; font-weight: bold; letter-spacing: 8px; color: #667eea;">
                                ${code}
                            </div>
                        </div>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                            ⏱️ Este código expira en <strong>5 minutos</strong>.
                        </p>
                        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
                            Si no solicitaste este código, puedes ignorar este email de forma segura.
                        </p>
                    </div>
                    <div style="text-align: center; padding: 20px; color: #9ca3af; font-size: 12px;">
                        <p>© ${new Date().getFullYear()} FinTrack. Todos los derechos reservados.</p>
                    </div>
                </div>
            `,
        });
        logger.info({ email }, "✅ Email de verificación enviado");
    } catch (error) {
        logger.error({ err: error, email }, "❌ Error al enviar email");
        throw new Error("No se pudo enviar el email de verificación");
    }
};
