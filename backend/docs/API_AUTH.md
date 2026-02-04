# API de Autenticación

## Endpoints disponibles

### 1. Registro de usuario

**POST** `/api/auth/register`

Crea un nuevo usuario en el sistema.

**Body:**

```json
{
    "email": "usuario@example.com",
    "password": "password123",
    "name": "Nombre del Usuario"
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
            "createdAt": "2026-02-04T10:00:00.000Z"
        },
        "token": "jwt-token-aqui"
    }
}
```

---

### 2. Inicio de sesión

**POST** `/api/auth/login`

Autentica un usuario existente.

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
            "createdAt": "2026-02-04T10:00:00.000Z",
            "updatedAt": "2026-02-04T10:00:00.000Z"
        },
        "token": "jwt-token-aqui"
    }
}
```

---

### 3. Obtener información del usuario actual

**GET** `/api/auth/me`

Obtiene la información del usuario autenticado.

**Headers:**

```
Authorization: Bearer <token>
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
            "createdAt": "2026-02-04T10:00:00.000Z",
            "updatedAt": "2026-02-04T10:00:00.000Z"
        }
    }
}
```

---

## Validaciones

### Registro

- **email**: Debe ser un email válido
- **password**: Mínimo 6 caracteres
- **name**: Requerido, mínimo 2 caracteres

### Login

- **email**: Debe ser un email válido
- **password**: Requerido

---

## Respuestas de error

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

### Token no proporcionado (401)

```json
{
    "success": false,
    "message": "Token no proporcionado"
}
```

### Token inválido (401)

```json
{
    "success": false,
    "message": "Token inválido"
}
```

### Usuario no encontrado (404)

```json
{
    "success": false,
    "message": "Usuario no encontrado"
}
```

---

## Configuración

Antes de ejecutar el servidor, asegúrate de:

1. Copiar `.env.example` a `.env` y configurar las variables de entorno
2. Ejecutar las migraciones de Prisma: `npx prisma migrate dev`
3. Generar el cliente de Prisma: `npx prisma generate`

## Ejecutar el servidor

```bash
pnpm dev
```
