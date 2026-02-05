FROM node:20-alpine

# Instalar wget para health check
RUN apk add --no-cache wget

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

CMD ["sh", "-c", "pnpm prisma migrate resolve --applied 20260204121951_add_refresh_tokens || true && pnpm prisma migrate resolve --applied 20260204132257_add_email_verification || true && pnpm prisma migrate resolve --applied 20260205094242_add_accounts || true && pnpm prisma migrate resolve --applied 20260205102400_add_transactions || true && pnpm prisma migrate resolve --applied 20260205131915_add_new_transaction_types || true && pnpm prisma migrate resolve --rolled-back 20260205173500_add_categories_recurrings_budgets || true && pnpm prisma migrate deploy && node index.js"]
