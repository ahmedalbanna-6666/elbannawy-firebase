import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { FinalReviewRepository } from '@el-bannawy/lib';

const reviewRepo = new FinalReviewRepository();

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id: finalReviewId } = await params;
    const result = await reviewRepo.listAttempts(decoded.uid, finalReviewId);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id: finalReviewId } = await params;

    const existingAttemptsResult = await reviewRepo.listAttempts(decoded.uid, finalReviewId);
    if (!existingAttemptsResult.ok) {
      return NextResponse.json({ success: false, error: existingAttemptsResult.error }, { status: 500 });
    }
    const attemptNumber = existingAttemptsResult.value.length + 1;

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const attemptId = crypto.randomUUID();
    const result = await reviewRepo.createAttempt({
      id: attemptId,
      studentId: decoded.uid,
      finalReviewId,
      attemptNumber,
      status: 'in_progress',
      maxScore: (body.maxScore as number) ?? 0,
      startedAt: new Date().toISOString(),
      contentVersion: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
