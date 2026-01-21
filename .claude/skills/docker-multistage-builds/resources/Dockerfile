# syntax=docker/dockerfile:1.4

# ============================================================================
# STAGE 1: Dependencies
# Installs only production dependencies without build tools
# This layer is cached aggressively
# ============================================================================
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm@latest && \
    pnpm install --frozen-lockfile --prod --ignore-scripts

# ============================================================================
# STAGE 2: Builder
# Full environment with build tools
# Installs all dependencies and compiles the Next.js app
# ============================================================================
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache \
    libc6-compat \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    giflib-dev
COPY pnpm-lock.yaml package.json ./
RUN npm i -g pnpm@latest && \
    pnpm install --frozen-lockfile
COPY . .

# Build-time environment variables
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_VERSION
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}
ENV NEXT_PUBLIC_VERSION=${NEXT_PUBLIC_VERSION}

RUN pnpm run build

# ============================================================================
# STAGE 3: Runner (Final Production Image)
# Minimal image with only runtime dependencies
# No build tools included
# ============================================================================
FROM node:20-alpine AS runner
WORKDIR /app

# Install tini (proper init for PID 1 signal handling)
# Create non-root user for security
RUN apk add --no-cache tini && \
    addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy production dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy built application from builder stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy public assets with correct ownership
COPY --chown=nextjs:nodejs /app/public ./public

# Runtime environment configuration
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
EXPOSE 3000

# Health check for container orchestration (Kubernetes, Docker Swarm, etc.)
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => {if (r.statusCode !== 200) throw new Error(r.statusCode)})"

# Security: run as non-root user
USER nextjs

# Proper init and signal handling
# tini will be PID 1 and forward signals to node process
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "server.js"]
