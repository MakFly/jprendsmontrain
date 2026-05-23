import type { MiddlewareHandler } from "hono";

interface Bucket {
  tokens: number;
  lastRefill: number;
}

const buckets = new Map<string, Bucket>();
const MAX_TOKENS = 60;
const REFILL_RATE = 1; // tokens per second
const CLEANUP_INTERVAL = 60_000;

setInterval(() => {
  const cutoff = Date.now() - 120_000;
  for (const [key, bucket] of buckets) {
    if (bucket.lastRefill < cutoff) buckets.delete(key);
  }
}, CLEANUP_INTERVAL);

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const xff = c.req.header("x-forwarded-for");
  const ip =
    (xff ? xff.split(",").pop()?.trim() : undefined) ??
    c.req.header("x-real-ip") ??
    "unknown";

  const now = Date.now();
  let bucket = buckets.get(ip);

  if (!bucket) {
    bucket = { tokens: MAX_TOKENS, lastRefill: now };
    buckets.set(ip, bucket);
  }

  const elapsed = (now - bucket.lastRefill) / 1000;
  bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + elapsed * REFILL_RATE);
  bucket.lastRefill = now;

  if (bucket.tokens < 1) {
    const retryAfter = Math.ceil((1 - bucket.tokens) / REFILL_RATE);
    c.header("Retry-After", String(retryAfter));
    return c.json(
      { error: "RATE_LIMITED", message: "Too many requests" },
      429,
    );
  }

  bucket.tokens -= 1;
  await next();
};
