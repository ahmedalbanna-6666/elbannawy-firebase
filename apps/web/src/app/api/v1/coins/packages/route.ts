import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { CoinPackageRepository } from '@el-bannawy/lib';

const coinPackageRepo = new CoinPackageRepository();

async function getEffectiveUserRole(uid: string): Promise<string> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      const data = doc.data()!;
      const role = (data as Record<string, unknown>).role;
      if (typeof role === 'string') return normalizeRole(role);
      if (role && typeof role === 'object') {
        const nestedRole = (role as Record<string, unknown>).role;
        if (typeof nestedRole === 'string') return normalizeRole(nestedRole);
      }
    }
  } catch {}
  try {
    const firebaseUser = await getAdminAuth().getUser(uid);
    const claims = (firebaseUser.customClaims ?? {}) as Record<string, string>;
    if (claims.role) return normalizeRole(claims.role);
  } catch {}
  return 'student';
}

export async function GET(_request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const result = await coinPackageRepo.listActive();
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    const data = result.value.map((pkg) => ({ ...pkg, price: pkg.priceMinorUnits }));
    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const role = await getEffectiveUserRole(decoded.uid);
    if (role !== 'administrator') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin only' } }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const pkg = {
      id: body.id as string || `pkg_${Date.now()}`,
      name: body.name as string,
      description: body.description as string | undefined,
      coinAmount: body.coinAmount as number,
      priceMinorUnits: (body.priceMinorUnits as number) ?? (body.price as number) ?? 0,
      currency: (body.currency as string) || 'EGP',
      active: body.active !== false,
      displayOrder: (body.displayOrder as number) || 0,
      createdAt: now,
      updatedAt: now,
    };

    const result = await coinPackageRepo.create(pkg as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
