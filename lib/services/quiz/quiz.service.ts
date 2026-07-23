import { QuizRepository } from '../../repositories/quiz/quiz.repository';
import { QuizQuestionRepository } from '../../repositories/quiz/quiz-question.repository';
import { QuizAttemptRepository } from '../../repositories/quiz/quiz-attempt.repository';
import { QuizAnswerRepository } from '../../repositories/quiz/quiz-answer.repository';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IQuiz, IQuizQuestion, IQuizAttempt, IQuizAnswer } from '../../repositories/contracts';

export class QuizService {
  private readonly quizRepo = new QuizRepository();
  private readonly questionRepo = new QuizQuestionRepository();
  private readonly attemptRepo = new QuizAttemptRepository();
  private readonly answerRepo = new QuizAnswerRepository();

  async getQuiz(lessonId: string): Promise<RepositoryResult<IQuiz | null>> {
    return this.quizRepo.getByLessonId(lessonId);
  }

  async getQuestions(lessonId: string): Promise<RepositoryResult<IQuizQuestion[] | null>> {
    const quiz = await this.quizRepo.getByLessonId(lessonId);
    if (!quiz.ok || !quiz.value) return { ok: false, error: { code: 'NOT_FOUND', message: 'Quiz not found', retryable: false, requestId: '' } } as unknown as RepositoryResult<IQuizQuestion[] | null>;
    return this.questionRepo.listByQuiz(quiz.value.id);
  }

  async getUnlockStatus(studentId: string, lessonId: string): Promise<RepositoryResult<{ locked: boolean; reason?: string }>> {
    const quiz = await this.quizRepo.getByLessonId(lessonId);
    if (!quiz.ok || !quiz.value) return { ok: true, value: { locked: true, reason: 'No quiz for this lesson' } };
    const attempts = await this.attemptRepo.listByStudentAndQuiz(studentId, quiz.value.id);
    const passed = attempts.ok ? attempts.value.some((a) => a.passed) : false;
    return { ok: true, value: { locked: !passed, reason: passed ? undefined : 'Quiz not yet passed' } };
  }

  async startAttempt(studentId: string, lessonId: string): Promise<RepositoryResult<IQuizAttempt>> {
    const quiz = await this.quizRepo.getByLessonId(lessonId);
    if (!quiz.ok || !quiz.value) return { ok: false, error: { code: 'NOT_FOUND', message: 'Quiz not found', retryable: false, requestId: '' } };
    const count = await this.attemptRepo.countByStudentAndQuiz(studentId, quiz.value.id);
    if (!count.ok) return count as unknown as RepositoryResult<IQuizAttempt>;
    if (!quiz.value.unlimitedAttempts && count.value >= quiz.value.maxAttempts) return { ok: false, error: { code: 'FORBIDDEN', message: 'Maximum attempts reached', retryable: false, requestId: '' } };
    const attemptNumber = count.value + 1;
    return this.attemptRepo.create({ id: `${studentId}_${quiz.value.id}_${attemptNumber}`, studentId, quizId: quiz.value.id, attemptNumber });
  }

  async saveProgress(studentId: string, lessonId: string, answers: Record<string, unknown>[]): Promise<RepositoryResult<void>> {
    const qr = await this.quizRepo.getByLessonId(lessonId);
    if (!qr.ok || !qr.value) return { ok: false, error: { code: 'NOT_FOUND', message: 'Quiz not found', retryable: false, requestId: '' } };
    let attempt = await this.attemptRepo.getActive(studentId, qr.value.id);
    if (!attempt.ok || !attempt.value) {
      const count = await this.attemptRepo.countByStudentAndQuiz(studentId, qr.value.id);
      attempt = await this.attemptRepo.create({ id: `${studentId}_${qr.value.id}_${(count.ok ? count.value : 0) + 1}`, studentId, quizId: qr.value.id, attemptNumber: (count.ok ? count.value : 0) + 1 });
      if (!attempt.ok) return attempt as unknown as RepositoryResult<void>;
    }
    const activeAttempt = attempt.value;
    if (!activeAttempt) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to create attempt', retryable: false, requestId: '' } } as unknown as RepositoryResult<void>;
    await this.answerRepo.deleteByAttempt(activeAttempt.id);
    for (const [index, ans] of answers.entries()) {
      await this.answerRepo.create({ id: `${activeAttempt.id}_${index}`, attemptId: activeAttempt.id, studentId, quizId: qr.value.id, questionId: String(ans.questionId ?? ''), answer: ans.answer as Record<string, unknown> ?? {} });
    }
    return { ok: true, value: undefined };
  }

