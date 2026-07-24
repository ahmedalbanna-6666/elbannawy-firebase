import { mockStore } from './setup';

export function seedCollection(collectionPath: string, docs: Array<{ id: string; data: Record<string, unknown> }>): void {
  for (const doc of docs) {
    mockStore.setDoc(`${collectionPath}/${doc.id}`, { ...doc.data, id: doc.id });
  }
}

export function clearStore(): void {
  mockStore.clear();
}

export function createMockRequest(
  url: string,
  options?: { method?: string; body?: unknown; cookies?: Record<string, string> },
): { url: string; method: string; body: unknown; cookies: Record<string, string>; headers: Record<string, string> } {
  return {
    url,
    method: options?.method ?? 'GET',
    body: options?.body,
    cookies: options?.cookies ?? { auth_token: 'test-token' },
    headers: {},
  };
}

export function expectSuccess(response: { statusCode: number; body: unknown }): void {
  expect(response.statusCode).toBeGreaterThanOrEqual(200);
  expect(response.statusCode).toBeLessThan(300);
  if (response.body && typeof response.body === 'object') {
    const body = response.body as Record<string, unknown>;
    expect(body.success).toBe(true);
  }
}

export function expectError(response: { statusCode: number; body: unknown }, expectedStatus: number): void {
  expect(response.statusCode).toBe(expectedStatus);
  if (response.body && typeof response.body === 'object') {
    const body = response.body as Record<string, unknown>;
    expect(body.success).toBe(false);
  }
}
