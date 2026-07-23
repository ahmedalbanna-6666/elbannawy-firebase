import type { WritingContent } from '../types';
import { MARKER_ANSWER_KEY } from '../constants';

function extractWordCount(instruction: string): number | null {
  const parenMatch = instruction.match(/\((\d+)\)\s*words/i);
  if (parenMatch) return parseInt(parenMatch[1]!, 10);

  const numMatch = instruction.match(/(\d+)\s+words/i);
  if (numMatch) return parseInt(numMatch[1]!, 10);

  return null;
}

function extractTopic(lines: string[]): string {
  for (const line of lines) {
    const trimmed = line.trim();
    if (/^["\u201c]/.test(trimmed)) {
      return trimmed.replace(/^["\u201c]/, '').replace(/["\u201d]$/, '').trim();
    }
    if (trimmed.length > 10 && !trimmed.startsWith('(') && !trimmed.startsWith('@') && !trimmed.startsWith('\u2026')) {
      return trimmed;
    }
  }
  return '';
}

function findGradingType(rawText: string): 'AI' | 'MANUAL' {
  const aksIndex = rawText.lastIndexOf(MARKER_ANSWER_KEY);
  if (aksIndex === -1) return 'MANUAL';

  const afterKey = rawText.substring(aksIndex + MARKER_ANSWER_KEY.length).trim();
  const lines = afterKey.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  for (const line of lines) {
    if (/=\s*AI/i.test(line)) {
      return 'AI';
    }
  }

  return 'MANUAL';
}

export function extractWriting(rawText: string): WritingContent {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const instruction = lines[0] || '';
  const contentLines = lines.slice(1).filter((l) => !l.startsWith('@@') && !l.startsWith('\u2026') && l.length > 3);

  const topic = extractTopic(contentLines);
  const wordCount = extractWordCount(instruction);
  const gradingType = findGradingType(rawText);

  return {
    instruction,
    topic,
    wordCount,
    gradingType,
  };
}
