# Builds the provided React app (Create React App / Vite) and serves it with nginx.
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN if [ -f package-lock.json ]; then npm ci; else npm install; fi
COPY . .
# Use a relative base URL so the browser talks to nginx, which proxies /api -> backend.
ENV REACT_APP_API_URL=/api VITE_API_URL=/api
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
# CRA outputs /app/build, Vite outputs /app/dist - one of the two exists.
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
