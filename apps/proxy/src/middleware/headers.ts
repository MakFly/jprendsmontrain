import type { MiddlewareHandler } from "hono";

export const headersMiddleware: MiddlewareHandler = async (c, next) => {
  const correlationId = crypto.randomUUID();
  c.set("correlationId", correlationId);
  await next();
};
