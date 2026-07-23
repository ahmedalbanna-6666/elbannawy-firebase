import type { CorrectContent, CorrectQuestion } from '../types';
import { findAnswerKeyInText } from '../answer-key-parser';

export function extractCorrect(rawText: string): CorrectContent {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('@@'));

  const answers = findAnswerKeyInText(rawText);

  const instruction = lines[0] || '';
  const questionLines = lines.slice(1);

  const questions: CorrectQuestion[] = [];

  for (const line of questionLines) {
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (match) {
      questions.push({
        number: parseInt(match[1]!, 10),
        sentence: match[2]!.trim(),
      });
    }
  }

  return {
    instruction,
    questions,
    answers: Object.fromEntries(answers),
  };
}
