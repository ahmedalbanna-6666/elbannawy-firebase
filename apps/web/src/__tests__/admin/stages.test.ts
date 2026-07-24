import { describe, it, expect, vi } from 'vitest';

vi.mock('@/lib/firebase/auth-helper', () => ({
  requireAdmin: vi.fn().mockResolvedValue({ authorized: true }),
}));

describe('GET /api/v1/admin/stages', () => {
  it('returns stages from static constants', async () => {
    const { GET } = await import('@/app/api/v1/admin/stages/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/stages'));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
  });
});

describe('GET /api/v1/admin/grades', () => {
  it('returns grades from static constants', async () => {
    const { GET } = await import('@/app/api/v1/admin/grades/route');
    const response = await GET(new (await import('next/server')).NextRequest('http://localhost/api/v1/admin/grades'));
    const body = await response.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.data.length).toBeGreaterThanOrEqual(12);
  });
});
