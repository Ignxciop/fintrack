# Verificación de Email - Documentación

## 📧 Flujo de Verificación Implementado

### Características Principales

1. **Código de 6 dígitos** generado aleatoriamente
2. **Expiración de 5 minutos** por seguridad
3. **Re-registro permitido** para emails no verificados
4. **Timer visual** que muestra tiempo restante
5. **Botón de reenvío** disponible al expirar el código
6. **Validaciones robustas** en backend y frontend

### Flujo de Usuario

#### 1. Registro (`/registro`)

- Usuario completa formulario de registro
- Backend crea usuario con `isVerified: false`
- Backend genera código de 6 dígitos (válido por 5 minutos)
- Backend imprime código en consola (simulando envío por email)
- Frontend guarda timestamp de expiración en localStorage
- Frontend redirige a `/verificacion` con email en estado

#### 2. Verificación (`/verificacion`)

- Muestra email al que se envió el código
- Input de 6 dígitos con formato visual
- Timer de 5 minutos con cuenta regresiva
- Al verificar correctamente:
    - Backend marca usuario como verificado
    - Backend genera tokens de autenticación
    - Frontend guarda tokens y redirige a `/`

#### 3. Reenvío de Código

- Disponible cuando el código expira (5 minutos)
- Invalida códigos anteriores
- Genera nuevo código con nuevo timer de 5 minutos
- Muestra mensaje de confirmación

#### 4. Re-registro de Email No Verificado

- Si usuario intenta registrarse con email ya existente pero no verificado:
    - NO lanza error 409
    - Regenera código de verificación
    - Permite completar el proceso de verificación
- Si usuario ya está verificado:
    - Lanza error 409 "El usuario ya existe y está verificado"

#### 5. Login Bloqueado para No Verificados

- Al intentar login sin verificar email:
    - Responde con error 403
    - Mensaje: "Debes verificar tu email antes de iniciar sesión"

### Arquitectura Backend

#### Modelo de Datos

```prisma
model User {
  isVerified         Boolean             @default(false)
  verificationCodes  VerificationCode[]
  // ...otros campos
}

model VerificationCode {
  id        String   @id @default(uuid())
  code      String   // 6 dígitos
  userId    String
  user      User     @relation(...)
  expiresAt DateTime // 5 minutos después de creación
  createdAt DateTime @default(now())
  isUsed    Boolean  @default(false)
}
```

#### Servicio de Verificación (`verificationService.js`)

- `generateCode()` - Genera código random de 6 dígitos
- `createVerification(userId)` - Crea código y expira anteriores
- `validateCode(userId, code)` - Valida y marca usuario como verificado
- `resendCode(email)` - Regenera código para email
- `cleanExpiredCodes()` - Mantenimiento de códigos expirados

#### Endpoints Nuevos

- `POST /api/auth/verify-email` - Verifica email con código

    ```json
    Body: { "email": "user@example.com", "code": "123456" }
    Response: { "user": {...}, "accessToken": "...", "refreshToken": "..." }
    ```

- `POST /api/auth/resend-verification` - Reenvía código
    ```json
    Body: { "email": "user@example.com" }
    Response: { "message": "Código de verificación reenviado" }
    ```

#### Cambios en Endpoints Existentes

**POST /api/auth/register**

```json
// Antes:
Response: { "user": {...}, "accessToken": "...", "refreshToken": "..." }

// Ahora:
Response: {
  "user": {...},
  "requiresVerification": true
}
// No incluye tokens hasta verificar
```

**POST /api/auth/login**

- Agregada validación de `isVerified`
- Si `!user.isVerified` → Error 403

### Arquitectura Frontend

#### Servicios (`authService.ts`)

```typescript
interface User {
  isVerified: boolean; // Agregado
}

interface AuthResponse {
  data: {
    requiresVerification?: boolean; // Agregado
    accessToken?: string; // Ahora opcional
    refreshToken?: string; // Ahora opcional
  }
}

// Nuevos métodos:
verifyEmail(email, code): Promise<AuthResponse>
resendVerification(email): Promise<{success, message}>
```

#### Componente VerifyEmailPage

**Props via Router State:**

- `email: string` - Email a verificar

**Estado Local:**

- `code` - Código ingresado (max 6 dígitos)
- `timeLeft` - Segundos restantes (300 = 5 min)
- `canResend` - Permitir reenvío (true cuando timeLeft === 0)
- `error/success` - Mensajes de estado

**Funcionalidades:**

- Input solo acepta números, máximo 6 caracteres
- Timer actualizado cada segundo
- Botón "Verificar" disabled hasta tener 6 dígitos
- Botón "Reenviar" disabled hasta que expire el timer
- Redirige a `/registro` si no hay email en state
- Redirige a `/` al verificar exitosamente

#### Cambios en RegisterPage

```typescript
const response = await register(...);

// Antes:
navigate("/");

// Ahora:
if (response?.requiresVerification) {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  localStorage.setItem(`verification_expires_${email}`, expiresAt.toString());
  navigate("/verificacion", { state: { email: formData.email } });
} else {
  navigate("/");
}
```

