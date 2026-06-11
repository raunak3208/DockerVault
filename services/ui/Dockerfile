FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
COPY package.json ./
RUN npm install

FROM deps AS builder
COPY . .
RUN npm run build

FROM nginx:1.25-alpine AS runner
LABEL org.opencontainers.image.title="dockervault-ui"
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
