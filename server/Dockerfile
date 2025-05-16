FROM node:22-alpine AS base
WORKDIR /app
RUN npm config set registry https://registry.npmmirror.com

FROM base AS builder
COPY package.json package-lock.json ./

# Install ALL dependencies (including devDependencies needed for the build)
RUN npm ci

COPY . .

RUN npm run build

FROM node:22-alpine AS runner
WORKDIR /app

RUN npm config set registry https://registry.npmmirror.com

COPY --from=builder /app/package.json /app/package-lock.json ./

# The server need the runtime dependencies, so we need to install package.
# --omit=dev ensures devDependencies are not installed
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

ENV NODE_ENV=production

# See esbuild.config.ts
# ENV HOCUSPOCUS_PORT=1234
# ENV HOCUSPOCUS_HOST="0.0.0.0"
# ENV DATABASE_FILE="/data/planease.db"

EXPOSE ${HOCUSPOCUS_PORT}

CMD ["node", "dist/server.mjs"]
