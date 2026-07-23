import { HomeworkRepository } from '../../repositories/homework/homework.repository';
import { HomeworkQuestionRepository } from '../../repositories/homework/homework-question.repository';
import { HomeworkAttemptRepository } from '../../repositories/homework/homework-attempt.repository';
import { HomeworkAnswerRepository } from '../../repositories/homework/homework-answer.repository';
import { RepositoryResult } from '../../shared/types/repository.types';
import type { IHomework, IHomeworkQuestion, IHomeworkAttempt, IHomeworkAnswer } from '../../repositories/contracts';

export class HomeworkService {
  private readonly homeworkRepo = new HomeworkRepository();
  private readonly questionRepo = new HomeworkQuestionRepository();
  private readonly attemptRepo = new HomeworkAttemptRepository();
  private readonly answerRepo = new HomeworkAnswerRepository();

  async getHomework(lessonId: string): Promise<RepositoryResult<IHomework | null>> {
    return this.homeworkRepo.getByLessonId(lessonId);
  }

  async getQuestions(lessonId: string): Promise<RepositoryResult<IHomeworkQuestion[] | null>> {
    const homework = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homework.ok || !homework.value) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Homework not found', retryable: false, requestId: '' } } as unknown as RepositoryResult<IHomeworkQuestion[] | null>;
    }
    return this.questionRepo.listByHomework(homework.value.id);
  }

  async getStatus(studentId: string, lessonId: string): Promise<RepositoryResult<{ hasHomework: boolean; latestAttempt: IHomeworkAttempt | null; totalAttempts: number }>> {
    const homework = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homework.ok || !homework.value) {
      return { ok: true, value: { hasHomework: false, latestAttempt: null, totalAttempts: 0 } };
    }
    const attempts = await this.attemptRepo.listByStudentAndHomework(studentId, homework.value.id);
    const count = await this.attemptRepo.countByStudentAndHomework(studentId, homework.value.id);
    return {
      ok: true,
      value: {
        hasHomework: true,
        latestAttempt: attempts.ok && attempts.value.length > 0 ? (attempts.value[0] ?? null) : null,
        totalAttempts: count.ok ? count.value : 0,
      },
    };
  }

  async startAttempt(studentId: string, lessonId: string): Promise<RepositoryResult<IHomeworkAttempt>> {
    const homework = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homework.ok || !homework.value) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Homework not found', retryable: false, requestId: '' } };
    }

    const count = await this.attemptRepo.countByStudentAndHomework(studentId, homework.value.id);
    if (!count.ok) return count as unknown as RepositoryResult<IHomeworkAttempt>;

    if (!homework.value.unlimitedAttempts && count.value >= homework.value.maxAttempts) {
      return { ok: false, error: { code: 'FORBIDDEN', message: 'Maximum attempts reached', retryable: false, requestId: '' } };
    }

    const attemptNumber = count.value + 1;
    return this.attemptRepo.create({
      id: `${studentId}_${homework.value.id}_${attemptNumber}`,
      studentId, homeworkId: homework.value.id, attemptNumber,
    });
  }

  async saveProgress(studentId: string, lessonId: string, answers: Record<string, unknown>[]): Promise<RepositoryResult<void>> {
    const homeworkResult = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homeworkResult.ok || !homeworkResult.value) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Homework not found', retryable: false, requestId: '' } };
    }

    let attempt = await this.attemptRepo.getActive(studentId, homeworkResult.value.id);
    if (!attempt.ok || !attempt.value) {
      const count = await this.attemptRepo.countByStudentAndHomework(studentId, homeworkResult.value.id);
      const attemptNumber = (count.ok ? count.value : 0) + 1;
      attempt = await this.attemptRepo.create({
        id: `${studentId}_${homeworkResult.value.id}_${attemptNumber}`,
        studentId, homeworkId: homeworkResult.value.id, attemptNumber,
      });
      if (!attempt.ok) return attempt as unknown as RepositoryResult<void>;
    }

    const activeAttempt = attempt.value;
    if (!activeAttempt) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to create/get attempt', retryable: false, requestId: '' } } as unknown as RepositoryResult<void>;
    const attemptId = activeAttempt.id;
    await this.answerRepo.deleteByAttempt(attemptId);

    for (const [index, ans] of answers.entries()) {
      await this.answerRepo.create({
        id: `${attemptId}_${index}`,
        attemptId, studentId, homeworkId: homeworkResult.value.id,
        questionId: String(ans.questionId ?? ''),
        answer: ans.answer as Record<string, unknown> ?? {},
      });
    }

    return { ok: true, value: undefined };
  }

  async submitHomework(studentId: string, lessonId: string, answers: Record<string, unknown>[], timeSpentSeconds?: number): Promise<RepositoryResult<IHomeworkAttempt>> {
    const homeworkResult = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homeworkResult.ok || !homeworkResult.value) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Homework not found', retryable: false, requestId: '' } };
    }

    const homework = homeworkResult.value;
    let attempt = await this.attemptRepo.getActive(studentId, homework.id);

    if (!attempt.ok || !attempt.value) {
      const count = await this.attemptRepo.countByStudentAndHomework(studentId, homework.id);
      if (!homework.unlimitedAttempts && count.ok && count.value >= homework.maxAttempts) {
        return { ok: false, error: { code: 'FORBIDDEN', message: 'Maximum attempts reached', retryable: false, requestId: '' } };
      }
      const attemptNumber = (count.ok ? count.value : 0) + 1;
      attempt = await this.attemptRepo.create({
        id: `${studentId}_${homework.id}_${attemptNumber}`,
        studentId, homeworkId: homework.id, attemptNumber,
      });
      if (!attempt.ok) return attempt as unknown as RepositoryResult<IHomeworkAttempt>;
    }

    const submitAttempt = attempt.value;
    if (!submitAttempt) return { ok: false, error: { code: 'INTERNAL', message: 'Failed to create attempt', retryable: false, requestId: '' } } as unknown as RepositoryResult<IHomeworkAttempt>;
    const attemptId = submitAttempt.id;
    await this.answerRepo.deleteByAttempt(attemptId);

    const questions = await this.questionRepo.listByHomework(homework.id);
    let totalScore = 0;
    let maxScore = 0;

    for (const [index, ans] of answers.entries()) {
      const q = questions.ok ? questions.value.find((q) => q.id === ans.questionId) : null;
      const points = q ? q.points : 1;
      maxScore += points;

      const isCorrect = this.gradeAnswer(ans.answer as Record<string, unknown>, q);
      const score = isCorrect ? points : 0;
      if (isCorrect) totalScore += score;

      await this.answerRepo.create({
        id: `${attemptId}_${index}`,
        attemptId, studentId, homeworkId: homework.id,
        questionId: String(ans.questionId ?? ''),
        answer: ans.answer as Record<string, unknown> ?? {},
        isCorrect, score, feedback: isCorrect ? 'Correct' : 'Incorrect',
      });
    }

    const finalScore = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
    const passed = finalScore >= homework.passingScore;
    const now = new Date().toISOString();

    return this.attemptRepo.update(attemptId, {
      status: 'submitted',
      score: finalScore,
      passed,
      submittedAt: now,
      gradedAt: now,
      timeSpentSeconds,
    });
  }

  async getResult(studentId: string, lessonId: string): Promise<RepositoryResult<{ attempt: IHomeworkAttempt | null; answers: IHomeworkAnswer[] }>> {
    const homework = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homework.ok || !homework.value) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Homework not found', retryable: false, requestId: '' } } as unknown as RepositoryResult<{ attempt: IHomeworkAttempt | null; answers: IHomeworkAnswer[] }>;
    }

    const attempts = await this.attemptRepo.listByStudentAndHomework(studentId, homework.value.id);
    const latestSubmitted = attempts.ok ? attempts.value.find((a) => a.status === 'submitted' || a.status === 'graded') : null;
    if (!latestSubmitted) {
      return { ok: true, value: { attempt: null, answers: [] } };
    }

    const answers = await this.answerRepo.listByAttempt(latestSubmitted.id);
    return {
      ok: true,
      value: {
        attempt: latestSubmitted,
        answers: answers.ok ? answers.value : [],
      },
    };
  }

  async getHistory(studentId: string, lessonId: string): Promise<RepositoryResult<IHomeworkAttempt[]>> {
    const homework = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homework.ok || !homework.value) {
      return { ok: true, value: [] };
    }
    const result = await this.attemptRepo.listByStudentAndHomework(studentId, homework.value.id);
    return result.ok ? { ok: true, value: result.value } : { ok: true, value: [] };
  }

  async getReview(studentId: string, lessonId: string): Promise<RepositoryResult<{ attempt: IHomeworkAttempt | null; questions: IHomeworkQuestion[]; answers: IHomeworkAnswer[] }>> {
    const homework = await this.homeworkRepo.getByLessonId(lessonId);
    if (!homework.ok || !homework.value) {
      return { ok: false, error: { code: 'NOT_FOUND', message: 'Homework not found', retryable: false, requestId: '' } } as unknown as RepositoryResult<{ attempt: IHomeworkAttempt | null; questions: IHomeworkQuestion[]; answers: IHomeworkAnswer[] }>;
    }

    const attempts = await this.attemptRepo.listByStudentAndHomework(studentId, homework.value.id);
    const latestSubmitted = attempts.ok ? attempts.value.find((a) => a.status === 'submitted' || a.status === 'graded') : null;
    if (!latestSubmitted) {
      return { ok: true, value: { attempt: null, questions: [], answers: [] } };
    }

    const [questions, answers] = await Promise.all([
      this.questionRepo.listByHomework(homework.value.id),
      this.answerRepo.listByAttempt(latestSubmitted.id),
    ]);

    return {
      ok: true,
      value: {
        attempt: latestSubmitted,
        questions: questions.ok ? questions.value : [],
        answers: answers.ok ? answers.value : [],
      },
    };
  }

  private gradeAnswer(answer: Record<string, unknown>, _question?: IHomeworkQuestion | null): boolean {
    if (!_question) return false;
    if (_question.questionType === 'MULTIPLE_CHOICE' || _question.questionType === 'TRUE_FALSE') {
      const selected = answer.selectedOptionId;
      const correct = _question.options?.correct;
      return String(selected) === String(correct);
    }
    return false;
  }
}
