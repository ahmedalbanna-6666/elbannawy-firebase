import type {
  ActivityType, ImportedActivity, McqContent, DragDropContent, ReadingContent,
  DialogueContent, TrueFalseContent, WritingContent, CorrectContent, RewriteContent,
  ValidationIssue, ValidationReport, UnknownMarkerRecovery, WordBankValidation,
  AnswerKeyValidation, ReadingValidation, McqValidation, DialogueValidation, DocumentValidation,
  RecoveryAction, ErrorCode, Severity,
} from './types';
import { ACTIVITY_MARKERS as KNOWN_MARKERS, MARKER_WORD_BANK, MARKER_END_WORD_BANK } from './constants';

function issue(severity: Severity, code: ErrorCode, message: string, overrides?: Partial<ValidationIssue>): ValidationIssue {
  return { severity, code, message, recoveryStatus: 'NOT_RECOVERED', ...overrides };
}

const VALID_OPTION_LABELS = new Set(['a', 'b', 'c', 'd', 'e', 'f']);

function isAiAnswer(value: string): boolean {
  return value.trim().toUpperCase() === 'AI';
}

// ─── Unknown Marker Recovery ──────────────────────────────────────

export function detectUnknownMarkers(
  rawText: string,
  knownMarkers: readonly string[] = KNOWN_MARKERS,
): { recoveries: UnknownMarkerRecovery[]; issues: ValidationIssue[] } {
  const recoveries: UnknownMarkerRecovery[] = [];
  const issues: ValidationIssue[] = [];
  const known = new Set(knownMarkers);
  known.add('@@ANSWER_KEY@@');
  known.add(MARKER_WORD_BANK);
  known.add(MARKER_END_WORD_BANK);

  const lines = rawText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    if (!line.startsWith('@@')) continue;
    const markerMatch = line.match(/^@@(\w+(?:_\w+)*)@@/);
    if (!markerMatch) continue;
    const fullMarker = markerMatch[0];
    if (known.has(fullMarker)) continue;

    const nextLines: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const nl = lines[j]?.trim() ?? '';
      if (nl.startsWith('@@')) break;
      if (nl) nextLines.push(nl);
    }

    recoveries.push({
      markerName: fullMarker,
      line: i + 1,
      recoveredText: nextLines.join('\n'),
      suggestedReplacement: Object.values({
        MCQ: '@@MCQ@@', READING: '@@READING@@', DRAG_DROP: '@@DRAG_DROP@@',
        DIALOGUE: '@@DIALOGUE@@', TRUE_FALSE: '@@TRUE_FALSE@@', WRITING: '@@WRITING@@',
        REWRITE: '@@REWRITE@@', CORRECT: '@@CORRECT@@',
      }).includes(fullMarker) ? fullMarker : `Remove or rename "${fullMarker}"`,
    });
    issues.push(issue('WARNING', 'UNKNOWN_MARKER_DETECTED',
      `Unknown marker "${fullMarker}" at line ${i + 1} — content recovered but not parsed by any extractor`,
      { section: fullMarker, suggestedFix: recoveries[recoveries.length - 1]?.suggestedReplacement ?? '', recoveryStatus: 'RECOVERED' }));
  }

  return { recoveries, issues };
}

// ─── Answer Key Validation ────────────────────────────────────────

