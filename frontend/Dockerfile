# syntax=docker/dockerfile:1

# ---------- 1) build: compila o React ----------
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Endereço da API visto pelo NAVEGADOR. "/api" é repassado pelo nginx ao backend (mesma origem, sem CORS).
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

# ---------- 2) runtime: nginx servindo os arquivos estáticos ----------
FROM nginx:1.31-alpine AS runtime
COPY nginx/security-headers.conf /etc/nginx/snippets/security-headers.conf
COPY nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
