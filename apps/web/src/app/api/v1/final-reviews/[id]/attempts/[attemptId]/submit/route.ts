import { NextRequest, NextResponse } from "next/server";
import { FinalReviewService } from "@el-bannawy/lib";
import { authenticateRequest } from "@/lib/firebase/auth-helper";
import { internalError, unauthorized, getRequestBody } from "@/lib/route-helpers";

const reviewService = new FinalReviewService();

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string; attemptId: string }> }): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) return unauthorized();
    const body = await getRequestBody<{ answers?: Array<{ questionId: string; answer: string }> }>(request);
    if (body instanceof NextResponse) return body;
    const { id: finalReviewId, attemptId } = await params;
    const attemptResult = await reviewService.getAttempt(attemptId);
    if (!attemptResult.ok) return NextResponse.json({ success: false, error: attemptResult.error, timestamp: new Date().toISOString() }, { status: 500 });
    if (!attemptResult.value) return NextResponse.json({ success: false, error: { code: "NOT_FOUND", message: "Attempt not found" }, timestamp: new Date().toISOString() }, { status: 404 });
    if (attemptResult.value.studentId !== decoded.uid) return NextResponse.json({ success: false, error: { code: "FORBIDDEN", message: "Not your attempt" }, timestamp: new Date().toISOString() }, { status: 403 });
    if (attemptResult.value.status !== "in_progress") return NextResponse.json({ success: false, error: { code: "CONFLICT", message: "Attempt already submitted" }, timestamp: new Date().toISOString() }, { status: 409 });
    const answers = body.answers ?? [];
    let totalScore = 0;
    const maxScore = attemptResult.value.maxScore;
    const answerResults: Array<Record<string, unknown>> = [];
    for (const ans of answers) {
      const answerId = crypto.randomUUID();
      const questionSnap = await reviewService.listQuestions(finalReviewId, undefined);
      const question = questionSnap.ok ? questionSnap.value.find((q) => q.id === ans.questionId) : undefined;
      const isCorrect = question ? question.correctAnswer?.toLowerCase() === ans.answer.toLowerCase() : false;
      const score = isCorrect ? (question?.points ?? 0) : 0;
      totalScore += score;
      const createResult = await reviewService.createAnswer({
        id: answerId, attemptId, studentId: decoded.uid, finalReviewId,
        questionId: ans.questionId, answer: ans.answer, isCorrect, score,
        submittedAt: new Date().toISOString(), createdAt: new Date().toISOString(),
      });
      if (createResult.ok) answerResults.push(createResult.value as unknown as Record<string, unknown>);
    }
    const now = new Date();
    const startedAt = new Date(attemptResult.value.startedAt).getTime();
    const timeSpentSeconds = Math.round((now.getTime() - startedAt) / 1000);
    const updateResult = await reviewService.updateAttempt(attemptId, {
      status: "submitted", score: totalScore, maxScore,
      passed: totalScore >= maxScore * 0.5,
      submittedAt: now.toISOString(), gradedAt: now.toISOString(), timeSpentSeconds,
    });
    if (!updateResult.ok) return NextResponse.json({ success: false, error: updateResult.error, timestamp: new Date().toISOString() }, { status: 500 });
    return NextResponse.json({ success: true, data: { attempt: updateResult.value, answers: answerResults, summary: { totalScore, maxScore, passed: totalScore >= maxScore * 0.5, answeredCount: answers.length, correctCount: answerResults.filter((a) => a.isCorrect).length } }, timestamp: new Date().toISOString() });
  } catch (error) { return internalError(error); }
}
