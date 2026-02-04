FROM node:20-alpine

RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
	adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma/
RUN pnpm prisma generate

COPY --chown=nodejs:nodejs . .

USER nodejs

EXPOSE 4006

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=5 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4006/health || exit 1

CMD ["sh", "-c", "pnpm prisma db push --accept-data-loss --skip-generate && pnpm start"]
