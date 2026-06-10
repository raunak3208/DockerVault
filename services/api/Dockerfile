ARG NODE_ENV=production

FROM node:20-alpine AS base
WORKDIR /app
RUN apk add --no-cache wget

FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && \
    cp -R node_modules /tmp/prod_modules && \
    npm ci

FROM deps AS builder
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runner
ARG NODE_ENV
ENV NODE_ENV=$NODE_ENV
LABEL org.opencontainers.image.title="dockervault-api"
LABEL org.opencontainers.image.description="DockerVault REST API"
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
COPY --from=builder /tmp/prod_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
USER appuser
EXPOSE 3000
CMD ["node", "dist/index.js"]
