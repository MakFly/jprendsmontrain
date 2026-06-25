const PROXY_URL = process.env.NEXT_PUBLIC_PROXY_URL || "http://localhost:3333";

export class ApiError extends Error {
  constructor(
    public status: number,
    public data: unknown,
  ) {
    super(`API Error ${status}`);
    this.name = "ApiError";
  }
}

export class CaptchaError extends Error {
  constructor(public captchaUrl: string) {
    super("Captcha required");
    this.name = "CaptchaError";
  }
}

type CaptchaHandler = (url: string) => void;
let captchaHandler: CaptchaHandler | null = null;

export function onCaptchaRequired(handler: CaptchaHandler) {
  captchaHandler = handler;
}

type SessionExpiredHandler = () => void;
let sessionExpiredHandler: SessionExpiredHandler | null = null;

// Notified whenever the proxy answers 401 — i.e. the captured SNCF cookies
// rotated and the session can no longer read the account. Lets the app prompt
// a re-login instead of letting read pages render a misleading empty state.
export function onSessionExpired(handler: SessionExpiredHandler) {
  sessionExpiredHandler = handler;
}

type SessionOkHandler = () => void;
let sessionOkHandler: SessionOkHandler | null = null;

// Notified on any successful data response: proof the session can read SNCF
// again, so a previously-shown "expired/captcha" banner can be dismissed.
export function onSessionOk(handler: SessionOkHandler) {
  sessionOkHandler = handler;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${PROXY_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });

  const data = await response.json();

  if (
    data &&
    typeof data === "object" &&
    "error" in data &&
    data.error === "CAPTCHA_REQUIRED"
  ) {
    const captchaUrl = (data as { captchaUrl: string }).captchaUrl;
    captchaHandler?.(captchaUrl);
    throw new CaptchaError(captchaUrl);
  }

  // Session-health signals must reflect the SNCF session, which only real data
  // calls exercise. /auth/* are proxy control-plane endpoints that answer
  // 200/401 on the proxy JWT alone — a refresh/status 200 would WRONGLY clear
  // the "SNCF disconnected" banner (and a control-plane 401 wrongly raise it).
  // So drive the banner only from data calls; let /auth/* stay silent.
  const isControlPlane = path.startsWith("/auth/");

  if (response.status === 401 && !isControlPlane) {
    sessionExpiredHandler?.();
  }

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

  if (!isControlPlane) sessionOkHandler?.();
  return data as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }),
};
