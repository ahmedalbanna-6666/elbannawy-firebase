import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

const CONFIG_ID = 'ai-config';

export async function GET(): Promise<NextResponse> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('aiConfig').doc(CONFIG_ID).get();
    if (!doc.exists) {
      return NextResponse.json({
        success: true,
        data: {
          provider: 'openai',
          apiKey: '',
          model: 'gpt-4o-mini',
          endpoint: 'https://api.openai.com/v1/chat/completions',
          ragEnabled: true,
          ragMaxResults: 5,
          ragSimilarityThreshold: 0.7,
          temperature: 0.7,
          maxTokens: 2048,
          updatedAt: null,
        },
      });
    }
    return NextResponse.json({ success: true, data: doc.data() });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch AI config' } }, { status: 500 });
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const data = {
      ...body,
      updatedAt: now,
    };
    await db.collection('aiConfig').doc(CONFIG_ID).set(data, { merge: true });
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update AI config' } }, { status: 500 });
  }
}
