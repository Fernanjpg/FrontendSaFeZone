# Fase 1: Construcción
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

# Inyectamos la variable aquí para que Vite la "queme" en el código
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Fase 2: Servidor Nginx
FROM nginx:alpine
RUN sed -i 's/listen       80;/listen       8080;/g' /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
