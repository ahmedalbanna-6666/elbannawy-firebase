import { expect } from 'vitest';
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

export async function expectSuccess(response: Response): Promise<void> {
  expect(response.status).toBeGreaterThanOrEqual(200);
  expect(response.status).toBeLessThan(300);
  const body = await response.json() as Record<string, unknown>;
  if (body && typeof body === 'object') {
    expect(body.success).toBe(true);
  }
}

export async function expectError(response: Response, expectedStatus: number): Promise<void> {
  expect(response.status).toBe(expectedStatus);
  const body = await response.json() as Record<string, unknown>;
  if (body && typeof body === 'object') {
    expect(body.success).toBe(false);
  }
}
