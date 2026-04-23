# ---------- 1. Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package.json package-lock.json ./
RUN npm ci

# Copy project files
COPY . .

# Build Next.js app
RUN npm run build

# ---------- 2. Production stage ----------
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy only necessary files from builder
COPY --from=builder /app ./

# Remove dev dependencies (optional cleanup)
RUN npm prune --production

EXPOSE 8002

CMD ["npm", "start"]
