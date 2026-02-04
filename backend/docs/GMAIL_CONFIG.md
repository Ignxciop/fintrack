# Configuración de Gmail para FinTrack

## 📧 Configuración Actual

El sistema está configurado para enviar emails usando **Gmail SMTP** y validar que los usuarios usen emails legítimos (no temporales).

---

## 🔧 Configuración Paso a Paso

### 1. Obtener Contraseña de Aplicación de Google

Gmail ya no permite usar tu contraseña normal para aplicaciones de terceros. Necesitas generar una "Contraseña de aplicación":

1. Ve a tu cuenta de Google: https://myaccount.google.com/security
2. Busca "Verificación en dos pasos" y actívala si no la tienes
3. Una vez activada, busca "Contraseñas de aplicaciones"
4. Genera una nueva contraseña para "Correo" o "Otra (nombre personalizado)"
5. Google te dará una contraseña de 16 caracteres (formato: `xxxx xxxx xxxx xxxx`)
6. **Copia esa contraseña** (no podrás verla de nuevo)

### 2. Configurar Variables de Entorno

Edita tu archivo `.env` en el backend:

```env
# Gmail SMTP
GMAIL_USER="tu-email@gmail.com"
GMAIL_APP_PASSWORD="abcd efgh ijkl mnop"
```

**IMPORTANTE:**

- Usa el formato con espacios tal como te lo da Google
- NO uses tu contraseña normal de Gmail
- NO compartas estas credenciales en Git (el `.env` debe estar en `.gitignore`)

### 3. Verificar la Instalación

```bash
cd backend
npm install nodemailer
npm run dev
```

Cuando el servidor inicie, deberías ver:

```
✅ Servidor de email listo para enviar mensajes
```

---

## 📬 Dominios de Email Permitidos

El sistema **solo permite** emails de proveedores legítimos:

### ✅ Proveedores Permitidos:

- **Google:** gmail.com, googlemail.com
- **Microsoft:** hotmail.com, outlook.com, live.com, msn.com, hotmail.es, outlook.es
- **Yahoo:** yahoo.com, yahoo.es, yahoo.com.mx, yahoo.com.ar
- **Apple:** icloud.com, me.com, mac.com
- **Otros:** aol.com, protonmail.com, proton.me, pm.me, zoho.com, mail.com, gmx.com, fastmail.com
- **Latinoamérica:** terra.com, terra.cl, terra.com.mx, uol.com.br

### ❌ Emails Rechazados:

- Dominios temporales: 10minutemail.com, guerrillamail.com, tempmail.com, etc.
- Dominios no reconocidos o menos comunes

Si un usuario intenta registrarse con un email no permitido, verá:

```
"El dominio example.com no está en la lista de proveedores permitidos. Usa Gmail, Hotmail, Yahoo, iCloud u otro proveedor reconocido."
```

---

## 🧪 Probar el Envío de Emails

### 1. Registrar un Usuario

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@gmail.com",
    "password": "password123",
    "name": "Test",
    "lastname": "User"
  }'
```

### 2. Revisar el Email

Deberías recibir un email con:

- Asunto: "Verifica tu email - FinTrack"
- Un código de 6 dígitos
- Diseño con colores morados (#667eea, #764ba2)

### 3. Verificar el Código

```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tu-email@gmail.com",
    "code": "123456"
  }'
```

---

## 🎨 Personalizar el Template del Email

El template se encuentra en [`src/services/emailService.js`](src/services/emailService.js) en la función `sendVerificationEmail`.

Puedes modificar:

- **Colores:** Busca `#667eea` y `#764ba2` (gradiente morado actual)
- **Texto:** Cambia los mensajes en español
- **Logo:** Reemplaza `<h1>FinTrack</h1>` con un `<img>` de tu logo
- **Estilos:** Ajusta padding, font-size, etc.

---

## 🔒 Seguridad

### ✅ Buenas Prácticas:

1. **Nunca** guardes tu contraseña de aplicación en el código
2. **Siempre** usa variables de entorno (`.env`)
3. Asegúrate que `.env` esté en `.gitignore`
4. Rota las contraseñas de aplicación periódicamente
5. Si expones una contraseña, revócala inmediatamente en Google

### 🚫 NO Hacer:

- Hardcodear las credenciales en el código
- Compartir tu `.env` en repositorios públicos
- Usar tu contraseña normal de Gmail
- Desactivar la verificación en dos pasos

---

## ⚠️ Troubleshooting

### Error: "Invalid login: 535-5.7.8 Username and Password not accepted"

- Verifica que usas una **contraseña de aplicación**, no tu contraseña normal
- Asegúrate de tener la verificación en dos pasos activada
- Revisa que el email en `GMAIL_USER` sea correcto

### Error: "Connection timeout"

- Verifica tu conexión a internet
- Algunos firewalls corporativos bloquean el puerto 587
- Prueba cambiar el puerto a 465 y `secure: true`

### No llega el email

- Revisa la carpeta de spam
- Verifica que el email del usuario sea correcto
- Revisa los logs del servidor: `✅ Email de verificación enviado a...`

### Error: "El dominio X no está permitido"

- Si es un dominio legítimo que olvidamos, puedes agregarlo a `ALLOWED_DOMAINS` en [`src/utils/emailValidator.js`](src/utils/emailValidator.js)
- Para dominios corporativos, evalúa si quieres permitirlos

---

## 📊 Límites de Gmail

Gmail tiene límites de envío:

- **500 emails/día** para cuentas gratuitas
- **2000 emails/día** para Google Workspace

Si necesitas más, considera:

- **SendGrid:** 100 emails/día gratis, luego de pago
- **Resend:** 100 emails/día gratis, muy fácil de configurar
- **AWS SES:** $0.10 por cada 1000 emails

---

## 🆘 Soporte

Si tienes problemas:

1. Revisa los logs del servidor: `npm run dev`
2. Verifica el archivo `.env`
3. Prueba con un email de prueba primero
4. Revisa la configuración de seguridad de Google

---

## 🎯 Resumen Rápido

```bash
# 1. Instalar dependencia
npm install nodemailer

# 2. Configurar .env
GMAIL_USER="tu-email@gmail.com"
GMAIL_APP_PASSWORD="xxxx xxxx xxxx xxxx"

# 3. Iniciar servidor
npm run dev

# 4. Listo! Los emails se enviarán automáticamente
```

**¡Los usuarios recibirán sus códigos de verificación por email!** 🎉
