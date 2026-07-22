import type { TrueFalseContent, TrueFalseQuestion } from '../types.js';
import { findAnswerKeyInText } from '../answer-key-parser.js';

function normalizeBooleanValue(value: string): boolean {
  const lower = value.trim().toLowerCase();
  if (lower === 't' || lower === 'true') return true;
  if (lower === 'f' || lower === 'false') return false;
  return false;
}

function isValidBooleanValue(value: string): boolean {
  const lower = value.trim().toLowerCase();
  return ['t', 'f', 'true', 'false'].includes(lower);
}

export function extractTrueFalse(rawText: string): TrueFalseContent {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('@@'));

  const rawAnswers = findAnswerKeyInText(rawText);
  const answers: Record<number, boolean> = {};

  for (const key of rawAnswers.keys()) {
    const value = rawAnswers.get(key)!;
    if (isValidBooleanValue(value)) {
      answers[key] = normalizeBooleanValue(value);
    }
  }

  const instruction = lines[0] || '';
  const questionLines = lines.slice(1);

  const questions: TrueFalseQuestion[] = [];

  for (const line of questionLines) {
    const match = line.match(/^(\d+)\.\s+(.+?)\s*\(/);
    if (match) {
      questions.push({
        number: parseInt(match[1]!, 10),
        statement: match[2]!.trim(),
      });
    }
  }

  return {
    instruction,
    questions,
    answers,
  };
}
