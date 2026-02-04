# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar pnpm
RUN npm install -g pnpm

# Copiar archivos de dependencias
COPY package.json pnpm-lock.yaml ./

# Instalar dependencias
RUN pnpm install --frozen-lockfile

# Copiar código fuente
COPY . .

# Argumento para la URL de la API (vacío para usar proxy de nginx)
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

# Build de producción
RUN pnpm build

# Stage 2: Production con nginx
FROM nginx:alpine

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar archivos build desde stage anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Exponer puerto
EXPOSE 4003

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:4003 || exit 1

# Comando para iniciar nginx
CMD ["nginx", "-g", "daemon off;"]
