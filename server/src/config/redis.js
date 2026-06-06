import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import { env } from "./env.js";

export async function attachRedisAdapter(io) {
  if (!env.REDIS_URL) {
    return null;
  }

  const pubClient = new Redis(env.REDIS_URL, { lazyConnect: true });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  return { pubClient, subClient };
}