export function validateAnswerKeys(
  type: ActivityType,
  questions: { number: number }[],
  answers: Record<number, string | boolean>,
  validLabels?: string[],
): { validation: AnswerKeyValidation; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const qNums = new Set(questions.map((q) => q.number));
  const aNums = new Set(Object.keys(answers).map(Number));
  const missingAnswers: number[] = [];
  const duplicateAnswers: number[] = [];
  const extraAnswers: number[] = [];
  const invalidLabels: string[] = [];
  const seen = new Set<number>();

  for (const q of questions) {
    if (seen.has(q.number)) duplicateAnswers.push(q.number);
    seen.add(q.number);
    const ans = answers[q.number];
    if (ans === undefined || ans === '') {
      missingAnswers.push(q.number);
      issues.push(issue('ERROR', 'MISSING_ANSWER_ENTRY',
        `${type} #: missing answer for question ${q.number}`,
        { activityType: type, questionNumber: q.number, recoveryStatus: 'NOT_RECOVERED' }));
    } else if (validLabels && typeof ans === 'string' && !isAiAnswer(ans) && !validLabels.includes(ans.toLowerCase())) {
      invalidLabels.push(String(ans));
      issues.push(issue('WARNING', 'INVALID_ANSWER_LABEL',
        `${type} #: answer "${ans}" for question ${q.number} is not a valid option label`,
        { activityType: type, questionNumber: q.number, suggestedFix: `Change "${ans}" to one of: ${validLabels.join(', ')}` }));
    }
  }

  for (const aNum of aNums) {
    if (!qNums.has(aNum)) {
      extraAnswers.push(aNum);
      issues.push(issue('WARNING', 'EXTRA_ANSWER',
        `${type} #: answer key ${aNum} has no matching question`,
        { activityType: type, questionNumber: aNum, recoveryStatus: 'RECOVERED' }));
    }
  }

  return {
    validation: { missingAnswers, duplicateAnswers, extraAnswers, invalidLabels },
    issues,
  };
}

// ─── Word Bank Validation ─────────────────────────────────────────

export function validateWordBank(
  wordBank: string[],
  answers: Record<number, string>,
): { validation: WordBankValidation; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const seen = new Set<string>();
  const duplicateWords: string[] = [];
  const usedWords = new Set(Object.values(answers).map((a) => a.toLowerCase().trim()));
  const unusedWords: string[] = [];
  const missingWords: string[] = [];
  const brokenReferences: string[] = [];

  for (const w of wordBank) {
    const lower = w.toLowerCase().trim();
    if (seen.has(lower)) duplicateWords.push(w);
    seen.add(lower);
  }

  if (duplicateWords.length > 0) {
    issues.push(issue('WARNING', 'DUPLICATE_WORD_BANK_ENTRY',
      `Duplicate word bank entries: ${duplicateWords.join(', ')}`,
      { activityType: 'DRAG_DROP', suggestedFix: 'Remove duplicate entries' }));
  }

  for (const w of wordBank) {
    const lower = w.toLowerCase().trim();
    if (!usedWords.has(lower) && !isAiAnswer(w)) {
      unusedWords.push(w);
    }
  }

  if (unusedWords.length > 0) {
    issues.push(issue('INFO', 'UNUSED_WORD_BANK_ENTRY',
      `Unused word bank entries: ${unusedWords.join(', ')}`,
      { activityType: 'DRAG_DROP' }));
  }

  for (const [, answer] of Object.entries(answers)) {
    const lower = answer.toLowerCase().trim();
    if (isAiAnswer(answer)) continue;
    if (!seen.has(lower) && !wordBank.some((w) => w.toLowerCase().trim() === lower)) {
      missingWords.push(answer);
      brokenReferences.push(answer);
      issues.push(issue('ERROR', 'MISSING_WORD_BANK_ENTRY',
        `Answer "${answer}" not found in word bank`,
        { activityType: 'DRAG_DROP', suggestedFix: `Add "${answer}" to the word bank` }));
    }
  }

  if (wordBank.length === 0) {
    issues.push(issue('ERROR', 'EMPTY_WORD_BANK', 'Word bank is empty', { activityType: 'DRAG_DROP' }));
  }

  return { validation: { duplicateWords, unusedWords, missingWords, brokenReferences }, issues };
}

// ─── Reading Validation ────────────────────────────────────────────

