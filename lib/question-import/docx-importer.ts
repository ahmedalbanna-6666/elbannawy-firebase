import mammoth from 'mammoth';
import * as fs from 'fs';
import * as path from 'path';

import type {
  ImportResult,
  ImportedActivity,
  ActivityType,
  ActivityContent,
  ImportError,
  ErrorCode,
} from './types';
import {
  extractMcq,
  extractDragDrop,
  extractReading,
  extractRewrite,
  extractCorrect,
  extractDialogue,
  extractTrueFalse,
  extractWriting,
} from './extractors/index';
import {
  MARKER_ANSWER_KEY,
  ACTIVITY_MARKER_PATTERN,
  MAX_FILE_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
} from './constants';
import { parseQuestionDocumentBlocks, buildQuestionSectionsFromBlocks } from './question-document-parser';
import { validateAll } from './validation-engine';

const MARKERS: Record<string, ActivityType> = {
  '@@MCQ@@': 'MCQ',
  '@@DRAG_DROP@@': 'DRAG_DROP',
  '@@READING@@': 'READING',
  '@@REWRITE@@': 'REWRITE',
  '@@CORRECT@@': 'CORRECT',
  '@@DIALOGUE@@': 'DIALOGUE',
  '@@TRUE_FALSE@@': 'TRUE_FALSE',
  '@@WRITING@@': 'WRITING',
};

function error(code: ErrorCode, message: string): ImportError {
  return { code, message };
}

function hasAnswerKey(rawText: string): boolean {
  return rawText.includes(MARKER_ANSWER_KEY);
}

