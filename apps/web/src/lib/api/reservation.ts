import { api } from "../api-client";

export const reservationApi = {
  searchTravels: (params: { origin: string; destination: string; departureDate: string }) =>
    api.post<{ travels: unknown[] }>("/reservation/search-travels", params),
  bookTravel: (params: unknown) =>
    api.post("/reservation/book-travels", params),
  cancelReservation: (reservationId: string) =>
    api.post("/reservation/cancel-reservation", { reservationId }),
  travelConsultation: () =>
    api.post<{ travels: unknown[] }>("/reservation/travel-consultation", {}),
  getTravel: (travelId: string) =>
    api.post("/reservation/get-travel", { travelId }),
  readPreferences: () =>
    api.post("/reservation/read-preferences", {}),
  updatePreferences: (prefs: unknown) =>
    api.post("/reservation/update-preferences", prefs),
};
