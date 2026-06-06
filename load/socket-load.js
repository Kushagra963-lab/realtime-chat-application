import { io } from "socket.io-client";
import { performance } from "node:perf_hooks";

const API_URL = process.env.LOAD_API_URL ?? "http://localhost:5000/api";
const SOCKET_URL = process.env.LOAD_SOCKET_URL ?? "http://localhost:5000";
const CLIENTS = Number(process.env.LOAD_CLIENTS ?? 200);
const PASSWORD = process.env.LOAD_PASSWORD ?? "Password123!";
const EMAILS = (process.env.LOAD_EMAILS ?? "aarav@example.com,maya@example.com,riya@example.com,dev@example.com,kushagra@example.com")
  .split(",")
  .map((email) => email.trim())
  .filter(Boolean);

async function login(email) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD })
  });

  if (!response.ok) {
    throw new Error(`Login failed for ${email}: ${response.status}`);
  }

  return response.json();
}

async function getConversation(token) {
  const response = await fetch(`${API_URL}/conversations`, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!response.ok) {
    throw new Error(`Conversation fetch failed: ${response.status}`);
  }

  const data = await response.json();
  return data.conversations[0];
}

function percentile(values, p) {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return Math.round(sorted[index]);
}

async function runClient(index, token, conversationId) {
  return new Promise((resolve) => {
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket"],
      reconnection: false,
      timeout: 10000
    });

    const finish = (result) => {
      socket.disconnect();
      resolve(result);
    };

    socket.on("connect", () => {
      const startedAt = performance.now();
      socket.emit("message:send", {
        conversationId,
        body: `Load test message ${index}`,
        clientId: `load-${index}-${Date.now()}`
      }, (ack) => {
        if (!ack?.ok) {
          finish({ ok: false, error: ack?.message ?? "ack failed" });
          return;
        }
        finish({ ok: true, latency: performance.now() - startedAt });
      });
    });

    socket.on("connect_error", (error) => {
      finish({ ok: false, error: error.message });
    });
  });
}

const accounts = await Promise.all(EMAILS.map(login));
const conversation = await getConversation(accounts[0].token);

if (!conversation) {
  throw new Error("No seeded conversation found. Run npm run seed first.");
}

console.log(`Running ${CLIENTS} concurrent socket clients against ${conversation.name}`);

const results = await Promise.all(
  Array.from({ length: CLIENTS }, (_, index) => runClient(
    index + 1,
    accounts[index % accounts.length].token,
    conversation.id
  ))
);

const failures = results.filter((result) => !result.ok);
const latencies = results.filter((result) => result.ok).map((result) => result.latency);

console.log({
  clients: CLIENTS,
  ok: latencies.length,
  failures: failures.length,
  p50: percentile(latencies, 50),
  p95: percentile(latencies, 95),
  p99: percentile(latencies, 99),
  max: Math.round(Math.max(...latencies))
});

if (failures.length) {
  console.log("Sample failures:", failures.slice(0, 5));
  process.exitCode = 1;
}

