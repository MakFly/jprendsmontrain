import { SNCF_BACKEND_URL } from "@max-sncf/shared";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const config = {
  port: parseInt(process.env.PORT || "3333", 10),
  sncfBackendUrl: process.env.SNCF_BACKEND_URL || SNCF_BACKEND_URL,
  pwaOrigin: process.env.PWA_ORIGIN || "http://localhost:3000",
  sessionSecret: required("SESSION_SECRET"),
  cookieDomain: process.env.COOKIE_DOMAIN || "localhost",
  appVersion: process.env.APP_VERSION || "1.0.0",
} as const;
