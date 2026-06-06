FROM node:22-alpine AS build
WORKDIR /app
ARG VITE_API_URL=/api
ARG VITE_SOCKET_URL=/
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_SOCKET_URL=$VITE_SOCKET_URL
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm ci --workspace client
COPY client client
RUN npm run build -w client

FROM nginx:1.27-alpine
COPY --from=build /app/client/dist /usr/share/nginx/html
EXPOSE 80
