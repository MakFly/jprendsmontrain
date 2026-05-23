import { api } from "../api-client";

export const customerApi = {
  read: () => api.post<Record<string, unknown>>("/customer/read-customer", {}),
  invoices: () => api.get<{ invoices: Array<Record<string, unknown>> }>("/customer/invoice"),
};