#### Cambios en AuthContext

```typescript
// register ahora retorna objeto o void
register(): Promise<{ requiresVerification?: boolean } | void>

// Maneja respuesta sin tokens
if (response.data.requiresVerification) {
  return { requiresVerification: true };
}
```

### Tests

#### Tests Unitarios (`verificationService.test.js`)

- ✅ Generar código de 6 dígitos
- ✅ Crear verificación e invalidar anteriores
- ✅ Validar código correcto
- ✅ Rechazar código inválido/expirado/usado
- ✅ Reenviar código para no verificados
- ✅ Rechazar reenvío para verificados
- ✅ Limpiar códigos expirados

#### Tests E2E (`auth.test.js`)

- ✅ Verificar email con código correcto
- ✅ Rechazar código inválido
- ✅ Rechazar verificación de usuario ya verificado
- ✅ Reenviar código de verificación
- ✅ Rechazar reenvío para email no registrado
- ✅ Permitir re-registro de email no verificado
- ✅ Rechazar login para usuario no verificado

### Seguridad Implementada

1. **Expiración temporal** - Códigos válidos solo 5 minutos
2. **Uso único** - Códigos marcados como `isUsed` al validar
3. **Invalidación automática** - Al crear nuevo código, expira anteriores
4. **Validación de estado** - Verificar que usuario existe y no está verificado
5. **Logging de códigos** - En desarrollo, imprime código en consola
6. **Código numérico** - 6 dígitos (100000-999999) = 900,000 combinaciones
7. **Limpieza periódica** - Método para eliminar códigos expirados

### TODO: Integración con Email Real

Para producción, reemplazar el `console.log` en `verificationService.js:43`:

```javascript
// Desarrollo:
console.log(`📧 Código de verificación para userId ${userId}: ${code}`);

// Producción - Ejemplo con Nodemailer:
await emailService.sendVerificationCode(user.email, code);

// Producción - Ejemplo con SendGrid:
await sgMail.send({
    to: user.email,
    from: "noreply@fintrack.com",
    subject: "Verifica tu email - FinTrack",
    html: `<p>Tu código de verificación es: <strong>${code}</strong></p>
         <p>Este código expira en 5 minutos.</p>`,
});
```

### Migraciones Aplicadas

```sql
-- Migration: add_email_verification

ALTER TABLE "users" ADD COLUMN "isVerified" BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE "verification_codes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "code" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "isUsed" BOOLEAN NOT NULL DEFAULT false,
  FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "verification_codes_userId_idx" ON "verification_codes"("userId");
CREATE INDEX "verification_codes_code_idx" ON "verification_codes"("code");
```

### Experiencia de Usuario

#### Desktop

- Card centrada con ancho máximo 28rem (448px)
- Input grande con espaciado entre dígitos
- Timer visible con icono de reloj
- Botones de ancho completo

#### Mobile

- Diseño responsive con padding horizontal
- Input táctil optimizado para teclado numérico
- Mensajes de error/éxito visibles
- Navegación fácil con links claros

### Casos de Uso

1. **Registro Normal**
    - Registro → Ver código en backend → Verificar → Login automático

2. **Usuario olvidó verificar**
    - Intenta login → Error 403 → Vuelve a registrar mismo email → Nuevo código → Verifica → Login

3. **Código expiró**
    - Usuario demora más de 5 min → Timer llega a 0 → Botón "Reenviar" → Nuevo código → Verifica

4. **Email incorrecto**
    - Usuario nota error en email → Link "Volver a registrarse" → Nuevo registro con email correcto

5. **Usuario ya verificado intenta re-registrarse**
    - Error 409 con mensaje claro → Redirige a login

### Monitoreo y Debugging

Para ver códigos de verificación en desarrollo:

```bash
cd backend && pnpm dev
# Los códigos se imprimen en consola:
# 📧 Código de verificación para userId abc-123: 567890
```

Para testing manual:

1. Registrar usuario en `/registro`
2. Copiar código de la consola del backend
3. Ingresar en `/verificacion`
4. Ver redirección automática a `/`
5. Probar refrescar la página (el timer debe continuar desde donde estaba)

### Performance

- **Limpieza automática**: Implementar cron job que llame `cleanExpiredCodes()` cada hora
- **Índices de BD**: Ya incluidos en `userId` y `code` para búsquedas rápidas
- **Rate limiting**: Considerar limitar intentos de verificación por IP/email

### Cumplimiento

- ✅ Código de verificación de 6 dígitos
- ✅ Duración de 5 minutos
- ✅ Re-registro permitido para emails no verificados
- ✅ Muestra input de verificación en re-registro
- ✅ Login bloqueado hasta verificar
- ✅ Timer visual en frontend
- ✅ Botón de reenvío funcional
- ✅ Tests completos (11 unitarios + múltiples e2e)
