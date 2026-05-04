# Этап сборки
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .
RUN npm run build

# Этап production (nginx)
FROM nginx:alpine

# Удаляем дефолтный конфиг
RUN rm -rf /usr/share/nginx/html/*

# Копируем билд
COPY --from=builder /app/dist /usr/share/nginx/html

# Кастомный nginx конфиг (важно для SPA)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
