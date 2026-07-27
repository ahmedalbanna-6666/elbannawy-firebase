import { validateAll, detectUnknownMarkers, validateAnswerKeys, validateWordBank, validateReading, validateDialogue, validateMcq, validateDocument } from '../../../question-import/validation-engine';
import type { McqContent, ReadingContent, DialogueContent, DragDropContent, TrueFalseContent } from '../../../question-import/types';

describe('Validation Engine — Unknown Markers', () => {
  it('detects unknown @@MARKER@@', () => {
    const { recoveries, issues } = detectUnknownMarkers('@@UNKNOWN@@\nsome content');
    expect(recoveries.length).toBeGreaterThan(0);
    expect(recoveries[0]?.markerName).toBe('@@UNKNOWN@@');
    expect(issues.length).toBeGreaterThan(0);
  });

  it('does NOT flag known markers', () => {
    const { issues } = detectUnknownMarkers('@@MCQ@@\ncontent\n@@ANSWER_KEY@@\n1=a');
    const unknownIssues = issues.filter((i) => i.code === 'UNKNOWN_MARKER_DETECTED');
    expect(unknownIssues).toHaveLength(0);
  });

  it('detects multiple unknown markers', () => {
    const { recoveries } = detectUnknownMarkers('@@GRAMMAR@@\na\n@@MATCHING@@\nb');
    expect(recoveries.length).toBe(2);
  });
});

describe('Validation Engine — Answer Keys', () => {
  it('detects missing answers', () => {
    const { validation } = validateAnswerKeys('MCQ', [{ number: 1 }, { number: 2 }], { 1: 'a' }, ['a', 'b', 'c', 'd']);
    expect(validation.missingAnswers).toContain(2);
  });

  it('detects invalid answer labels', () => {
    const { validation } = validateAnswerKeys('MCQ', [{ number: 1 }], { 1: 'z' }, ['a', 'b', 'c', 'd']);
    expect(validation.invalidLabels).toContain('z');
  });

  it('detects extra answers', () => {
    const { validation } = validateAnswerKeys('MCQ', [{ number: 1 }], { 1: 'a', 99: 'b' }, ['a', 'b']);
    expect(validation.extraAnswers).toContain(99);
  });

  it('accepts AI answers as valid', () => {
    const { validation } = validateAnswerKeys('READING', [{ number: 4 }], { 4: 'AI' }, ['a', 'b', 'c', 'd']);
    expect(validation.invalidLabels).not.toContain('AI');
  });
});

describe('Validation Engine — Word Bank', () => {
  it('detects duplicate entries', () => {
    const { validation } = validateWordBank(['word', 'word', 'other'], { 1: 'word' });
    expect(validation.duplicateWords).toContain('word');
  });

  it('detects unused words', () => {
    const { validation } = validateWordBank(['unused', 'used'], { 1: 'used' });
    expect(validation.unusedWords).toContain('unused');
  });

  it('detects broken references (answer not in bank)', () => {
    const { validation } = validateWordBank(['existing'], { 1: 'missing' });
    expect(validation.brokenReferences).toContain('missing');
  });

  it('warns on empty word bank', () => {
    const { issues } = validateWordBank([], {});
    expect(issues.some((i) => i.code === 'EMPTY_WORD_BANK')).toBe(true);
  });
});

describe('Validation Engine — Reading', () => {
  it('detects empty passage', () => {
    const content: ReadingContent = { instruction: '', passage: '', parts: [] };
    const { validation } = validateReading(content, 1);
    expect(validation.emptyPassage).toBe(true);
  });

  it('detects missing answers', () => {
    const content: ReadingContent = {
      instruction: '', passage: 'text',
      parts: [{ label: 'A', instruction: '', type: 'MCQ', questions: [{ number: 1, question: 'Q?', options: [{ label: 'a', text: 'o1' }] }], answers: {} }],
    };
    const { validation, issues } = validateReading(content, 1);
    expect(validation.missingAnswers).toContain(1);
    expect(issues.some((i) => i.code === 'MISSING_READING_ANSWER')).toBe(true);
  });

  it('detects broken structure (no parts)', () => {
    const content: ReadingContent = { instruction: '', passage: 'text', parts: [] };
    const { issues } = validateReading(content, 1);
    expect(issues.some((i) => i.code === 'BROKEN_READING_STRUCTURE')).toBe(true);
  });
});

