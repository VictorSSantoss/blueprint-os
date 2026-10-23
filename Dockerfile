FROM oven/bun:alpine AS build
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .
RUN bun run build

FROM joseluisq/static-web-server:2-alpine
COPY --from=build /app/dist /public
ENV SERVER_PORT=80
ENV SERVER_ROOT=/public
ENV SERVER_FALLBACK_PAGE=./index.html
EXPOSE 80
