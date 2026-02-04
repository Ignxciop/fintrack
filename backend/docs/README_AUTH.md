# API de Autenticación con Refresh Tokens

## 🔐 Endpoints disponibles

### 1. Registro de usuario

**POST** `/api/auth/register`

Crea un nuevo usuario en el sistema y retorna access token y refresh token.

**Body:**

```json
{
    "email": "usuario@example.com",
    "password": "password123",
    "name": "Nombre del Usuario",
    "lastname": "Apellido" // opcional
}
```

**Respuesta exitosa (201):**

```json
{
    "success": true,
    "message": "Usuario registrado exitosamente",
    "data": {
        "user": {
            "id": "uuid",
            "email": "usuario@example.com",
            "name": "Nombre del Usuario",
            "lastname": "Apellido",
            "createdAt": "2026-02-04T10:00:00.000Z"
        },
        "accessToken": "jwt-access-token-aqui",
        "refreshToken": "refresh-token-aqui"
    }
}
```

---

### 2. Inicio de sesión

**POST** `/api/auth/login`

Autentica un usuario existente y retorna access token y refresh token.

**Body:**

```json
{
    "email": "usuario@example.com",
    "password": "password123"
}
```

**Respuesta exitosa (200):**

```json
{
    "success": true,
    "message": "Inicio de sesión exitoso",
    "data": {
        "user": {
            "id": "uuid",
            "email": "usuario@example.com",
            "name": "Nombre del Usuario",
            "lastname": "Apellido",
            "createdAt": "2026-02-04T10:00:00.000Z",
            "updatedAt": "2026-02-04T10:00:00.000Z"
        },
        "accessToken": "jwt-access-token-aqui",
        "refreshToken": "refresh-token-aqui"
    }
}
```

---

### 3. Renovar access token

**POST** `/api/auth/refresh`

Renueva el access token usando un refresh token válido. El refresh token también se rota (se genera uno nuevo).

**Body:**

```json
{
    "refreshToken": "refresh-token-aqui"
}
```

**Respuesta exitosa (200):**

```json
{
    "success": true,
    "message": "Token renovado exitosamente",
    "data": {
        "user": {
            "id": "uuid",
            "email": "usuario@example.com",
            "name": "Nombre del Usuario",
            "lastname": "Apellido",
            "createdAt": "2026-02-04T10:00:00.000Z",
            "updatedAt": "2026-02-04T10:00:00.000Z"
        },
        "accessToken": "nuevo-jwt-access-token",
        "refreshToken": "nuevo-refresh-token"
    }
}
```

---

### 4. Cerrar sesión

**POST** `/api/auth/logout`

Revoca el refresh token actual (cierra la sesión actual).

**Body:**

```json
{
    "refreshToken": "refresh-token-aqui"
}
```

**Respuesta exitosa (200):**

```json
{
    "success": true,
    "message": "Logout exitoso"
}
```

---

### 5. Cerrar todas las sesiones

**POST** `/api/auth/logout-all`

Revoca todos los refresh tokens del usuario (cierra todas las sesiones activas).

**Headers:**

```
Authorization: Bearer <access-token>
```

**Respuesta exitosa (200):**

```json
{
    "success": true,
    "message": "Se han cerrado todas las sesiones"
}
```

---

### 6. Obtener información del usuario actual

**GET** `/api/auth/me`

Obtiene la información del usuario autenticado.

**Headers:**

```
Authorization: Bearer <access-token>
```

**Respuesta exitosa (200):**

```json
{
    "success": true,
    "data": {
        "user": {
            "id": "uuid",
            "email": "usuario@example.com",
            "name": "Nombre del Usuario",
            "lastname": "Apellido",
            "createdAt": "2026-02-04T10:00:00.000Z",
            "updatedAt": "2026-02-04T10:00:00.000Z"
        }
    }
}
```

---

### 7. Ver sesiones activas

**GET** `/api/auth/sessions`

Obtiene todas las sesiones activas del usuario autenticado.

**Headers:**

```
Authorization: Bearer <access-token>
```

**Respuesta exitosa (200):**

```json
{
    "success": true,
    "data": {
        "sessions": [
            {
                "id": "uuid",
                "deviceInfo": "Mozilla/5.0...",
                "ipAddress": "192.168.1.1",
                "createdAt": "2026-02-04T10:00:00.000Z",
                "expiresAt": "2026-02-11T10:00:00.000Z"
            }
        ]
    }
}
```

---

## 🔒 Seguridad de Refresh Tokens

### Características implementadas:

1. **Rotación de tokens**: Cada vez que se renueva un access token, se genera un nuevo refresh token y el anterior se revoca.

2. **Detección de reutilización**: Si se intenta usar un refresh token que ya fue usado (revocado), se revoca toda la familia de tokens del usuario por seguridad.

3. **Tokens aleatorios**: Los refresh tokens son cadenas aleatorias criptográficamente seguras (no JWT).

4. **Expiración**:
    - Access tokens: 15 minutos
    - Refresh tokens: 7 días

