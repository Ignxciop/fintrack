# Frontend - FinTrack

Sistema de autenticación con React, TypeScript, TailwindCSS y shadcn/ui.

## 🚀 Características

- ✅ Autenticación con JWT y Refresh Tokens
- ✅ Sesión persistente con renovación automática de tokens
- ✅ Rutas protegidas con redirección automática
- ✅ Componentes UI con shadcn/ui
- ✅ Diseño responsive con TailwindCSS
- ✅ TypeScript para type safety

## 📂 Estructura del Proyecto

```
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de shadcn/ui
│   ├── ProtectedRoute.tsx  # HOC para rutas protegidas
│   └── PublicRoute.tsx     # HOC para rutas públicas
├── context/            # Context API para estado global
│   └── AuthContext.tsx # Contexto de autenticación
├── lib/                # Utilidades y configuraciones
│   ├── api.ts          # Configuración de axios con interceptors
│   └── utils.ts        # Utilidades de shadcn
├── pages/              # Páginas de la aplicación
│   ├── HomePage.tsx    # Página principal (protegida)
│   ├── LoginPage.tsx   # Página de inicio de sesión
│   └── RegisterPage.tsx # Página de registro
├── services/           # Servicios de API
│   └── authService.ts  # Servicios de autenticación
├── App.tsx             # Componente principal (orquestador)
└── main.tsx            # Punto de entrada
```

## 🔐 Sistema de Autenticación

### Flujo de Autenticación

1. **Login/Registro**: El usuario ingresa sus credenciales
2. **Tokens**: El backend retorna `accessToken` (15 min) y `refreshToken` (7 días)
3. **Almacenamiento**: Los tokens se guardan en `localStorage`
4. **Interceptor**: Axios agrega automáticamente el `accessToken` a cada petición
5. **Renovación**: Si el `accessToken` expira, se renueva automáticamente con el `refreshToken`
6. **Logout**: Se revocan los tokens y se redirige al login

## 🛠️ Instalación y Configuración

### 1. Instalar dependencias

```bash
pnpm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Edita `.env`:

```env
VITE_API_URL=http://localhost:4005/api
```

### 3. Ejecutar en desarrollo

```bash
pnpm dev
```

Aplicación disponible en `http://localhost:5173`

## 🔧 Scripts Disponibles

```bash
pnpm dev          # Modo desarrollo
pnpm build        # Compilar para producción
pnpm preview      # Previsualizar build
pnpm lint         # Ejecutar ESLint
```

## 📦 Componentes de shadcn/ui Instalados

- `Button` - Botones con variantes
- `Input` - Campos de entrada
- `Card` - Tarjetas de contenido
- `Label` - Etiquetas para formularios
- `Form` - Componentes de formulario

### Agregar más componentes

```bash
pnpm dlx shadcn@latest add [component-name]
```

## 📚 Tecnologías

- **React 19** - Biblioteca UI
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navegación
- **Axios** - Cliente HTTP
- **TailwindCSS** - Estilos
- **shadcn/ui** - Componentes UI
