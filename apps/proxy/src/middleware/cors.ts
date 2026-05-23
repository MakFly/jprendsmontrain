import { cors } from "hono/cors";
import { config } from "../config.js";

export const corsMiddleware = cors({
  // Reflect any allowlisted origin (localhost for desktop dev, the LAN IP for
  // phone testing). Returning the matched origin keeps credentialed requests valid.
  origin: (origin) =>
    config.pwaOrigins.includes(origin) ? origin : config.pwaOrigins[0],
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["x-captcha-url"],
  maxAge: 86400,
});
