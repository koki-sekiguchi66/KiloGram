# ベースイメージ
FROM node:20-alpine AS base

WORKDIR /app

COPY package*.json ./
RUN npm ci

# 開発環境
FROM base AS development

COPY . .

EXPOSE 5173
CMD ["npm", "run", "dev", "--", "--host"]

# ビルドステージ
FROM base AS builder

COPY . .
RUN npm run build

# 本番環境（Nginx）
FROM nginx:alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

# Nginx設定
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]