import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { CouponRepository } from '@el-bannawy/lib';

const couponRepo = new CouponRepository();

function generateCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    if (i > 0 && i % 4 === 0) code += '-';
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

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
    const role = await getEffectiveUserRole(decoded.uid);
    if (role !== 'administrator' && role !== 'teacher') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin or teacher only' } }, { status: 403 });
    }
    const result = await couponRepo.list();
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    const mapped = result.value.map((c) => ({
      id: c.id,
      code: c.code,
      coinAmount: c.coinAmount,
      maxUses: c.maxUses,
      usedCount: c.useCount,
      active: c.active,
      expiresAt: c.expiresAt,
      targetType: c.targetType || null,
      targetId: c.targetId || null,
      createdAt: c.createdAt,
    }));
    return NextResponse.json({ success: true, data: mapped });
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
    if (role !== 'administrator' && role !== 'teacher') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin or teacher only' } }, { status: 403 });
    }
    let body: {
      code?: string;
      coinAmount?: number;
      maxUses?: number;
      expiresAt?: string;
      targetType?: string;
      targetId?: string;
    };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }
    const codeStr = (body.code ?? generateCode()).toUpperCase().replace(/\s/g, '');
    const coinAmount = Number(body.coinAmount) || 0;
    const maxUses = body.maxUses ? Number(body.maxUses) : 0;
    const expiresAt = body.expiresAt ?? null;
    const targetType = (body.targetType ?? '').toUpperCase();
    const targetId = body.targetId ?? '';
    const existing = await couponRepo.getByCode(codeStr);
    if (existing.ok && existing.value) {
      return NextResponse.json({ success: false, error: { code: 'ALREADY_EXISTS', message: 'Code already exists' } }, { status: 409 });
    }
    const now = new Date().toISOString();
    const id = `coup_${Date.now()}`;
    const coupon = {
      id,
      code: codeStr,
      coinAmount,
      contentType: targetType,
      contentId: targetId,
      targetType,
      targetId,
      maxUses,
      useCount: 0,
      active: true,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    };
    const result = await couponRepo.create(coupon as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: { id, code: codeStr, coinAmount, maxUses, expiresAt, targetType: targetType || null, targetId: targetId || null } }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
