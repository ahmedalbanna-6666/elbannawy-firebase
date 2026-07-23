import { NextResponse, type NextRequest } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

export async function POST(_request: NextRequest): Promise<NextResponse> {
  try {
    const adminAuth = getAdminAuth();
    const db = getAdminDb();

    const listResult = await adminAuth.listUsers();
    const firebaseUsers = listResult.users;
    const results = { created: 0, skipped: 0, errors: 0, details: [] as string[] };

    for (const fbUser of firebaseUsers) {
      try {
        const existingDoc = await db.collection('users').doc(fbUser.uid).get();
        if (existingDoc.exists) {
          results.skipped++;
          continue;
        }

        const claims = fbUser.customClaims ?? {};
        const role = (claims as Record<string, string>).role ?? 'student';
        const now = new Date().toISOString();

        await db.collection('users').doc(fbUser.uid).set({
          id: fbUser.uid,
          fullName: fbUser.displayName ?? 'User',
          englishName: null,
          email: fbUser.email ?? null,
          mobileNumber: fbUser.phoneNumber ?? (fbUser.email?.replace('@el-bannawy.app', '') ?? null),
          role,
          status: 'active',
          isActive: true,
          governorate: null,
          school: null,
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
        });

        results.created++;
        results.details.push(`Created ${role}: ${fbUser.uid} (${fbUser.displayName ?? 'N/A'})`);
      } catch {
        results.errors++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        totalFirebaseUsers: firebaseUsers.length,
        ...results,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Migration failed' } },
      { status: 500 },
    );
  }
}
