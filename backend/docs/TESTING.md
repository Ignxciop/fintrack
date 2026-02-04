# 🧪 Testing Guide

## Descripción

Este proyecto incluye tests unitarios y e2e (end-to-end) para asegurar la calidad del código y el correcto funcionamiento de la API de autenticación.

## 🎯 Características de Testing

### ✅ Tests Unitarios

- Tests para `AuthService`: registro, login, refresh tokens, logout, getMe
- Tests para `RefreshTokenService`: generación, validación, revocación de tokens
- Cobertura de casos de éxito y casos de error
- Tests de seguridad (detección de reutilización de tokens)

### ✅ Tests E2E

- Tests completos de todos los endpoints
- Tests de flujos completos de autenticación
- Validación de respuestas HTTP
- Tests de validación de datos
- Tests de seguridad y manejo de errores

### ✅ Limpieza automática

- Todos los datos de prueba tienen sufijo `_test` en el email
- Los tests limpian automáticamente los datos antes y después de ejecutarse
- Ejecución segura sin afectar datos reales

## 📋 Scripts disponibles

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

### Tests en modo watch (desarrollo)

```bash
pnpm test:watch
```

### Tests con reporte de cobertura

```bash
pnpm test:coverage
```

## 🏗️ Estructura de tests

```
__tests__/
├── helpers/
│   └── testHelpers.js           # Utilidades compartidas
│       ├── cleanupTestData()    # Limpia datos de prueba
│       ├── generateTestEmail()  # Genera emails únicos con sufijo _test
│       ├── createTestUser()     # Crea usuarios de prueba
│       └── createTestRefreshToken() # Crea tokens de prueba
├── unit/
│   ├── authService.test.js      # Tests de AuthService
│   └── refreshTokenService.test.js # Tests de RefreshTokenService
├── e2e/
│   └── auth.test.js             # Tests de endpoints API
└── setup/
    └── testApp.js               # App Express para tests e2e
```

## 🔧 Configuración

### Jest Configuration

El archivo `jest.config.js` está configurado para:

- Usar Node como entorno de prueba
- Soportar módulos ES6
- Recolectar cobertura de código
- Ejecutar tests en serie (runInBand) para evitar conflictos en DB

### Test Helpers

Los helpers proporcionan utilidades para:

- **cleanupTestData()**: Elimina usuarios y tokens con email que termina en `_test`
- **generateTestEmail()**: Genera emails únicos como `user_timestamp_random_test`
- **createTestUser()**: Crea usuarios con contraseña hasheada
- **createTestRefreshToken()**: Crea tokens de refresh para testing

## 📊 Cobertura de tests

### AuthService (Unit Tests)

- ✅ `register()` - Registro exitoso
- ✅ `register()` - Error usuario duplicado
- ✅ `register()` - Hasheo de contraseña
- ✅ `login()` - Login exitoso
- ✅ `login()` - Error email inválido
- ✅ `login()` - Error contraseña incorrecta
- ✅ `refreshAccessToken()` - Renovación exitosa
- ✅ `refreshAccessToken()` - Error token inválido
- ✅ `refreshAccessToken()` - Error token expirado
- ✅ `refreshAccessToken()` - Detección de reutilización
- ✅ `logout()` - Revocación de token
- ✅ `logoutAll()` - Revocación de todos los tokens
- ✅ `getMe()` - Obtener usuario
- ✅ `getMe()` - Error ID inválido
- ✅ `getActiveSessions()` - Listar sesiones activas
- ✅ `getActiveSessions()` - Filtrar tokens expirados/revocados

### RefreshTokenService (Unit Tests)

- ✅ `generateRefreshToken()` - Generación única
- ✅ `createRefreshToken()` - Creación en DB
- ✅ `validateRefreshToken()` - Validación exitosa
- ✅ `validateRefreshToken()` - Error token inválido
- ✅ `validateRefreshToken()` - Error token expirado
- ✅ `validateRefreshToken()` - Detección de reutilización
- ✅ `revokeRefreshToken()` - Revocación simple
- ✅ `revokeRefreshToken()` - Registro de reemplazo
- ✅ `cleanExpiredTokens()` - Limpieza de tokens
- ✅ `revokeAllUserTokens()` - Revocación masiva
- ✅ `getUserActiveTokens()` - Filtrado de tokens activos

