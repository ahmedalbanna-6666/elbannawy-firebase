import { MARKER_ANSWER_KEY } from './constants.js';

export function parseAnswerKey(lines: string[]): Map<number, string> {
  const answers = new Map<number, string>();

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const match = trimmed.match(/^(\d+)\s*=\s*(.+)$/);
    if (match) {
      const num = parseInt(match[1]!, 10);
      let answer = match[2]!.trim();
      answer = answer.replace(/^["'](.+?)["']$/, '$1');
      if (!answers.has(num)) {
        answers.set(num, answer);
      }
    }
  }

  return answers;
}

export function findAnswerKeyInText(rawText: string): Map<number, string> {
  const aksIndex = rawText.lastIndexOf(MARKER_ANSWER_KEY);
  if (aksIndex === -1) return new Map();

  const afterKey = rawText.substring(aksIndex + MARKER_ANSWER_KEY.length).trim();
  const answerLines: string[] = [];

  const parts = afterKey.split('\n');
  for (const line of parts) {
    const trimmed = line.trim();
    if (trimmed.startsWith('@@')) break;
    if (trimmed) answerLines.push(trimmed);
  }

  return parseAnswerKey(answerLines);
}

export function extractBodyBeforeAnswerKey(rawText: string): string {
  const aksIndex = rawText.indexOf(MARKER_ANSWER_KEY);
  return aksIndex !== -1 ? rawText.substring(0, aksIndex) : rawText;
}
