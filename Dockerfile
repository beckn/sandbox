# syntax=docker/dockerfile:1

# Builder stage: install all deps (incl. dev) and build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install dependencies first (use cached layers when possible)
COPY package.json ./
RUN npm install

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime stage: install only production deps and copy build output
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install build dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Install only production dependencies
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

# Create data directory for SQLite
RUN mkdir -p /app/data

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist
# Copy JSON files (they are not compiled by TypeScript)
COPY --from=builder /app/src/webhook/jsons ./dist/webhook/jsons

EXPOSE 3000

CMD ["node", "dist/index.js"]