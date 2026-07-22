import { getFirebaseIdToken } from "./auth-store";

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

  const url = endpoint.startsWith("http") ? endpoint : `${API_BASE_URL}${endpoint}`;
  const response = await fetch(url, { ...options, headers });

  if (response.status === 204) {
    return { success: true };
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiError("Request failed", response.status);
    }
    return { success: true };
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data !== null && "message" in data
        ? String(data.message)
        : "An error occurred";
    throw new ApiError(message, response.status);
  }

  if (typeof data !== "object" || data === null) {
    throw new ApiError("Invalid response format: expected object", response.status);
  }

  const safe = data as Partial<ApiResponse<unknown>>;
  if (typeof safe.success !== "boolean") {
    safe.success = response.ok;
  }

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
