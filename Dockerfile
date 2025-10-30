# syntax=docker/dockerfile:1

# Builder stage: install all deps (incl. dev) and build TypeScript
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies first (use cached layers when possible)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Runtime stage: install only production deps and copy build output
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

# Install only production dependencies
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled code from builder
COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]