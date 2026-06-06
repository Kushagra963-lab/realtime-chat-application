FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
COPY client/package*.json client/
COPY server/package*.json server/
RUN npm ci

FROM deps AS build
COPY client client
RUN npm run build -w client

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY server/package*.json server/
COPY client/package*.json client/
RUN npm ci --omit=dev --workspace server
COPY server server
COPY --from=build /app/client/dist client/dist
EXPOSE 5000
CMD ["npm", "run", "start", "-w", "server"]
