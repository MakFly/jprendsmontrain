import { Hono } from "hono";
import { API_PATHS } from "@max-sncf/shared";
import { requireSession } from "../middleware/session.js";
import { proxyPost, proxyGet } from "../lib/proxy-handler.js";

export const subscriptionRoutes = new Hono()
  .use("/*", requireSession)
  .post("/summary", (c) => proxyPost(c, API_PATHS.SUBSCRIPTION_SUMMARY))
  .get("/qrcode", (c) => proxyGet(c, API_PATHS.SUBSCRIPTION_QRCODE))
  .post("/reinsurance", (c) => proxyPost(c, API_PATHS.SUBSCRIPTION_REINSURANCE))
  .post("/cgv/accept", (c) => proxyPost(c, API_PATHS.SUBSCRIPTION_CGV_ACCEPT))
  .post("/cgv/reject", (c) => proxyPost(c, API_PATHS.SUBSCRIPTION_CGV_REJECT))
  .get("/available-purchase-proof", (c) => proxyGet(c, API_PATHS.SUBSCRIPTION_PURCHASE_PROOF))
  .post("/download-annual-purchase-proof", (c) =>
    proxyPost(c, API_PATHS.SUBSCRIPTION_DOWNLOAD_PROOF),
  );
