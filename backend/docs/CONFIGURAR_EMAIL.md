# Configuración de Envío de Emails

## 🔧 Estado Actual

En **desarrollo**, los códigos de verificación se imprimen en la consola del backend:

```bash
cd backend && pnpm dev
# Verás:
📧 Código de verificación para user@example.com: 123456
```

## 📧 Configurar Email Real (Producción)

### Opción 1: SendGrid (Recomendado - Fácil)

1. **Crear cuenta**: https://sendgrid.com/
2. **Instalar dependencia**:

    ```bash
    cd backend
    npm install @sendgrid/mail
    ```

3. **Configurar .env**:

    ```env
    SENDGRID_API_KEY=tu_api_key_aqui
    EMAIL_FROM=noreply@tudominio.com
    ```

4. **Editar `src/services/emailService.js`**:

    ```javascript
    // Descomentar la sección OPCIÓN 2: SENDGRID
    import sgMail from "@sendgrid/mail";

    sgMail.setApiKey(process.env.SENDGRID_API_KEY);

    export const sendVerificationEmail = async (email, code) => {
        await sgMail.send({
            to: email,
            from: process.env.EMAIL_FROM,
            subject: "Verifica tu email - FinTrack",
            html: `...html del email...`,
        });
    };
    ```

### Opción 2: Resend (Moderno)

1. **Crear cuenta**: https://resend.com/
2. **Instalar**:

    ```bash
    npm install resend
    ```

3. **Configurar .env**:

    ```env
    RESEND_API_KEY=tu_api_key_aqui
    ```

4. **Editar emailService.js**: Usar código de OPCIÓN 4

### Opción 3: Gmail/SMTP (Cualquier proveedor)

1. **Instalar**:

    ```bash
    npm install nodemailer
    ```

2. **Configurar .env**:

    ```env
    SMTP_HOST=smtp.gmail.com
    SMTP_PORT=587
    SMTP_USER=tu_email@gmail.com
    SMTP_PASS=tu_contraseña_de_aplicacion
    ```

3. **Editar emailService.js**: Usar código de OPCIÓN 1

### Opción 4: AWS SES (Escalable)

1. **Instalar**:

    ```bash
    npm install @aws-sdk/client-ses
    ```

2. **Configurar .env**:

    ```env
    AWS_REGION=us-east-1
    AWS_ACCESS_KEY_ID=tu_access_key
    AWS_SECRET_ACCESS_KEY=tu_secret_key
    ```

3. **Editar emailService.js**: Usar código de OPCIÓN 3

## 🎨 Personalizar Template de Email

Puedes editar el HTML en `emailService.js` para personalizar el diseño:

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
    <div style="background: #2563eb; padding: 20px; text-align: center;">
        <h1 style="color: white; margin: 0;">FinTrack</h1>
    </div>
    <div style="padding: 40px 20px;">
        <h2>Verifica tu email</h2>
        <p>Tu código de verificación es:</p>
        <div
            style="background: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; border-radius: 8px;"
        >
            ${code}
        </div>
        <p style="color: #666; margin-top: 20px;">
            Este código expira en 5 minutos.
        </p>
        <p style="color: #999; font-size: 14px;">
            Si no solicitaste este código, puedes ignorar este email.
        </p>
    </div>
</div>
```

## 🧪 Probar en Desarrollo

Para probar sin configurar email real:

1. Inicia el backend: `cd backend && pnpm dev`
2. Registra un usuario en el frontend
3. Busca en la consola del backend: `📧 Código de verificación...`
4. Copia el código de 6 dígitos
5. Pégalo en la página de verificación

## ✅ Verificar que Funciona

```bash
# En la consola del backend verás:
📧 Código de verificación para juan@example.com: 567890

# O si configuraste email real:
# No verás nada en consola, el email se enviará al usuario
```

## 🚀 Recomendación para Producción

1. **Staging**: Usa SendGrid o Resend (tienen planes gratuitos)
2. **Producción**: AWS SES (más económico para alto volumen)
3. **Siempre**: Configura dominio verificado para evitar spam

## 📝 Variables de Entorno Necesarias

Agrega a `backend/.env`:

```env
# Para SendGrid
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM=noreply@fintrack.com

# Para Resend
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Para SMTP/Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_email@gmail.com
SMTP_PASS=tu_password_de_aplicacion

# Para AWS SES
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIAxxxxxxxxxxxxx
AWS_SECRET_ACCESS_KEY=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🔒 Seguridad

- ✅ Nunca commitees las API keys al repositorio
- ✅ Usa variables de entorno
- ✅ Rota las keys periódicamente
- ✅ Limita los permisos de las keys (solo envío de emails)
