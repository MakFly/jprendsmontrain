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

  if (!response.ok) {
    throw new ApiError(response.status, data);
  }

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