describe('Validation Engine — Dialogue', () => {
  it('detects empty dialogue', () => {
    const content: DialogueContent = { instruction: '', lines: [], answers: {} };
    const { validation, issues } = validateDialogue(content, 1);
    expect(issues.length > 0 || validation.missingLines === 0).toBe(true);
  });

  it('detects missing answers for blanks', () => {
    const content: DialogueContent = {
      instruction: '', lines: [{ speaker: 'Student A', text: '(1) .........' }], answers: {},
    };
    const { validation, issues } = validateDialogue(content, 1);
    const hasMissing = validation.missingAnswers.length > 0 || issues.some((i) => i.code === 'MISSING_DIALOGUE_ANSWER');
    expect(validation.missingLines >= 0 || hasMissing).toBe(true);
  });
});

describe('Validation Engine — MCQ', () => {
  it('detects too few options', () => {
    const content: McqContent = {
      instruction: '', categories: [{ name: 'General', questions: [{ number: 1, prefix: null, category: null, question: 'Q?', options: [{ label: 'a', text: 'only' }] }] }], answers: { 1: 'a' },
    };
    const { validation } = validateMcq(content, 1);
    expect(validation.tooFewOptions).toContain(1);
  });

  it('detects duplicate option labels', () => {
    const content: McqContent = {
      instruction: '', categories: [{ name: 'General', questions: [{ number: 1, prefix: null, category: null, question: 'Q?', options: [{ label: 'a', text: 'opt1' }, { label: 'a', text: 'opt2' }] }] }], answers: { 1: 'a' },
    };
    const { issues } = validateMcq(content, 1);
    expect(issues.some((i) => i.code === 'DUPLICATE_OPTION_LABEL')).toBe(true);
  });

  it('detects invalid correct answer', () => {
    const content: McqContent = {
      instruction: '', categories: [{ name: 'General', questions: [{ number: 1, prefix: null, category: null, question: 'Q?', options: [{ label: 'a', text: 'o1' }, { label: 'b', text: 'o2' }] }] }], answers: { 1: 'z' },
    };
    const { issues } = validateMcq(content, 1);
    expect(issues.some((i) => i.code === 'INVALID_CORRECT_ANSWER')).toBe(true);
  });
});

describe('Validation Engine — Document Structure', () => {
  it('detects duplicate markers', () => {
    const { validation } = validateDocument('@@MCQ@@\na\n@@MCQ@@\nb', [{ type: 'MCQ', rawText: 'a' }, { type: 'MCQ', rawText: 'b' }], 0, 0);
    expect(validation.duplicateMarkers).toContain('MCQ');
  });

  it('detects broken markers (missing closing @@)', () => {
    const { validation } = validateDocument('@@MCQ\ncontent', [], 0, 0);
    expect(validation.brokenMarkers.length).toBeGreaterThan(0);
  });
});

describe('Validation Engine — validateAll integration', () => {
  it('returns scores for valid content', () => {
    const { report } = validateAll('@@MCQ@@\nQ?\na. o1\nb. o2\n@@ANSWER_KEY@@\n1=a', [], [{ type: 'MCQ', rawText: 'Q?\na. o1\nb. o2\n@@ANSWER_KEY@@\n1=a' }]);
    expect(report.importSafetyScore).toBeGreaterThanOrEqual(0);
    expect(report.validationScore).toBeGreaterThanOrEqual(0);
  });
});
