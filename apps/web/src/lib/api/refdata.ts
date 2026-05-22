import { api } from "../api-client";

export const refdataApi = {
  getStations: () =>
    api.get<{ stations: Array<{ code: string; label: string }> }>(
      "/refdata/freeplaces-stations",
    ),
};
