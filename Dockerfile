FROM node:20-alpine AS base
WORKDIR /app

# Build the application
FROM base AS builder
COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npm run build
RUN npm prune --omit=dev

# Production image
FROM base AS runner
ENV NODE_ENV=production

# Select user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 expressjs

# Redownload only production dependencies
COPY package.json ./

# Copy compiled JS from builder and change ownership
COPY --chown=expressjs:nodejs --from=builder /app/dist ./dist
COPY --chown=expressjs:nodejs --from=builder /app/node_modules ./node_modules
# Assuming your WORKDIR is /app
COPY --chown=expressjs:nodejs --from=builder /app/src/assets ./src/assets
# COPY --chown=expressjs:nodejs --from=builder /app/ssl ./ssl

# Select user
USER expressjs

# Expose the port the app runs on
EXPOSE 5001
ENV PORT=5001

# Start the application
CMD ["node", "dist/src/server.js"]