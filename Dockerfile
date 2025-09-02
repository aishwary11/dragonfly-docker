ARG NODE_VERSION=22-alpine

FROM node:${NODE_VERSION} AS base
WORKDIR /usr/src/app

# Install development dependencies (for building)
FROM base AS dev-deps
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci --no-audit --no-fund

# Build stage - produce optimized output
FROM dev-deps AS build
COPY . .
RUN npm run build:min

# Prepare production-only dependencies
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm npm ci --omit=dev --ignore-scripts --no-audit --no-fund

# Production runtime
FROM node:${NODE_VERSION} AS runner
ENV NODE_ENV=production
ENV PORT=3000
WORKDIR /usr/src/app

# Copy production dependencies and built files with correct ownership for non-root user
COPY --chown=node:node --from=prod-deps /usr/src/app/node_modules ./node_modules
COPY --chown=node:node package.json ./
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

USER node
EXPOSE 3000
CMD ["node", "dist/app.js"]
