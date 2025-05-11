# Stage 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Set npm cache directory
RUN mkdir -p /app/.npm-cache && npm config set cache /app/.npm-cache --global

# Copy package.json dan package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --legacy-peer-deps --verbose

# Copy sisa file proyek
COPY . .

# Build aplikasi Next.js dengan verbose logging
RUN npm run build --verbose

# Debugging: Periksa isi folder .next
RUN ls -la .next || echo "Folder .next tidak ada setelah build"

# Stage 2: Run
FROM node:18-alpine

WORKDIR /app

# Set npm cache directory
RUN mkdir -p /app/.npm-cache && npm config set cache /app/.npm-cache --global

# Copy built files dari builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/next.config.mjs ./
COPY --from=builder /app/tailwind.config.ts ./

# Debugging: Periksa isi folder .next di tahap run
RUN ls -la .next || echo "Folder .next tidak ada di tahap run"

# Install production dependencies
RUN npm ci --production --legacy-peer-deps --verbose

EXPOSE 3000

CMD ["npm", "start"]