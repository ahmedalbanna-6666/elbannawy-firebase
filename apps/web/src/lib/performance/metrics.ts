const isDev = process.env.NODE_ENV === "development";

interface ApiMetric {
  endpoint: string;
  method: string;
  durationMs: number;
  payloadSizeBytes: number;
  status: number;
}

interface QueryMetric {
  queryKey: string;
  durationMs: number;
  fromCache: boolean;
}

let apiMetrics: ApiMetric[] = [];
let queryMetrics: QueryMetric[] = [];
const pageTimers = new Map<string, number>();

export function startPageLoad(name: string): void {
  if (!isDev) return;
  pageTimers.set(name, performance.now());
}

export function endPageLoad(name: string): void {
  if (!isDev) return;
  const start = pageTimers.get(name);
  if (!start) return;
  pageTimers.delete(name);
  const elapsed = performance.now() - start;
  console.log(`[Perf] Page "${name}" loaded in ${elapsed.toFixed(0)}ms`);
}

export function recordApiCall(
  endpoint: string,
  method: string,
  durationMs: number,
  payloadSizeBytes: number,
  status: number,
): void {
  if (!isDev) return;
  apiMetrics.push({ endpoint, method, durationMs, payloadSizeBytes, status });
}

export function recordQuery(
  queryKey: string,
  durationMs: number,
  fromCache: boolean,
): void {
  if (!isDev) return;
  queryMetrics.push({ queryKey, durationMs, fromCache });
}

export function printSummary(): void {
  if (!isDev) return;
  if (apiMetrics.length > 0) {
    console.group("[Perf] API Calls");
    console.table(
      apiMetrics.map((m) => ({
        endpoint: m.endpoint,
        method: m.method,
        duration: `${m.durationMs.toFixed(0)}ms`,
        size: `${(m.payloadSizeBytes / 1024).toFixed(1)}KB`,
        status: m.status,
      })),
    );
    console.groupEnd();
  }
  if (queryMetrics.length > 0) {
    const hits = queryMetrics.filter((q) => q.fromCache).length;
    const total = queryMetrics.length;
    const rate = ((hits / total) * 100).toFixed(0);
    console.log(`[Perf] Queries: ${total} total, ${hits} cache hits, ${total - hits} cache misses (${rate}% hit rate)`);
  }
}

export function resetMetrics(): void {
  if (!isDev) return;
  apiMetrics = [];
  queryMetrics = [];
}
