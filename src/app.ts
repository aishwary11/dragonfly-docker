import "dotenv/config";
import express, { type Express, type Request, type Response } from "express";
import { Redis as IORedis } from "ioredis";

const PORT = process.env.PORT!;

const buildRedisOptions = (): any => {
  if (process.env.REDIS_URL) {
    return { url: process.env.REDIS_URL, retryStrategy: (times: number) => Math.min(times * 200, 5000) };
  }
  return {
    host: process.env.REDIS_HOST || "localhost",
    port: Number(process.env.REDIS_PORT || 6379),
    db: Number(process.env.REDIS_DB || 0),
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    tls: process.env.REDIS_TLS === "true" ? {} : undefined,
    retryStrategy: (times: number) => Math.min(times * 200, 5000),
  };
};

const redis = new IORedis(buildRedisOptions());

redis.on("connect", () => console.log("[redis] connected"));
redis.on("error", (err: unknown) => console.error("[redis] error", err));

const app: Express = express();
app.use(express.json());
app.use(express.urlencoded());

app.get("/health", async (_req: Request, res: Response) => {
  try {
    const pong = await redis.ping();
    res.json({ status: "ok", redis: pong });
  } catch (e) {
    res.status(500).json({ status: "error", error: String(e) });
  }
});

app.get("/get/:key", async (req: Request, res: Response) => {
  const { key } = req.params as { key: string; };
  try {
    const raw = await redis.get(key);
    if (raw === null) return res.status(404).json({ error: "Not found" });
    const parsed = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    })();
    res.json({ key, value: parsed });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/set", async (req: Request, res: Response) => {
  const { key, value } = req.body || {};
  if (!key || value === undefined) {
    return res.status(400).json({ error: "`key` and `value` are required" });
  }
  try {
    await redis.set(key, JSON.stringify(value));
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/cache", async (req, res) => {
  const { key, value, ttl } = req.body || {};
  if (!key || value === undefined) {
    return res.status(400).json({ error: "`key` and `value` are required" });
  }
  try {
    if (ttl && Number.isFinite(+ttl)) {
      await redis.set(key, JSON.stringify(value), "EX", +ttl);
    } else {
      await redis.set(key, JSON.stringify(value));
    }
    res.status(201).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/cache/:key", async (req, res) => {
  try {
    const raw = await redis.get(req.params.key);
    if (raw === null) return res.status(404).json({ error: "Not found" });
    const parsed = (() => {
      try {
        return JSON.parse(raw);
      } catch {
        return raw;
      }
    })();
    res.json({ key: req.params.key, value: parsed });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.post("/incr/:key", async (req, res) => {
  try {
    const val = await redis.incr(req.params.key);
    res.json({ key: req.params.key, value: val });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get("/limited", async (req, res) => {
  const ip = req.ip || req.headers["x-forwarded-for"] || req.connection.remoteAddress;
  const key = `rate:${ip}`;
  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, 60);
    }
    if (count > 10) {
      const ttl = await redis.ttl(key);
      return res.status(429).json({ error: "Too many requests", retry_in_seconds: ttl });
    }
    res.json({ ok: true, remaining: 10 - count });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

function shutdown() {
  console.log("Shutting down...");
  redis.quit().finally(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

app.listen(PORT, () => console.log(`API listening on http://localhost:${PORT}`));