### API Endpoints (E2E Tests)

- ✅ POST `/api/auth/register` - Registro exitoso
- ✅ POST `/api/auth/register` - Error email duplicado
- ✅ POST `/api/auth/register` - Validación de datos
- ✅ POST `/api/auth/login` - Login exitoso
- ✅ POST `/api/auth/login` - Error credenciales inválidas
- ✅ POST `/api/auth/login` - Validación de datos
- ✅ POST `/api/auth/refresh` - Renovación exitosa
- ✅ POST `/api/auth/refresh` - Error sin token
- ✅ POST `/api/auth/refresh` - Error token inválido
- ✅ POST `/api/auth/refresh` - Detección de reutilización
- ✅ POST `/api/auth/logout` - Logout exitoso
- ✅ GET `/api/auth/me` - Obtener usuario autenticado
- ✅ GET `/api/auth/me` - Error sin autenticación
- ✅ POST `/api/auth/logout-all` - Cerrar todas las sesiones
- ✅ GET `/api/auth/sessions` - Listar sesiones activas
- ✅ Full Auth Flow - Flujo completo de autenticación

## 🚀 Ejemplo de ejecución

```bash
# Ejecutar todos los tests
$ pnpm test

PASS  __tests__/unit/authService.test.js
PASS  __tests__/unit/refreshTokenService.test.js
PASS  __tests__/e2e/auth.test.js

Test Suites: 3 passed, 3 total
Tests:       47 passed, 47 total
Snapshots:   0 total
Time:        5.234 s
```

## 📝 Escribir nuevos tests

### Test Unitario

```javascript
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { AuthService } from "../../src/services/authService.js";
import { cleanupTestData, generateTestEmail } from "../helpers/testHelpers.js";

describe("Mi nuevo test", () => {
    beforeAll(async () => {
        await cleanupTestData();
    });

    afterAll(async () => {
        await cleanupTestData();
    });

    it("debe hacer algo específico", async () => {
        const email = generateTestEmail("mytest");
        // ... tu código de test
        expect(result).toBe(expected);
    });
});
```

### Test E2E

```javascript
import { describe, it, expect } from "@jest/globals";
import request from "supertest";
import app from "../setup/testApp.js";
import { cleanupTestData } from "../helpers/testHelpers.js";

describe("Mi nuevo endpoint", () => {
    it("debe responder correctamente", async () => {
        const response = await request(app)
            .post("/api/mi-endpoint")
            .send({ data: "value" })
            .expect(200);

        expect(response.body.success).toBe(true);
    });
});
```

## ⚠️ Consideraciones importantes

1. **Aislamiento de datos**: Siempre usar emails con sufijo `_test` para evitar conflictos con datos reales

2. **Limpieza**: Llamar `cleanupTestData()` en `beforeAll`, `afterAll` y opcionalmente en `beforeEach`

3. **Tests en serie**: Los tests se ejecutan en serie (`--runInBand`) para evitar race conditions en la base de datos

4. **Base de datos**: Asegurarse de tener una base de datos de testing configurada o usar la misma DB con sufijos `_test`

5. **Variables de entorno**: Los tests usan las mismas variables de entorno del archivo `.env`

## 🐛 Debugging

### Ver output detallado

```bash
pnpm test -- --verbose
```

### Ejecutar un test específico

```bash
pnpm test -- authService.test.js
```

### Ejecutar tests que coincidan con un patrón

```bash
pnpm test -- --testNamePattern="login"
```

## 📈 Mejores prácticas

✅ **DO:**

- Usar nombres descriptivos para los tests
- Limpiar datos antes y después de cada suite
- Usar helpers para crear datos de prueba
- Verificar tanto casos de éxito como de error
- Mantener tests independientes entre sí

❌ **DON'T:**

- No usar datos reales o emails sin sufijo `_test`
- No depender del orden de ejecución de los tests
- No crear datos sin limpiarlos después
- No hacer tests que dependan de otros tests
- No hacer commits sin ejecutar los tests

## 🔗 Referencias

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [Testing Best Practices](https://testingjavascript.com/)
