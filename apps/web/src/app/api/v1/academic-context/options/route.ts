import { NextRequest, NextResponse } from 'next/server';
import type { DocumentData } from 'firebase-admin/firestore';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

interface StageOption {
  id: string;
  name: string;
  grades: { id: string; name: string }[];
}

interface TermOption {
  id: string;
  name: string;
}

function getName(data: DocumentData, field: string): string {
  const val: unknown = data[field];
  return typeof val === 'string' ? val : '';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const db = getAdminDb();

    const stagesSnap = await db
      .collection('stages')
      .where('deletedAt', '==', null)
      .where('isActive', '==', true)
      .orderBy('order', 'asc')
      .get();

    const stagesData: Record<string, string> = {};
    const stageIds: string[] = [];

    stagesSnap.forEach((doc) => {
      const data = doc.data();
      stagesData[doc.id] = getName(data, 'nameAr') || getName(data, 'name');
      stageIds.push(doc.id);
    });

    const stageGradeMap = new Map<string, { id: string; name: string }[]>();

    if (stageIds.length > 0) {
      const gradesSnap = await db
        .collection('grades')
        .where('deletedAt', '==', null)
        .where('isActive', '==', true)
        .where('stageId', 'in', stageIds)
        .orderBy('order', 'asc')
        .get();

      gradesSnap.forEach((doc) => {
        const data = doc.data();
        const sid: unknown = data.stageId;
        if (typeof sid !== 'string') return;
        const entry = stageGradeMap.get(sid) ?? [];
        entry.push({
          id: doc.id,
          name: getName(data, 'nameAr') || getName(data, 'name'),
        });
        stageGradeMap.set(sid, entry);
      });
    }

    const stages: StageOption[] = stageIds.map((id) => ({
      id,
      name: stagesData[id],
      grades: stageGradeMap.get(id) ?? [],
    }));

    const termsSnap = await db
      .collection('academicTerms')
      .where('deletedAt', '==', null)
      .where('isActive', '==', true)
      .orderBy('order', 'asc')
      .get();

    const terms: TermOption[] = [];
    termsSnap.forEach((doc) => {
      const data = doc.data();
      terms.push({ id: doc.id, name: getName(data, 'nameAr') || getName(data, 'name') });
    });

    return NextResponse.json(
      {
        success: true,
        data: { stages, terms },
        timestamp: new Date().toISOString(),
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
