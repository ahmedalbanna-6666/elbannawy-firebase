import { getFirebaseIdToken } from "./auth-store";
import { recordApiCall } from "./performance/metrics";
import { logger, generateRequestId } from "./observability/logger";

const API_BASE_URL = "/api/v1";

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  extraHeaders?: Record<string, string>,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string> | undefined),
    ...extraHeaders,
  };

  if (!headers.Authorization) {
    const token = await getFirebaseIdToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  const method = (options.method ?? "GET") as string;
  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const requestId = generateRequestId();
  const startTime = performance.now();
  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    const durationMs = performance.now() - startTime;
    logger.error("api", `${method} ${endpoint} network failure`, { requestId, durationMs, error: err instanceof Error ? err.message : String(err) });
    recordApiCall(endpoint, method, durationMs, 0, 0);
    throw new ApiError(
      err instanceof Error ? err.message : "Network request failed",
      0,
    );
  }
  const durationMs = performance.now() - startTime;

  if (response.status === 204) {
    logger.info("api", `${method} ${endpoint} 204`, { requestId, durationMs });
    recordApiCall(endpoint, method, durationMs, 0, 204);
    return { success: true };
  }

  let data: unknown;
  let payloadSizeBytes = 0;
  try {
    const text = await response.text();
    payloadSizeBytes = new Blob([text]).size;
    data = JSON.parse(text);
  } catch {
    if (!response.ok) {
      logger.error("api", `${method} ${endpoint} ${response.status} parse failed`, { requestId, durationMs, status: response.status });
      recordApiCall(endpoint, method, durationMs, payloadSizeBytes, response.status);
      throw new ApiError("Request failed", response.status);
    }
    logger.warn("api", `${method} ${endpoint} empty/parse success`, { requestId, durationMs });
    recordApiCall(endpoint, method, durationMs, payloadSizeBytes, response.status);
    return { success: true };
  }

  if (!response.ok) {
    logger.warn("api", `${method} ${endpoint} ${response.status}`, { requestId, durationMs, status: response.status });
    recordApiCall(endpoint, method, durationMs, payloadSizeBytes, response.status);
    const body = data as Record<string, unknown> | null;
    const message =
      body?.error && typeof body.error === "object"
        ? String((body.error as Record<string, unknown>).message ?? "")
        : body?.message
          ? String(body.message)
          : "An error occurred";
    throw new ApiError(message, response.status);
  }

  if (typeof data !== "object" || data === null) {
    logger.error("api", `${method} ${endpoint} invalid JSON response`, { requestId, durationMs });
    recordApiCall(endpoint, method, durationMs, payloadSizeBytes, response.status);
    throw new ApiError("Invalid response format: expected object", response.status);
  }

  const safe = data as Partial<ApiResponse<unknown>>;
  if (typeof safe.success !== "boolean") {
    safe.success = response.ok;
  }

  logger.info("api", `${method} ${endpoint} ${response.status}`, { requestId, durationMs, sizeBytes: payloadSizeBytes });
  recordApiCall(endpoint, method, durationMs, payloadSizeBytes, response.status);
  return data as ApiResponse<T>;
}

export const api = {
  get: <T>(endpoint: string, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> =>
    request<T>(endpoint, {}, extraHeaders),
  post: <T>(endpoint: string, body?: unknown, extraHeaders?: Record<string, string>): Promise<ApiResponse<T>> =>
    request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    }, extraHeaders),
  put: <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> =>
    request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> =>
    request<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string): Promise<ApiResponse<T>> =>
    request<T>(endpoint, { method: "DELETE" }),
};

export { ApiError };
