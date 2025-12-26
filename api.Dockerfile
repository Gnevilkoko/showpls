FROM node:lts AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci --no-audit --prefer-offline || npm install

COPY . .
RUN npm run build:api:prod



FROM node:lts-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/ecosystem.api.config.js ./ecosystem.config.js
COPY --from=builder /app/. ./.
RUN npm install -g pm2
EXPOSE 3000
CMD ["/bin/sh", "-c", "npm run migration:run && pm2-runtime start ecosystem.config.js"]