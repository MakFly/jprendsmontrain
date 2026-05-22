import { cors } from "hono/cors";
import { config } from "../config.js";

export const corsMiddleware = cors({
  origin: config.pwaOrigin,
  credentials: true,
  allowHeaders: ["Content-Type", "Authorization"],
  exposeHeaders: ["x-captcha-url"],
  maxAge: 86400,
});
