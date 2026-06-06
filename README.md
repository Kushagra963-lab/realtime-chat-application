# Realtime Chat Application

A MERN + Socket.io + Tailwind chat application with JWT auth, Google OAuth, groups, notifications, message search, presence, typing indicators, Redux Toolkit state, and production deployment scaffolding.

## Features

- Realtime Socket.io messaging with optimistic UI and delivery acknowledgements.
- JWT email/password auth plus Google OAuth callback support.
- Group and direct conversations with member management.
- Message search across conversations using MongoDB text indexes.
- Unread notifications, read receipts, typing indicators, and online presence.
- Redux Toolkit slices for auth, conversations, messages, notifications, and socket lifecycle.
- Redis Socket.io adapter support for horizontal scaling.
- Docker Compose for MongoDB, Redis, API, and client.
- Load test script for 200 concurrent socket clients.

## Local Setup

```bash
npm install
cp .env.example server/.env
npm run dev
```

Start MongoDB and Redis locally, or run the full stack:

```bash
docker compose up --build
```

The client runs at `http://localhost:5173` and the API at `http://localhost:5000`.

## Seed Demo Users

```bash
npm run seed
```

Demo password for all seeded users: `Password123!`

## Load Test

With the server running and seeded users available:

```bash
npm run load:socket
```

The script creates 200 socket clients, sends messages, and reports p50/p95/p99 acknowledgement latency. Actual sub-150 ms latency depends on hosting region, MongoDB/Redis placement, and network path.

## Production Environment

Set these variables on the host:

```bash
MONGODB_URI=mongodb+srv://...
REDIS_URL=redis://...
JWT_SECRET=...
CLIENT_URL=https://your-domain.example
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_OAUTH_REDIRECT=https://your-domain.example/api/auth/google/callback
```

The Express server serves the built React app from `client/dist` in production, so one Node service can host the complete app.
