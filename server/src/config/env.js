import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(__dirname, "../..");
const projectRoot = path.resolve(serverRoot, "..");

dotenv.config({ path: path.join(projectRoot, ".env") });
dotenv.config({ path: path.join(serverRoot, ".env"), override: true });

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(5000),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/realtime_chat"),
  REDIS_URL: z.string().optional().default(""),
  JWT_SECRET: z.string().min(16).default("dev-secret-change-me-now"),
  JWT_EXPIRES_IN: z.string().default("7d"),
  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  GOOGLE_OAUTH_REDIRECT: z.string().optional().default("")
});

export const env = schema.parse(process.env);

if (env.NODE_ENV === "production" && env.JWT_SECRET === "dev-secret-change-me-now") {
  throw new Error("JWT_SECRET must be set to a strong value in production");
}

export const allowedOrigins = env.CLIENT_URL.split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

