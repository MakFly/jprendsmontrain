export const SNCF_BACKEND_URL =
  "https://www.maxactif-tgvinoui.sncf";

export const SNCF_AUTH_DOMAIN = "https://monidentifiant.sncf";

export const CLIENT_APP = "MAX_ACTIF";
export const DISTRIBUTION_CHANNEL = "SNCF-CONNECT";

export const SNCF_HEADERS = {
  CLIENT_APP: "x-client-app",
  CLIENT_APP_VERSION: "x-client-app-version",
  CLIENT_AUTH: "x-client-auth",
  CORRELATION_ID: "x-syg-correlation-id",
  DISTRIBUTION_CHANNEL: "x-distribution-channel",
  XSRF_TOKEN: "X-XSRF-TOKEN",
} as const;

export const XSRF_COOKIE_NAME = "XSRF-TOKEN";

export const API_PATHS = {
  // Auth
  AUTH_INIT: "/api/public/auth/init",
  AUTH_CALLBACK: "/api/public/auth/callback",
  AUTH_REFRESH: "/api/public/auth/refresh",
  AUTH_LOGOUT: "/api/public/auth/logout",

  // Subscription
  SUBSCRIPTION_SUMMARY: "/api/public/subscription/summary",
  SUBSCRIPTION_QRCODE: "/api/public/subscription/qrcode",
  SUBSCRIPTION_REINSURANCE: "/api/public/subscription/reinsurance",
  SUBSCRIPTION_CGV_ACCEPT: "/api/public/subscription/cgv/accept",
  SUBSCRIPTION_CGV_REJECT: "/api/public/subscription/cgv/reject",
  SUBSCRIPTION_PURCHASE_PROOF:
    "/api/public/subscription/available-purchase-proof",
  SUBSCRIPTION_DOWNLOAD_PROOF:
    "/api/public/subscription/download-annual-purchase-proof",

  // Customer
  CUSTOMER_READ: "/api/public/customer/read-customer",
  CUSTOMER_UPDATE_BILLING: "/api/public/customer/update-bill-to-v2",
  CUSTOMER_INVOICES: "/api/public/customer/invoice",
  CUSTOMER_READ_IBAN: "/api/public/customer/read-iban-number",

  // Reservation
  RESERVATION_SEARCH: "/api/public/reservation/search-travels",
  RESERVATION_BOOK: "/api/public/reservation/book-travels",
  RESERVATION_CANCEL: "/api/public/reservation/cancel-reservation",
  RESERVATION_CONFIRM: "/api/public/reservation/travel-confirm",
  RESERVATION_EXCHANGE_SEARCH: "/api/public/reservation/exchange-search",
  RESERVATION_EXCHANGE_CONFIRM: "/api/public/reservation/exchange-confirm",
  RESERVATION_PREFERENCES_READ: "/api/public/reservation/read-preferences",
  RESERVATION_PREFERENCES_UPDATE: "/api/public/reservation/update-preferences",
  RESERVATION_CONSULTATION: "/api/public/reservation/travel-consultation",
  RESERVATION_GET_TRAVEL: "/api/public/reservation/get-travel",
  RESERVATION_PRINT: "/api/public/reservation/print-travel",
  RESERVATION_TRANSACTION: "/api/public/reservation/get-transaction",
  RESERVATION_EQUIVALENT_STATIONS:
    "/api/public/reservation/equivalent-stations",
  RESERVATION_SEAT_MAP: "/api/public/reservation/seat-map",
  RESERVATION_DOWNLOAD_SUMMARY: "/api/public/reservation/download-summary",

  // Reference data
  REFDATA_STATIONS: "/api/public/refdata/freeplaces-stations",
  REFDATA_SEARCH_PROPOSALS: "/api/public/refdata/search-freeplaces-proposals",

  // Invoice
  INVOICE_REGULARIZATION_INIT: "/api/public/invoice/regularization-init",
  INVOICE_REGULARIZATION_CONFIRM: "/api/public/invoice/regularization-confirm",

  // CGV
  CGV: "/api/public/cgv",
} as const;

export const SESSION_COOKIE_NAME = "max-session";
export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