  async submitQuiz(studentId: string, lessonId: string, answers: Record<string, unknown>[], timeSpentSeconds?: number): Promise<RepositoryResult<IQuizAttempt>> {
    const qr = await this.quizRepo.getByLessonId(lessonId);
    if (!qr.ok || !qr.value) return { ok: false, error: { code: 'NOT_FOUND', message: 'Quiz not found', retryable: false, requestId: '' } };
    const quiz = qr.value;
    let attempt = await this.attemptRepo.getActive(studentId, quiz.id);
    if (!attempt.ok || !attempt.value) {
      const count = await this.attemptRepo.countByStudentAndQuiz(studentId, quiz.id);
      if (!quiz.unlimitedAttempts && count.ok && count.value >= quiz.maxAttempts) return { ok: false, error: { code: 'FORBIDDEN', message: 'Maximum attempts reached', retryable: false, requestId: '' } };
      attempt = await this.attemptRepo.create({ id: `${studentId}_${quiz.id}_${(count.ok ? count.value : 0) + 1}`, studentId, quizId: quiz.id, attemptNumber: (count.ok ? count.value : 0) + 1 });
      if (!attempt.ok) return attempt as unknown as RepositoryResult<IQuizAttempt>;
    }
    const submitAttempt = attempt.value;
    if (!submitAttempt) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to create attempt', retryable: false, requestId: '' } } as unknown as RepositoryResult<IQuizAttempt>;
    await this.answerRepo.deleteByAttempt(submitAttempt.id);
    const questions = await this.questionRepo.listByQuiz(quiz.id);
    let totalScore = 0, maxScore = 0;
    for (const [index, ans] of answers.entries()) {
      const q = questions.ok ? questions.value.find((q) => q.id === ans.questionId) : null;
      const points = q ? q.points : 1;
      maxScore += points;
      const isCorrect = String((ans.answer as Record<string, unknown>)?.selectedOptionId) === String(q?.options?.correct);
      const score = isCorrect ? points : 0;
      if (isCorrect) totalScore += score;
      await this.answerRepo.create({ id: `${submitAttempt.id}_${index}`, attemptId: submitAttempt.id, studentId, quizId: quiz.id, questionId: String(ans.questionId ?? ''), answer: ans.answer as Record<string, unknown> ?? {}, isCorrect, score, feedback: isCorrect ? 'Correct' : 'Incorrect' });
    }
    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = finalScore >= quiz.passingScore;
    const now = new Date().toISOString();
    return this.attemptRepo.update(submitAttempt.id, { status: 'submitted', score: finalScore, passed, submittedAt: now, gradedAt: now, timeSpentSeconds });
  }

  async getResult(studentId: string, lessonId: string): Promise<RepositoryResult<{ attempt: IQuizAttempt | null; answers: IQuizAnswer[] }>> {
    const quiz = await this.quizRepo.getByLessonId(lessonId);
    if (!quiz.ok || !quiz.value) return { ok: false, error: { code: 'NOT_FOUND', message: 'Quiz not found', retryable: false, requestId: '' } } as unknown as RepositoryResult<{ attempt: IQuizAttempt | null; answers: IQuizAnswer[] }>;
    const attempts = await this.attemptRepo.listByStudentAndQuiz(studentId, quiz.value.id);
    const latest = attempts.ok ? attempts.value.find((a) => a.status === 'submitted' || a.status === 'graded') : null;
    if (!latest) return { ok: true, value: { attempt: null, answers: [] } };
    const answers = await this.answerRepo.listByAttempt(latest.id);
    return { ok: true, value: { attempt: latest, answers: answers.ok ? answers.value : [] } };
  }

  async getHistory(studentId: string, lessonId: string): Promise<RepositoryResult<IQuizAttempt[]>> {
    const quiz = await this.quizRepo.getByLessonId(lessonId);
    if (!quiz.ok || !quiz.value) return { ok: true, value: [] };
    const r = await this.attemptRepo.listByStudentAndQuiz(studentId, quiz.value.id);
    return { ok: true, value: r.ok ? r.value : [] };
  }

  async getReview(studentId: string, lessonId: string): Promise<RepositoryResult<{ attempt: IQuizAttempt | null; questions: IQuizQuestion[]; answers: IQuizAnswer[] }>> {
    const quiz = await this.quizRepo.getByLessonId(lessonId);
    if (!quiz.ok || !quiz.value) return { ok: false, error: { code: 'NOT_FOUND', message: 'Quiz not found', retryable: false, requestId: '' } } as unknown as RepositoryResult<{ attempt: IQuizAttempt | null; questions: IQuizQuestion[]; answers: IQuizAnswer[] }>;
    const attempts = await this.attemptRepo.listByStudentAndQuiz(studentId, quiz.value.id);
    const latest = attempts.ok ? attempts.value.find((a) => a.status === 'submitted' || a.status === 'graded') : null;
    if (!latest) return { ok: true, value: { attempt: null, questions: [], answers: [] } };
    const [questions, answers] = await Promise.all([this.questionRepo.listByQuiz(quiz.value.id), this.answerRepo.listByAttempt(latest.id)]);
    return { ok: true, value: { attempt: latest, questions: questions.ok ? questions.value : [], answers: answers.ok ? answers.value : [] } };
  }
}