function splitByMarkers(text: string): {
  header: string;
  sections: { type: ActivityType; order: number; rawText: string }[];
  warnings: ImportError[];
} {
  const lines = text.split('\n');
  const headerLines: string[] = [];
  const sections: { type: ActivityType; order: number; rawText: string }[] = [];
  const warnings: ImportError[] = [];
  let currentType: ActivityType | null = null;
  let currentLines: string[] = [];
  let activityOrder = 0;
  let foundFirstMarker = false;
  const seenMarkers = new Set<ActivityType>();

  function flushSection(): void {
    if (currentType && currentLines.length > 0) {
      const fullText = currentLines.join('\n').trim();
      if (fullText) {
        if (seenMarkers.has(currentType)) {
          warnings.push(error('DUPLICATE_ACTIVITY_MARKER', `Duplicate ${currentType} marker at position ${activityOrder + 1}`));
        }
        seenMarkers.add(currentType);
        activityOrder++;
        sections.push({ type: currentType, order: activityOrder, rawText: fullText });
      }
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();
    if (!foundFirstMarker) {
      const markerMatch = trimmed.match(ACTIVITY_MARKER_PATTERN);
      if (markerMatch) {
        foundFirstMarker = true;
        flushSection();
        currentType = MARKERS[markerMatch[0]!]!;
        currentLines = [];
      } else {
        headerLines.push(line);
      }
      continue;
    }
    const markerMatch = trimmed.match(ACTIVITY_MARKER_PATTERN);
    if (markerMatch) {
      flushSection();
      currentType = MARKERS[markerMatch[0]!]!;
      currentLines = [];
    } else {
      currentLines.push(line);
    }
  }
  flushSection();
  return { header: headerLines.join('\n').trim(), sections, warnings };
}

function extractActivity(section: {
  type: ActivityType;
  order: number;
  rawText: string;
}): ImportedActivity {
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [];

  if (!hasAnswerKey(section.rawText)) {
    errors.push(error('NO_ANSWER_KEY', `${section.type} activity has no ${MARKER_ANSWER_KEY}`));
  }

  let content: ActivityContent;

  switch (section.type) {
    case 'MCQ': content = extractMcq(section.rawText); break;
    case 'DRAG_DROP': content = extractDragDrop(section.rawText); break;
    case 'READING': content = extractReading(section.rawText); break;
    case 'REWRITE': content = extractRewrite(section.rawText); break;
    case 'CORRECT': content = extractCorrect(section.rawText); break;
    case 'DIALOGUE': content = extractDialogue(section.rawText); break;
    case 'TRUE_FALSE': content = extractTrueFalse(section.rawText); break;
    case 'WRITING': content = extractWriting(section.rawText); break;
    default: {
      const _exhaustive: never = section.type;
      throw new Error(`Unknown activity type: ${_exhaustive}`);
    }
  }

  return { type: section.type, order: section.order, content, errors, warnings };
}

function validateContentIntegrity(activities: ImportedActivity[]): ImportError[] {
  const result: ImportError[] = [];

  for (const activity of activities) {
    const c = activity.content;

    if (activity.type === 'MCQ') {
      const mcq = c as import('./types').McqContent;
      if (mcq.categories.length === 0 || mcq.categories.every((cat) => cat.questions.length === 0)) {
        result.push(error('MCQ_MISSING_OPTIONS', `MCQ #${activity.order}: no questions extracted`));
      }
      for (const cat of mcq.categories) {
        for (const q of cat.questions) {
          if (q.options.length < 2) result.push(error('MCQ_TOO_FEW_OPTIONS', `MCQ #${activity.order} question ${q.number}: has ${q.options.length} options, minimum is 2`));
        }
      }
      const qNumbers = mcq.categories.flatMap((cat) => cat.questions.map((q) => q.number));
      const seen = new Set<number>();
      for (const n of qNumbers) {
        if (seen.has(n)) result.push(error('DUPLICATE_QUESTION_NUMBER', `MCQ #${activity.order}: duplicate question number ${n}`));
        seen.add(n);
      }
    }

    if (activity.type === 'DRAG_DROP') {
      const dd = c as import('./types').DragDropContent;
      if (dd.wordBank.length === 0) result.push(error('DRAG_DROP_MISSING_WORD_BANK', `DRAG_DROP #${activity.order}: missing or empty word bank`));
    }

    if (activity.type === 'READING') {
      const rd = c as import('./types').ReadingContent;
      if (rd.passage.trim().length === 0) result.push(error('READING_EMPTY_PASSAGE', `READING #${activity.order}: passage is empty`));
    }

    if (activity.type === 'DIALOGUE') {
      const dl = c as import('./types').DialogueContent;
      if (dl.lines.length === 0) result.push(error('DIALOGUE_EMPTY', `DIALOGUE #${activity.order}: no dialogue lines extracted`));
    }

    if (activity.type === 'TRUE_FALSE') {
      const tf = c as import('./types').TrueFalseContent;
      for (const q of tf.questions) {
        if (tf.answers[q.number] === undefined) result.push(error('MISSING_ANSWER_ENTRY', `TRUE_FALSE #${activity.order}: missing answer for question ${q.number}`));
      }
    }

    if (activity.type === 'WRITING') {
      const wr = c as import('./types').WritingContent;
      if (wr.topic.trim().length === 0) result.push(error('WRITING_EMPTY_TOPIC', `WRITING #${activity.order}: topic is empty`));
    }

    if (activity.type === 'CORRECT' || activity.type === 'REWRITE') {
      const questions = (c as { questions: { number: number }[] }).questions;
      if (questions) {
        const seen = new Set<number>();
        for (const q of questions) {
          if (seen.has(q.number)) result.push(error('DUPLICATE_QUESTION_NUMBER', `${activity.type} #${activity.order}: duplicate question number ${q.number}`));
          seen.add(q.number);
        }
      }
    }
  }

  return result;
}

export interface ImportOptions {
  filePath: string;
  signal?: AbortSignal;
}

export async function importQuestionsFromDocx(options: ImportOptions): Promise<ImportResult> {
  const ext = path.extname(options.filePath).toLowerCase();
  if (!(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new Error(`Unsupported file extension "${ext}". Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`);
  }

  let stat: fs.Stats;
  try { stat = fs.statSync(options.filePath); }
  catch { throw new Error(`File not found: ${options.filePath}`); }

  if (stat.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File too large (${stat.size} bytes). Maximum allowed: ${MAX_FILE_SIZE_BYTES} bytes`);
  }

  if (options.signal?.aborted) throw new Error('Import cancelled');

  let html: string;
  let rawText: string;

  try {
    const buffer = await fs.promises.readFile(options.filePath);
    const htmlResult = await mammoth.convertToHtml({ buffer });
    html = htmlResult.value ?? '';
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to read DOCX file: ${msg}`);
  }

  if (options.signal?.aborted) throw new Error('Import cancelled');

  const parsed = parseQuestionDocumentBlocks(html);
  const blockSections = buildQuestionSectionsFromBlocks(parsed.blocks, parsed.orphanTables);
  rawText = parsed.rawText;

  const result = parseQuestionText(rawText);

  const blockWarnings: ImportError[] = parsed.warnings.map((w) => error('DRAG_DROP_MISSING_WORD_BANK' as ErrorCode, w));
  for (const bw of blockWarnings) {
    if (!result.warnings.some((rw) => rw.message === bw.message)) {
      result.warnings.push(bw);
    }
  }

  result.documentTitle = blockSections.header || result.documentTitle;

  const { report } = validateAll(rawText, result.activities, blockSections.sections);
  result.validationReport = report;

  const errorIssues = report.issues.filter((i) => i.severity === 'ERROR' || i.severity === 'CRITICAL');
  for (const ei of errorIssues) {
    if (!result.errors.some((e) => e.message === ei.message)) {
      result.errors.push(error(ei.code, ei.message));
    }
  }

  return result;
}

export function parseQuestionText(rawText: string): ImportResult {
  const { header, sections, warnings: splitWarnings } = splitByMarkers(rawText);
  const errors: ImportError[] = [];
  const warnings: ImportError[] = [...splitWarnings];
  const activities: ImportedActivity[] = [];

  for (const section of sections) {
    const activity = extractActivity(section);
    activities.push(activity);
    for (const err of activity.errors) errors.push(err);
  }

  const integrityWarnings = validateContentIntegrity(activities);
  warnings.push(...integrityWarnings);

  const result: ImportResult = {
    documentTitle: header.split('\n')[0]?.trim() || 'Untitled Document',
    activities,
    errors,
    warnings,
  };

  const { report } = validateAll(rawText, activities, sections);
  result.validationReport = report;

  return result;
}
