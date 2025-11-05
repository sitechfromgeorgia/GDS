# Georgian Distribution Management - Frontend
# Multi-stage build for optimal production image
# React 19 + Next.js 15 + Node.js 22 LTS

# Stage 1: Dependencies & Builder
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copy package files and install ALL dependencies (including devDependencies for build)
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the application (React 19 + Next.js 15)
RUN npm run build:docker

# Stage 2: Runner
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the entire built application
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Set correct permissions
USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the application using npm start
CMD ["npm", "run", "start:docker"]
