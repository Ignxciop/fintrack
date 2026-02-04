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

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:4006/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["sh", "-c", "pnpm prisma db push --accept-data-loss --skip-generate && pnpm start"]
