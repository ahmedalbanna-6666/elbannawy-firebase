import type { ReadingContent, ReadingPart, ReadingQuestion, McqOption } from '../types';
import { parseAnswerKey } from '../answer-key-parser';
import { MARKER_ANSWER_KEY, ACTIVITY_MARKERS } from '../constants';

function extractAnswerKeyBlocks(rawText: string): Map<number, string>[] {
  const blocks: Map<number, string>[] = [];
  let searchFrom = 0;

  while (true) {
    const startIdx = rawText.indexOf(MARKER_ANSWER_KEY, searchFrom);
    if (startIdx === -1) break;

    const afterKey = rawText.substring(startIdx + MARKER_ANSWER_KEY.length);

    let endIdx = afterKey.length;
    const nextAk = afterKey.indexOf(MARKER_ANSWER_KEY);
    if (nextAk !== -1) endIdx = nextAk;

    for (const marker of ACTIVITY_MARKERS) {
      const nextMarker = afterKey.indexOf(marker);
      if (nextMarker !== -1 && nextMarker < endIdx) {
        endIdx = nextMarker;
      }
    }

    const blockContent = afterKey.substring(0, endIdx);

    const rawLines = blockContent.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('@@'));
    const answerLines: string[] = [];
    for (const rl of rawLines) {
      if (/^\d+\s*=\s*\S/.test(rl)) {
        answerLines.push(rl);
      } else if (answerLines.length > 0) {
        break;
      }
    }
    if (answerLines.length > 0) {
      blocks.push(parseAnswerKey(answerLines));
    }

    searchFrom = startIdx + MARKER_ANSWER_KEY.length + endIdx;
  }

  return blocks;
}

function linesWithoutAnswerKeys(text: string): string[] {
  return text.split('\n')
    .filter((line) => {
      const trimmed = line.trim();
      if (trimmed === MARKER_ANSWER_KEY) return false;
      if (/^\d+\s*=\s*/.test(trimmed)) return false;
      return true;
    })
    .map((l) => l.trim())
    .filter((l) => l.length > 0);
}

function splitIntoParts(text: string): { label: string; instruction: string; body: string }[] {
  const parts: { label: string; instruction: string; body: string }[] = [];
  const lines = text.split('\n');
  let currentPart: string[] = [];
  let currentLabel = '';
  let currentInstruction = '';
  let foundFirst = false;

  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^([A-Z])\.\s*(.+)$/);
    if (match) {
      if (foundFirst) {
        parts.push({
          label: currentLabel,
          instruction: currentInstruction,
          body: currentPart.join('\n').trim(),
        });
      }
      currentLabel = match[1]!;
      currentInstruction = match[2]!.trim();
      currentPart = [];
      foundFirst = true;
    } else if (foundFirst) {
      currentPart.push(line);
    }
  }

  if (foundFirst) {
    parts.push({
      label: currentLabel,
      instruction: currentInstruction,
      body: currentPart.join('\n').trim(),
    });
  }

  return parts;
}

function hasOptionPrefix(line: string): boolean {
  return /^[a-d]\.\s/.test(line.trim());
}

function parseMcqQuestions(body: string): ReadingQuestion[] {
  const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const questions: ReadingQuestion[] = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i]!;
    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]!, 10);
      const qText = qMatch[2]!.trim();
      const options: McqOption[] = [];
      let j = i + 1;

      while (j < lines.length && hasOptionPrefix(lines[j]!)) {
        const optLine = lines[j]!;
        const optMatch = optLine.match(/^([a-d])\.\s+(.+)/);
        if (optMatch) {
          options.push({ label: optMatch[1]!, text: optMatch[2]!.trim() });
        }
        j++;
      }

      questions.push({ number: qNum, question: qText, options });
      i = j;
    } else {
      i++;
    }
  }

  return questions;
}

function parseOpenEndedQuestions(body: string): ReadingQuestion[] {
  const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('@@') && !l.startsWith('\u2026') && l.length > 3);
  const questions: ReadingQuestion[] = [];

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+(.+)/);
    if (match) {
      const qNum = parseInt(match[1]!, 10);
      const qText = match[2]!.trim();
      questions.push({ number: qNum, question: qText, options: null });
    }
  }

  return questions;
}

function determinePartType(body: string): 'MCQ' | 'OPEN_ENDED' {
  const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const optionCount = lines.filter((l) => /^[a-d]\.\s/.test(l)).length;
  return optionCount > 0 ? 'MCQ' : 'OPEN_ENDED';
}

export function extractReading(rawText: string): ReadingContent {
  const answerKeyBlocks = extractAnswerKeyBlocks(rawText);
  const cleanedLines = linesWithoutAnswerKeys(rawText);

  const instruction = cleanedLines[0] || '';

  let passageEnd = cleanedLines.length;
  for (let i = 1; i < cleanedLines.length; i++) {
    if (/^[A-Z]\.\s/.test(cleanedLines[i]!)) {
      passageEnd = i;
      break;
    }
  }

  const passage = cleanedLines.slice(1, passageEnd).join(' ');

  const partsText = cleanedLines.slice(passageEnd).join('\n');
  const parts = splitIntoParts(partsText);

  const readingParts: ReadingPart[] = parts.map((part, index) => {
    const answerMap = index < answerKeyBlocks.length ? answerKeyBlocks[index]! : new Map<number, string>();
    const partType = determinePartType(part.body);

    if (partType === 'MCQ') {
      const questions = parseMcqQuestions(part.body);
      return {
        label: part.label,
        instruction: part.instruction,
        type: 'MCQ' as const,
        questions,
        answers: Object.fromEntries(answerMap),
      };
    }

    const questions = parseOpenEndedQuestions(part.body);
    return {
      label: part.label,
      instruction: part.instruction,
      type: 'OPEN_ENDED' as const,
      questions,
      answers: Object.fromEntries(answerMap),
    };
  });

  return {
    instruction,
    passage,
    parts: readingParts,
  };
}
