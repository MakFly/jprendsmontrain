import { api } from "../api-client";

export const subscriptionApi = {
  summary: () => api.post<Record<string, unknown>>("/subscription/summary", {}),
  qrcode: () => api.get<ArrayBuffer>("/subscription/qrcode"),
};
