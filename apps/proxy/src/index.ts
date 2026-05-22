import { Hono } from "hono";
import { logger } from "hono/logger";
import { config } from "./config.js";
import { corsMiddleware } from "./middleware/cors.js";
import { headersMiddleware } from "./middleware/headers.js";
import { rateLimitMiddleware } from "./middleware/rate-limit.js";
import { authRoutes } from "./routes/auth.js";
import { reservationRoutes } from "./routes/reservation.js";
import { subscriptionRoutes } from "./routes/subscription.js";
import { customerRoutes } from "./routes/customer.js";
import { refdataRoutes } from "./routes/refdata.js";
import { bridgeRoutes } from "./routes/bridge.js";

const app = new Hono()
  .use("*", logger())
  .use("*", corsMiddleware)
  .use("*", headersMiddleware)
  .use("*", rateLimitMiddleware)
  .get("/health", (c) => c.json({ status: "ok", version: config.appVersion }))
  .route("/auth", authRoutes)
  .route("/reservation", reservationRoutes)
  .route("/subscription", subscriptionRoutes)
  .route("/customer", customerRoutes)
  .route("/refdata", refdataRoutes)
  .route("/bridge", bridgeRoutes);

console.log(`MAX SNCF Proxy running on http://localhost:${config.port}`);

export default {
  port: config.port,
  fetch: app.fetch,
};