export function validateReading(
  content: ReadingContent,
  order: number,
): { validation: ReadingValidation; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const emptyPassage = content.passage.trim().length === 0;
  if (emptyPassage) {
    issues.push(issue('ERROR', 'READING_EMPTY_PASSAGE', `READING #${order}: passage is empty`,
      { activityType: 'READING' }));
  }

  const orphanQuestions: number[] = [];
  const missingAnswers: number[] = [];
  const duplicateNumbers: number[] = [];
  const seen = new Set<number>();

  for (const part of content.parts) {
    if (part.questions.length === 0) {
      orphanQuestions.push(-1);
      issues.push(issue('WARNING', 'ORPHAN_QUESTION', `READING #${order} part ${part.label}: no questions found`,
        { activityType: 'READING', section: part.label }));
    }
    for (const q of part.questions) {
      if (seen.has(q.number)) duplicateNumbers.push(q.number);
      seen.add(q.number);
      if (part.answers[q.number] === undefined) {
        missingAnswers.push(q.number);
        issues.push(issue('ERROR', 'MISSING_READING_ANSWER',
          `READING #${order} part ${part.label}: missing answer for question ${q.number}`,
          { activityType: 'READING', questionNumber: q.number, section: part.label }));
      }
    }
  }

  if (duplicateNumbers.length > 0) {
    issues.push(issue('ERROR', 'DUPLICATE_QUESTION_NUMBER',
      `READING #${order}: duplicate question numbers: ${duplicateNumbers.join(', ')}`,
      { activityType: 'READING' }));
  }

  if (content.parts.length === 0) {
    issues.push(issue('ERROR', 'BROKEN_READING_STRUCTURE', `READING #${order}: no parts extracted`,
      { activityType: 'READING' }));
  }

  return { validation: { emptyPassage, orphanQuestions, missingAnswers, duplicateNumbers }, issues };
}

// ─── Dialogue Validation ──────────────────────────────────────────

export function validateDialogue(
  content: DialogueContent,
  order: number,
): { validation: DialogueValidation; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const duplicateBlanks: number[] = [];
  const missingAnswers: number[] = [];
  const seenBlanks = new Set<number>();

  if (content.lines.length === 0) {
    issues.push(issue('ERROR', 'DIALOGUE_EMPTY', `DIALOGUE #${order}: no dialogue lines extracted`,
      { activityType: 'DIALOGUE' }));
  }

  for (const qNumStr of Object.keys(content.answers)) {
    const qNum = Number(qNumStr);
    if (seenBlanks.has(qNum)) duplicateBlanks.push(qNum);
    seenBlanks.add(qNum);
  }

  if (duplicateBlanks.length > 0) {
    issues.push(issue('WARNING', 'DUPLICATE_DIALOGUE_BLANK',
      `DIALOGUE #${order}: duplicate blank numbers: ${duplicateBlanks.join(', ')}`,
      { activityType: 'DIALOGUE' }));
  }

  const blankPattern = /\((\d+)\)\s*\.{3,}/g;
  let blankMatch: RegExpExecArray | null;
  const blanksFromText: number[] = [];
  for (const line of content.lines) {
    const pattern = new RegExp(blankPattern.source, 'g');
    while ((blankMatch = pattern.exec(line.text)) !== null) {
      blanksFromText.push(Number(blankMatch[1]));
    }
  }

  for (const blankNum of blanksFromText) {
    if (content.answers[blankNum] === undefined) {
      missingAnswers.push(blankNum);
      issues.push(issue('ERROR', 'MISSING_DIALOGUE_ANSWER',
        `DIALOGUE #${order}: missing answer for blank ${blankNum}`,
        { activityType: 'DIALOGUE', questionNumber: blankNum }));
    }
  }

  return { validation: { missingLines: 0, duplicateBlanks, missingAnswers }, issues };
}

// ─── MCQ Validation ───────────────────────────────────────────────

