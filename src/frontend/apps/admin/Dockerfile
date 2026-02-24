FROM node:20-alpine AS build
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@10.29.3 --activate

# Copy workspace manifests
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/styles/package.json ./packages/styles/
COPY apps/admin/package.json ./apps/admin/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/styles/ ./packages/styles/
COPY apps/admin/ ./apps/admin/

# VITE_API_BASE_URL must be set as a Railway build variable
ARG VITE_API_BASE_URL
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

RUN pnpm --filter admin build

FROM node:20-alpine
RUN npm install -g serve
COPY --from=build /app/apps/admin/dist /app/dist

ENV PORT=3000
CMD serve -s /app/dist -l $PORT
