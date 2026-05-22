import { api } from "../api-client";
import type { AuthInitResponse, AuthStatusResponse } from "@max-sncf/shared";

export const authApi = {
  init: () => api.get<AuthInitResponse>("/auth/init"),
  callback: (code: string) =>
    api.post<{ success: boolean }>("/auth/callback", { code }),
  refresh: () => api.post<{ success: boolean }>("/auth/refresh"),
  logout: () =>
    api.get<{ redirectLogoutSession: string | null }>("/auth/logout"),
  status: () => api.get<AuthStatusResponse>("/auth/status"),
  submitDataDome: (cookies: string[]) =>
    api.post<{ success: boolean }>("/auth/datadome", { cookies }),
};
