import http from "node:http";
import { env } from "./config/env.js";
import { connectDatabase } from "./config/database.js";
import { attachRedisAdapter } from "./config/redis.js";
import { createApp } from "./app.js";
import { createSocketServer, registerSocketHandlers } from "./socket/index.js";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const server = http.createServer(app);
  const io = createSocketServer(server);

  await attachRedisAdapter(io);
  registerSocketHandlers(io);
  app.set("io", io);

  server.listen(env.PORT, () => {
    console.log(`Realtime chat server listening on port ${env.PORT}`);
  });

  const shutdown = async () => {
    io.close();
    server.close(() => process.exit(0));
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});