5. **Registro de dispositivo e IP**: Se almacena información del dispositivo y dirección IP para cada sesión.

6. **Gestión de sesiones**: Los usuarios pueden ver y cerrar sesiones individuales o todas a la vez.

---

## ✅ Validaciones

### Registro

- **email**: Debe ser un email válido
- **password**: Mínimo 6 caracteres
- **name**: Requerido, mínimo 2 caracteres
- **lastname**: Opcional, mínimo 2 caracteres si se proporciona

### Login

- **email**: Debe ser un email válido
- **password**: Requerido

---

## ❌ Respuestas de error

### Error de validación (400)

```json
{
    "success": false,
    "message": "Errores de validación",
    "errors": [
        {
            "msg": "Debe proporcionar un email válido",
            "param": "email",
            "location": "body"
        }
    ]
}
```

### Usuario ya existe (409)

```json
{
    "success": false,
    "message": "El usuario ya existe"
}
```

### Credenciales inválidas (401)

```json
{
    "success": false,
    "message": "Credenciales inválidas"
}
```

### Refresh token revocado (401)

```json
{
    "success": false,
    "message": "Refresh token revocado. Por seguridad, se han revocado todos tus tokens."
}
```

---

## 🧪 Testing

### Ejecutar todos los tests

```bash
pnpm test
```

### Ejecutar solo tests unitarios

```bash
pnpm test:unit
```

### Ejecutar solo tests e2e

```bash
pnpm test:e2e
```

### Tests con watch mode

```bash
pnpm test:watch
```

### Tests con coverage

```bash
pnpm test:coverage
```

**Nota:** Los tests utilizan datos con sufijo `_test` en el email y se limpian automáticamente después de ejecutarse.

---

## ⚙️ Configuración

### Variables de entorno requeridas

```env
# JWT Access Token (expira en 15 minutos)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=15m

# JWT Refresh Token (expira en 7 días)
JWT_REFRESH_SECRET=your-super-secret-refresh-jwt-key-change-this-in-production
JWT_REFRESH_EXPIRES_IN=7d

# Base de datos
DATABASE_URL="postgresql://user:password@localhost:5432/fintrack?schema=public"
```

### Pasos de configuración

1. Copiar `.env.example` a `.env` y configurar las variables de entorno
2. Ejecutar las migraciones de Prisma: `npx prisma migrate dev --name add_refresh_tokens`
3. Generar el cliente de Prisma: `npx prisma generate`
4. Iniciar el servidor: `pnpm dev`

---

## 💡 Flujo de autenticación recomendado

### Cliente Frontend

1. **Login/Register**: Guardar tanto `accessToken` como `refreshToken` (en localStorage o cookies httpOnly)

2. **Requests API**: Usar `accessToken` en el header Authorization

3. **Token expirado**: Si la API responde 401, intentar renovar con el endpoint `/refresh`

4. **Renovar tokens**: Llamar a `/refresh` antes de que expire el accessToken (15 minutos por defecto)

5. **Logout**: Llamar a `/logout` y eliminar tokens del almacenamiento

### Ejemplo de implementación (JavaScript)

```javascript
// Interceptor para renovar token automáticamente
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem("refreshToken");
                const { data } = await axios.post("/api/auth/refresh", {
                    refreshToken,
                });

                localStorage.setItem("accessToken", data.data.accessToken);
                localStorage.setItem("refreshToken", data.data.refreshToken);

                originalRequest.headers["Authorization"] =
                    `Bearer ${data.data.accessToken}`;
                return axios(originalRequest);
            } catch (refreshError) {
                // Redirect to login
                window.location.href = "/login";
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    },
);
```

---

## 📂 Estructura de archivos

```
backend/
├── src/
│   ├── config/
│   │   ├── config.js              # Configuración general
│   │   └── prisma.js              # Cliente de Prisma
│   ├── controllers/
│   │   └── authController.js      # Controladores HTTP
│   ├── middlewares/
│   │   ├── auth.js                # Middleware de autenticación
│   │   └── errorHandler.js        # Manejo de errores
│   ├── routes/
│   │   └── authRoutes.js          # Rutas de autenticación
│   ├── services/
│   │   ├── authService.js         # Lógica de negocio de auth
│   │   └── refreshTokenService.js # Lógica de refresh tokens
│   └── validators/
│       └── authValidator.js       # Validaciones con express-validator
├── __tests__/
│   ├── helpers/
│   │   └── testHelpers.js         # Utilidades para tests
│   ├── unit/
│   │   ├── authService.test.js    # Tests unitarios de authService
│   │   └── refreshTokenService.test.js
│   ├── e2e/
│   │   └── auth.test.js           # Tests end-to-end de endpoints
│   └── setup/
│       └── testApp.js             # App de Express para tests
├── prisma/
│   └── schema.prisma              # Schema de base de datos
├── jest.config.js                 # Configuración de Jest
└── package.json                   # Dependencias y scripts
```
