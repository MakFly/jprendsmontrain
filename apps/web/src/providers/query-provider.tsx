"use client";

import { useEffect, useState } from "react";
import {
  QueryClient,
  QueryClientProvider,
  dehydrate,
  hydrate,
} from "@tanstack/react-query";
import { ApiError, CaptchaError } from "@/lib/api-client";

const CACHE_KEY = "max-query-cache";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            // Keep cached data for a day so it survives reloads / offline use.
            gcTime: 24 * 60 * 60 * 1000,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.status === 401) return false;
              if (error instanceof CaptchaError) return false;
              return failureCount < 2;
            },
            // Mobile fires focus constantly (taps, keyboard, address-bar
            // hide); refetching on each would spam the API and make data
            // flicker/error when SNCF cookies are momentarily stale. Keep the
            // cached data stable; navigation + manual reload still refetch.
            refetchOnWindowFocus: false,
            // When offline, serve whatever is cached instead of erroring.
            networkMode: "offlineFirst",
          },
          mutations: { retry: false, networkMode: "offlineFirst" },
        },
      }),
  );

  // Restore persisted cache once, synchronously, before children read queries.
  const [restored, setRestored] = useState(false);
  if (typeof window !== "undefined" && !restored) {
    try {
      const raw = window.localStorage.getItem(CACHE_KEY);
      if (raw) hydrate(queryClient, JSON.parse(raw));
    } catch {
      /* ignore corrupt cache */
    }
    setRestored(true);
  }

  // Persist the cache (debounced) whenever it changes, so the last-seen data
  // (trips, QR data-URIs, subscription…) stays available offline.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const persist = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        try {
          const state = dehydrate(queryClient, {
            shouldDehydrateQuery: (q) => q.state.status === "success",
          });
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(state));
        } catch {
          /* storage full / serialization issue — non-fatal */
        }
      }, 600);
    };
    const unsub = queryClient.getQueryCache().subscribe(persist);
    return () => {
      unsub();
      if (timer) clearTimeout(timer);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
