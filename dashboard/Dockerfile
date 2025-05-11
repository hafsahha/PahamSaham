# Stage 1: build
FROM node:18-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: production run
FROM node:18-alpine AS runner
WORKDIR /app

# Copy built output dan dependencies dari builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/tailwind.config.ts ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/app ./app

ENV PATH="./node_modules/.bin:$PATH"

RUN ls -la node_modules/.bin && node_modules/.bin/next --version

EXPOSE 3000

CMD ["npm", "start"]