import { z } from 'zod';
import { QuestionTypeEnum } from './homework.validator';

export const CreateQuizInputSchema = z.object({
  id: z.string().min(1).max(128),
  lessonId: z.string().min(1).max(128),
  title: z.string().min(1).max(500),
  instructions: z.string().max(2000).optional(),
  passingScore: z.number().int().min(0).max(100).optional().default(60),
  maxAttempts: z.number().int().min(1).optional().default(3),
  unlimitedAttempts: z.boolean().optional().default(false),
  published: z.boolean().optional().default(false),
  allowRetry: z.boolean().optional().default(true),
  showAnswers: z.boolean().optional().default(false),
  xpReward: z.number().int().min(0).optional().default(20),
  requiredForCompletion: z.boolean().optional().default(true),
});

export const UpdateQuizInputSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  instructions: z.string().max(2000).optional(),
  passingScore: z.number().int().min(0).max(100).optional(),
  maxAttempts: z.number().int().min(1).optional(),
  unlimitedAttempts: z.boolean().optional(),
  published: z.boolean().optional(),
  allowRetry: z.boolean().optional(),
  showAnswers: z.boolean().optional(),
  xpReward: z.number().int().min(0).optional(),
  requiredForCompletion: z.boolean().optional(),
});

export const CreateQuizQuestionInputSchema = z.object({
  id: z.string().min(1).max(128),
  quizId: z.string().min(1).max(128),
  questionType: QuestionTypeEnum,
  prompt: z.string().min(1).max(5000),
  instructions: z.string().max(2000).optional(),
  explanation: z.string().max(2000).optional(),
  options: z.record(z.string(), z.string()).nullable().optional(),
  points: z.number().int().min(1).optional().default(1),
  displayOrder: z.number().int().min(0),
});

export const CreateQuizAttemptInputSchema = z.object({
  id: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
  quizId: z.string().min(1).max(128),
  attemptNumber: z.number().int().min(1),
});

export const UpdateQuizAttemptInputSchema = z.object({
  status: z.enum(['not_started', 'in_progress', 'submitted', 'graded']).optional(),
  score: z.number().int().min(0).max(100).optional(),
  passed: z.boolean().optional(),
  submittedAt: z.string().optional(),
  gradedAt: z.string().optional(),
  timeSpentSeconds: z.number().int().min(0).optional(),
});

export const CreateQuizAnswerInputSchema = z.object({
  id: z.string().min(1).max(128),
  attemptId: z.string().min(1).max(128),
  studentId: z.string().min(1).max(128),
  quizId: z.string().min(1).max(128),
  questionId: z.string().min(1).max(128),
  answer: z.record(z.string(), z.unknown()),
  isCorrect: z.boolean().optional(),
  score: z.number().int().min(0).optional(),
  feedback: z.string().max(2000).optional(),
});