export function validateMcq(
  content: McqContent,
  order: number,
): { validation: McqValidation; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const emptyQuestions: number[] = [];
  const tooFewOptions: number[] = [];
  const duplicateLabels: number[] = [];
  const invalidCorrectAnswers: number[] = [];

  for (const cat of content.categories) {
    for (const q of cat.questions) {
      if (!q.question.trim()) emptyQuestions.push(q.number);
      if (q.options.length < 2) tooFewOptions.push(q.number);
      const seenLabels = new Set<string>();
      for (const opt of q.options) {
        if (!opt.text.trim()) {
          issues.push(issue('WARNING', 'EMPTY_OPTION', `MCQ #${order} Q${q.number}: option ${opt.label} is empty`,
            { activityType: 'MCQ', questionNumber: q.number }));
        }
        if (seenLabels.has(opt.label)) {
          duplicateLabels.push(q.number);
          issues.push(issue('ERROR', 'DUPLICATE_OPTION_LABEL', `MCQ #${order} Q${q.number}: duplicate option label "${opt.label}"`,
            { activityType: 'MCQ', questionNumber: q.number }));
        }
        seenLabels.add(opt.label);
      }
      const correctAnswer = content.answers[q.number];
      if (correctAnswer && !isAiAnswer(correctAnswer)) {
        const answerLower = correctAnswer.toLowerCase().trim();
        if (!VALID_OPTION_LABELS.has(answerLower) || !q.options.some((o) => o.label === answerLower)) {
          invalidCorrectAnswers.push(q.number);
          issues.push(issue('WARNING', 'INVALID_CORRECT_ANSWER',
            `MCQ #${order} Q${q.number}: answer "${correctAnswer}" does not match any option label`,
            { activityType: 'MCQ', questionNumber: q.number, suggestedFix: `Change answer to one of: ${q.options.map((o) => o.label).join(', ')}` }));
        }
      }
    }
  }

  if (tooFewOptions.length > 0) {
    issues.push(issue('ERROR', 'MCQ_TOO_FEW_OPTIONS',
      `MCQ #${order}: questions with fewer than 2 options: ${tooFewOptions.join(', ')}`,
      { activityType: 'MCQ' }));
  }

  return { validation: { emptyQuestions, tooFewOptions, duplicateLabels, invalidCorrectAnswers }, issues };
}

// ─── Document Validation ──────────────────────────────────────────

export function validateDocument(
  rawText: string,
  sections: { type: ActivityType; rawText: string }[],
  orphanParagraphs: number,
  orphanTables: number,
): { validation: DocumentValidation; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const duplicateMarkers: string[] = [];
  const nestedMarkers: string[] = [];
  const brokenMarkers: string[] = [];
  const emptySections: string[] = [];
  const seenTypes = new Map<ActivityType, number>();

  for (const section of sections) {
    const count = seenTypes.get(section.type) ?? 0;
    if (count > 0 && !duplicateMarkers.includes(section.type)) {
      duplicateMarkers.push(section.type);
    }
    seenTypes.set(section.type, count + 1);

    if (!section.rawText.trim()) {
      emptySections.push(section.type);
    }
  }

  if (duplicateMarkers.length > 0) {
    issues.push(issue('WARNING', 'DUPLICATE_ACTIVITY_MARKER',
      `Duplicate activity markers: ${duplicateMarkers.join(', ')}`,
      { recoveryStatus: 'RECOVERED' }));
  }

  const lines = rawText.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]?.trim() ?? '';
    const nestedMatch = line.match(/@@(\w+)@@.*@@(\w+)@@/);
    if (nestedMatch) {
      nestedMarkers.push(nestedMatch[0]);
    }
    if (/@@\w+/.test(line) && !/@@\w+@@/.test(line)) {
      brokenMarkers.push(line);
    }
  }

  if (nestedMarkers.length > 0) {
    issues.push(issue('WARNING', 'NESTED_MARKER',
      `Nested markers detected: ${nestedMarkers.join(', ')}`,
      { suggestedFix: 'Place markers on separate lines' }));
  }

  if (brokenMarkers.length > 0) {
    issues.push(issue('ERROR', 'BROKEN_MARKER',
      `Broken markers (missing closing @@): ${brokenMarkers.join(', ')}`,
      { suggestedFix: 'Ensure all markers follow @@NAME@@ format' }));
  }

  if (orphanParagraphs > 0) {
    issues.push(issue('INFO', 'ORPHAN_PARAGRAPH',
      `${String(orphanParagraphs)} paragraph(s) found outside activity sections`,
      { recoveryStatus: 'RECOVERED' }));
  }

  if (orphanTables > 0) {
    issues.push(issue('INFO', 'ORPHAN_PARAGRAPH',
      `${String(orphanTables)} table(s) found outside activity sections`,
      { recoveryStatus: 'RECOVERED' }));
  }

  return { validation: { duplicateMarkers, nestedMarkers, brokenMarkers, orphanParagraphs, orphanTables, emptySections }, issues };
}

// ─── Master Validator ──────────────────────────────────────────────

