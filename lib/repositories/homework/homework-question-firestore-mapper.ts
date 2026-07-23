import { Timestamp } from 'firebase-admin/firestore';
import { formatFirestoreTimestamp } from '../firestore/firestore.service';
import type { IHomeworkQuestion, QuestionType } from '../contracts';

export interface HomeworkQuestionFirestoreDoc {
  id: string;
  homeworkId: string;
  questionType: string;
  prompt: string;
  instructions?: string | null;
  explanation?: string | null;
  options: Record<string, string> | null;
  points: number;
  displayOrder: number;
  contentVersion: number;
  createdAt: Timestamp | string;
  updatedAt: Timestamp | string;
  schemaVersion: number;
}

export class HomeworkQuestionFirestoreMapper {
  static toDomain(doc: HomeworkQuestionFirestoreDoc): IHomeworkQuestion {
    return {
      id: doc.id, homeworkId: doc.homeworkId,
      questionType: doc.questionType as QuestionType, prompt: doc.prompt,
      instructions: doc.instructions ?? undefined,
      explanation: doc.explanation ?? undefined,
      options: doc.options, points: doc.points, displayOrder: doc.displayOrder,
      contentVersion: doc.contentVersion,
      createdAt: formatFirestoreTimestamp(doc.createdAt),
      updatedAt: formatFirestoreTimestamp(doc.updatedAt),
      schemaVersion: doc.schemaVersion,
    };
  }

  static toCreate(input: {
    id: string; homeworkId: string; questionType: string; prompt: string;
    instructions?: string | null; explanation?: string | null;
    options: Record<string, string> | null; points: number; displayOrder: number;
  }): HomeworkQuestionFirestoreDoc {
    const now = Timestamp.now();
    return {
      id: input.id, homeworkId: input.homeworkId, questionType: input.questionType,
      prompt: input.prompt, instructions: input.instructions ?? null,
      explanation: input.explanation ?? null, options: input.options,
      points: input.points, displayOrder: input.displayOrder, contentVersion: 1,
      createdAt: now, updatedAt: now, schemaVersion: 1,
    };
  }
}
