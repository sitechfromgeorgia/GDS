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

# Build arguments for environment variables (provided at build time)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV NODE_OPTIONS="--max-old-space-size=4096"
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Copy logo restoration script and generation script explicitly if not in .
COPY restore_logo.js ./
COPY generate-pwa-assets.js ./

# Build the application (React 19 + Next.js 15)
# Note: npm run build:docker maps to 'next build', so we update package.json's build:docker or just use build
RUN node restore_logo.js && node generate-pwa-assets.js && npm run build:docker

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
