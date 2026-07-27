"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { useState, useEffect, type ReactNode } from "react";
import { recordQuery } from "@/lib/performance/metrics";
import { CACHE_VERSION, createPersister, shouldPersist } from "@/lib/query-persister";
import { logger } from "@/lib/observability/logger";

export function QueryProvider({ children }: { children: ReactNode }): ReactNode {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            gcTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnReconnect: true,
          },
        },
      }),
  );

  useEffect(() => {
    const persister = createPersister();
    if (persister) {
      persistQueryClient({
        queryClient: queryClient as any,
        persister,
        maxAge: 24 * 60 * 60 * 1000,
        buster: CACHE_VERSION,
        dehydrateOptions: {
          shouldDehydrateQuery: (query: { queryKey: unknown }) => shouldPersist(query.queryKey),
        },
      });
    }
  }, [queryClient]);

  useEffect(() => {
    if (process.env.NODE_ENV !== "development") return;
    const hits: string[] = [];
    const misses: string[] = [];
    const unsubscribe = queryClient.getQueryCache().subscribe((event) => {
      if (event.type === "updated" && event.query.state.status === "success") {
        const hadData = event.query.state.data !== undefined;
        if (hadData) {
          hits.push(event.query.queryKey.join(","));
          recordQuery(event.query.queryKey.join(","), 0, true);
        }
      }
    });
    return () => {
      const total = hits.length;
      const rate = total > 0 ? ((hits.length / total) * 100).toFixed(0) : "0";
      logger.info("metrics", "cache-summary", { hits: hits.length, misses: misses.length, rate: `${rate}%` });
      unsubscribe();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}