export function validateAll(
  rawText: string,
  activities: ImportedActivity[],
  sections: { type: ActivityType; rawText: string }[],
): { report: ValidationReport; allIssues: ValidationIssue[] } {
  const allIssues: ValidationIssue[] = [];
  const recoveryActions: RecoveryAction[] = [];
  const unknownMarkers = detectUnknownMarkers(rawText);
  allIssues.push(...unknownMarkers.issues);
  for (const r of unknownMarkers.recoveries) {
    recoveryActions.push({ type: 'unknown_marker_recovery', description: `Recovered content from "${r.markerName}"`, success: true, recoveredContent: r.recoveredText });
  }

  const docValidation = validateDocument(rawText, sections, 0, 0);
  allIssues.push(...docValidation.issues);

  let answerKeys: AnswerKeyValidation | null = null;
  let wordBank: WordBankValidation | null = null;
  let reading: ReadingValidation | null = null;
  let mcq: McqValidation | null = null;
  let dialogue: DialogueValidation | null = null;

  for (const activity of activities) {
    const { type, order, content } = activity;

    if (type === 'MCQ') {
      const mcqContent = content as McqContent;
      const qs: { number: number }[] = mcqContent.categories.flatMap((c) => c.questions);
      const ak = validateAnswerKeys(type, qs, mcqContent.answers, ['a', 'b', 'c', 'd']);
      allIssues.push(...ak.issues);
      answerKeys = ak.validation;
      const mcqV = validateMcq(mcqContent, order);
      allIssues.push(...mcqV.issues);
      mcq = mcqV.validation;
    }

    if (type === 'DRAG_DROP') {
      const ddContent = content as DragDropContent;
      const qs: { number: number }[] = Object.keys(ddContent.answers).map(Number).filter((n) => !isNaN(n)).map((n) => ({ number: n }));
      const ak = validateAnswerKeys(type, qs, ddContent.answers);
      allIssues.push(...ak.issues);
      answerKeys = ak.validation;
      const wb = validateWordBank(ddContent.wordBank, ddContent.answers);
      allIssues.push(...wb.issues);
      wordBank = wb.validation;
    }

    if (type === 'READING') {
      const rdContent = content as ReadingContent;
      const rv = validateReading(rdContent, order);
      allIssues.push(...rv.issues);
      reading = rv.validation;
    }

    if (type === 'DIALOGUE') {
      const dlContent = content as DialogueContent;
      const dv = validateDialogue(dlContent, order);
      allIssues.push(...dv.issues);
      dialogue = dv.validation;
    }

    if (type === 'TRUE_FALSE' || type === 'REWRITE' || type === 'CORRECT') {
      let qs: { number: number }[];
      let ans: Record<number, string | boolean>;
      if (type === 'TRUE_FALSE') {
        const tfContent = content as TrueFalseContent;
        qs = tfContent.questions;
        ans = tfContent.answers;
      } else if (type === 'REWRITE') {
        const rwContent = content as RewriteContent;
        qs = rwContent.questions;
        ans = rwContent.answers;
      } else {
        const crContent = content as CorrectContent;
        qs = crContent.questions;
        ans = crContent.answers;
      }
      const ak = validateAnswerKeys(type, qs, ans);
      allIssues.push(...ak.issues);
      answerKeys = ak.validation;
    }

    if (type === 'WRITING') {
      const wrContent = content as WritingContent;
      if (!wrContent.topic.trim()) {
        allIssues.push(issue('ERROR', 'WRITING_EMPTY_TOPIC', `WRITING #${order}: topic is empty`, { activityType: 'WRITING' }));
      }
    }
  }

  const totalIssues = allIssues.length;
  const errorCount = allIssues.filter((i) => i.severity === 'ERROR' || i.severity === 'CRITICAL').length;
  const recoveredCount = allIssues.filter((i) => i.recoveryStatus === 'RECOVERED').length;
  const importSafetyScore = totalIssues === 0 ? 100 : Math.round(((totalIssues - errorCount) / totalIssues) * 100);
  const validationScore = totalIssues === 0 ? 100 : Math.round((recoveredCount / totalIssues) * 100);

  const report: ValidationReport = {
    unknownMarkers: unknownMarkers.recoveries,
    answerKeys,
    wordBank,
    reading,
    mcq,
    dialogue,
    document: docValidation.validation,
    recoveryActions,
    issues: allIssues,
    importSafetyScore,
    validationScore,
  };

  return { report, allIssues };
}
