# syntax=docker/dockerfile:1.6

# Shared base image with the Node.js runtime used throughout the build pipeline
FROM node:20-alpine AS base
WORKDIR /app

# Install all dependencies (including devDependencies) once and share the layer with later stages
FROM base AS deps
ENV NODE_ENV=development
COPY package*.json ./
RUN npm ci

# Build the client and server bundles using the previously installed dependencies
FROM deps AS builder
COPY . .
RUN npm run build

# Install only production dependencies for the final runtime image
FROM base AS prod-deps
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev

# Slim production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=5000

COPY --from=prod-deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY package*.json ./

# Basic API-driven health check – adjust the path if you expose a dedicated probe endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD node -e "const port=process.env.PORT||5000;fetch('http://127.0.0.1:'+port+'/',{method:'HEAD'}).then(res=>{if(res.status>=400)process.exit(1);}).catch(()=>process.exit(1));"

EXPOSE 5000
CMD ["node", "dist/index.cjs"]
