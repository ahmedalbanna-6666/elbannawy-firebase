import { NextResponse, type NextRequest } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { getPermissionsForRole, type UserRole } from '@el-bannawy/shared';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const db = getAdminDb();
    const usersSnap = await db.collection('users').where('role', '==', 'teacher').select().get();
    const results = { updated: 0, skipped: 0, errors: 0, details: [] as string[] };

    for (const doc of usersSnap.docs) {
      try {
        const uid = doc.id;
        const permDoc = await db.collection('userPermissions').doc(uid).get();
        if (permDoc.exists) {
          results.skipped++;
          continue;
        }

        const defaultPermissions = getPermissionsForRole('TEACHER' as UserRole);
        await db.collection('userPermissions').doc(uid).set({
          permissions: defaultPermissions,
          updatedAt: new Date().toISOString(),
        });

        results.updated++;
        results.details.push(`Seeded permissions for ${uid}`);
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: results,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Permission migration failed' } },
      { status: 500 },
    );
  }
}
