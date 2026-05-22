import { Hono } from "hono";
import { API_PATHS } from "@max-sncf/shared";
import { requireSession } from "../middleware/session.js";
import { proxyPost, proxyGet } from "../lib/proxy-handler.js";

export const customerRoutes = new Hono()
  .use("/*", requireSession)
  .post("/read-customer", (c) => proxyPost(c, API_PATHS.CUSTOMER_READ))
  .post("/update-bill-to-v2", (c) => proxyPost(c, API_PATHS.CUSTOMER_UPDATE_BILLING))
  .get("/invoice", (c) => proxyGet(c, API_PATHS.CUSTOMER_INVOICES))
  .post("/read-iban-number", (c) => proxyPost(c, API_PATHS.CUSTOMER_READ_IBAN));
