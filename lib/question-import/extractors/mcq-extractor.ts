import type { McqContent, McqQuestion, McqOption, McqCategory } from '../types.js';
import { findAnswerKeyInText } from '../answer-key-parser.js';
import { CATEGORY_HEADERS } from '../constants.js';

function isCategoryHeader(line: string): boolean {
  return (CATEGORY_HEADERS as readonly string[]).some((h) => line.toLowerCase() === h.toLowerCase());
}

function isInstructionLine(line: string): boolean {
  return /^\(\d+\)\s/.test(line) && (/:\s*$/.test(line) || /Choose|Read|Write|Complete|Rewrite|Answer/i.test(line));
}

function hasOptionPrefix(line: string): boolean {
  return /^[a-d]\.\s/.test(line);
}

function hasExtendedOptionPrefix(line: string): boolean {
  return /^[a-f]\.\s/.test(line);
}

function getQuestionPrefix(line: string): string | null {
  const match = line.match(/^(AB|SB)\s+/);
  return match ? match[1]! : null;
}

function stripQuestionPrefix(line: string): string {
  return line.replace(/^(AB|SB)\s+/, '');
}

function isQuestionTextLine(line: string): boolean {
  if (hasExtendedOptionPrefix(line)) return false;
  if (isCategoryHeader(line)) return false;
  if (isInstructionLine(line)) return false;
  if (line.startsWith('@@')) return false;
  if (line.length === 0) return false;
  return true;
}

export function extractMcq(rawText: string): McqContent {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('@@ANSWER_KEY@@'));

  const answers = findAnswerKeyInText(rawText);

  let startIdx = 0;
  if (lines.length > 0 && isInstructionLine(lines[0]!)) {
    startIdx = 1;
  }
  const instruction = startIdx > 0 ? lines[0]!.trim() : '';
  const contentLines = startIdx > 0 ? lines.slice(1) : lines;

  const categoriesMap = new Map<string, McqQuestion[]>();
  let currentCategory = 'General';
  categoriesMap.set('General', []);

  let implicitNumber = 0;

  let i = 0;
  while (i < contentLines.length) {
    const line = contentLines[i]!;

    if (line.startsWith('@@')) {
      i++;
      continue;
    }

    if (isCategoryHeader(line)) {
      currentCategory = line;
      if (!categoriesMap.has(currentCategory)) {
        categoriesMap.set(currentCategory, []);
      }
      i++;
      continue;
    }

    if (hasExtendedOptionPrefix(line)) {
      i++;
      continue;
    }

    if (isInstructionLine(line)) {
      i++;
      continue;
    }

    if (!isQuestionTextLine(line)) {
      i++;
      continue;
    }

    if (!(i + 1 < contentLines.length && hasOptionPrefix(contentLines[i + 1]!))) {
      i++;
      continue;
    }

    implicitNumber++;
    const prefix = getQuestionPrefix(line);
    const cleanLine = stripQuestionPrefix(line);
    const questionText = cleanLine;

    const options: McqOption[] = [];
    let j = i + 1;

    while (j < contentLines.length && hasExtendedOptionPrefix(contentLines[j]!)) {
      const optLine = contentLines[j]!;
      const optMatch = optLine.match(/^([a-f])\.\s+(.+)/);
      if (optMatch) {
        options.push({ label: optMatch[1]!, text: optMatch[2]!.trim() });
      }
      j++;
    }

    const question: McqQuestion = {
      number: implicitNumber,
      prefix,
      category: currentCategory === 'General' ? null : currentCategory,
      question: questionText,
      options,
    };

    const catArray = categoriesMap.get(currentCategory)!;
    catArray.push(question);
    i = j;
  }

  const categories: McqCategory[] = [];
  for (const [name, questions] of categoriesMap.entries()) {
    if (questions.length > 0) {
      categories.push({ name, questions });
    }
  }

  return {
    instruction,
    categories,
    answers: Object.fromEntries(answers),
  };
}
