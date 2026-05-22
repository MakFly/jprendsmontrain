import { Hono } from "hono";
import { API_PATHS } from "@max-sncf/shared";
import { requireSession } from "../middleware/session.js";
import { proxyPost, proxyGet } from "../lib/proxy-handler.js";

export const reservationRoutes = new Hono()
  .use("/*", requireSession)
  .post("/search-travels", (c) => proxyPost(c, API_PATHS.RESERVATION_SEARCH))
  .post("/book-travels", (c) => proxyPost(c, API_PATHS.RESERVATION_BOOK))
  .post("/cancel-reservation", (c) => proxyPost(c, API_PATHS.RESERVATION_CANCEL))
  .post("/travel-confirm", (c) => proxyPost(c, API_PATHS.RESERVATION_CONFIRM))
  .post("/exchange-search", (c) => proxyPost(c, API_PATHS.RESERVATION_EXCHANGE_SEARCH))
  .post("/exchange-confirm", (c) => proxyPost(c, API_PATHS.RESERVATION_EXCHANGE_CONFIRM))
  .post("/read-preferences", (c) => proxyPost(c, API_PATHS.RESERVATION_PREFERENCES_READ))
  .post("/update-preferences", (c) => proxyPost(c, API_PATHS.RESERVATION_PREFERENCES_UPDATE))
  .post("/travel-consultation", (c) => proxyPost(c, API_PATHS.RESERVATION_CONSULTATION))
  .post("/get-travel", (c) => proxyPost(c, API_PATHS.RESERVATION_GET_TRAVEL))
  .post("/print-travel", (c) => proxyPost(c, API_PATHS.RESERVATION_PRINT))
  .post("/download-summary", (c) => proxyPost(c, API_PATHS.RESERVATION_DOWNLOAD_SUMMARY))
  .get("/get-transaction", (c) => proxyGet(c, API_PATHS.RESERVATION_TRANSACTION))
  .get("/equivalent-stations", (c) => proxyGet(c, API_PATHS.RESERVATION_EQUIVALENT_STATIONS))
  .get("/seat-map", (c) => proxyGet(c, API_PATHS.RESERVATION_SEAT_MAP));
