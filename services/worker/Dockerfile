FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    cp -R node_modules /tmp/prod_modules && \
    npm ci

FROM deps AS builder
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
LABEL org.opencontainers.image.title="dockervault-worker"
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /tmp/prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
USER appuser
CMD ["node", "dist/index.js"]
