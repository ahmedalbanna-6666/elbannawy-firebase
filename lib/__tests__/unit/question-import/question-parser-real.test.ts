import * as fs from 'fs';
import * as path from 'path';
import { importQuestionsFromDocx } from '../../../question-import/docx-importer';
import { ensureAllFixtures, QFIXTURES } from './fixtures/question-docx-generator';
import type { McqContent, DragDropContent, ReadingContent, RewriteContent, CorrectContent, DialogueContent, TrueFalseContent, WritingContent } from '../../../question-import/types';

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures');

beforeAll(async () => {
  await ensureAllFixtures();
}, 30000);

describe('Real DOCX — Perfect Document (all 8 types)', () => {
  let result: Awaited<ReturnType<typeof importQuestionsFromDocx>>;

  beforeAll(async () => {
    const filePath = path.resolve(FIXTURE_DIR, QFIXTURES.PERFECT + '.docx');
    result = await importQuestionsFromDocx({ filePath });
  });

  it('document title is correct', () => {
    expect(result.documentTitle).toBe('General Exercises On Lesson 1 & 2');
  });

  it('parses all 8 activities', () => {
    expect(result.activities).toHaveLength(8);
  });

  it('activity types in correct order', () => {
    const types = result.activities.map((a) => a.type);
    expect(types).toEqual(['MCQ', 'DRAG_DROP', 'READING', 'REWRITE', 'CORRECT', 'DIALOGUE', 'TRUE_FALSE', 'WRITING']);
  });

  it('no fatal errors for perfect document', () => {
    const critical = result.errors.filter((e) => e.code === 'NO_ANSWER_KEY');
    expect(critical).toHaveLength(0);
  });

  it('has validationReport', () => {
    expect(result.validationReport).toBeDefined();
  });

  it('validation report has scores', () => {
    expect(result.validationReport!.importSafetyScore).toBeGreaterThanOrEqual(0);
    expect(result.validationReport!.validationScore).toBeGreaterThanOrEqual(0);
  });

  describe('MCQ', () => {
    let mcq: McqContent;
    beforeAll(() => { mcq = result.activities[0]!.content as McqContent; });

    it('has categories', () => { expect(mcq.categories.length).toBeGreaterThan(0); });
    it('answers mapped correctly', () => { expect(mcq.answers['1']).toBe('b'); });
  });

  describe('DRAG_DROP', () => {
    let dd: DragDropContent;
    beforeAll(() => { dd = result.activities[1]!.content as DragDropContent; });

    it('has word bank', () => { expect(dd.wordBank.length).toBeGreaterThan(0); });
    it('answers mapped', () => { expect(dd.answers['1']).toBe('adaptations'); });
  });

  describe('READING', () => {
    let reading: ReadingContent;
    beforeAll(() => { reading = result.activities[2]!.content as ReadingContent; });

    it('has passage', () => { expect(reading.passage.length).toBeGreaterThan(0); });
    it('has parts', () => { expect(reading.parts.length).toBeGreaterThan(0); });
  });

  describe('REWRITE', () => {
    let rewrite: RewriteContent;
    beforeAll(() => { rewrite = result.activities[3]!.content as RewriteContent; });

    it('has questions', () => { expect(rewrite.questions.length).toBeGreaterThan(0); });
  });

  describe('CORRECT', () => {
    let correct: CorrectContent;
    beforeAll(() => { correct = result.activities[4]!.content as CorrectContent; });
    it('has answers', () => { expect(correct.answers['1']).toBe('would go'); });
  });

  describe('DIALOGUE', () => {
    let dialogue: DialogueContent;
    beforeAll(() => { dialogue = result.activities[5]!.content as DialogueContent; });
    it('has lines', () => { expect(dialogue.lines.length).toBeGreaterThan(0); });
  });

  describe('TRUE_FALSE', () => {
    let tf: TrueFalseContent;
    beforeAll(() => { tf = result.activities[6]!.content as TrueFalseContent; });
    it('has boolean answers', () => { expect(tf.answers['1']).toBe(true); });
  });

  describe('WRITING', () => {
    let writing: WritingContent;
    beforeAll(() => { writing = result.activities[7]!.content as WritingContent; });
    it('has topic', () => { expect(writing.topic.length).toBeGreaterThan(0); });
    it('detects word count', () => { expect(writing.wordCount).not.toBeNull(); });
  });
});

describe('Real DOCX — Broken Answer Key', () => {
  let result: Awaited<ReturnType<typeof importQuestionsFromDocx>>;

  beforeAll(async () => {
    const filePath = path.resolve(FIXTURE_DIR, QFIXTURES.BROKEN_AK + '.docx');
    result = await importQuestionsFromDocx({ filePath });
  });

  it('detects missing answer value', () => {
    const missing = result.validationReport?.answerKeys?.missingAnswers;
    expect(missing).toBeDefined();
  });
});

describe('Real DOCX — Unknown Marker', () => {
  let result: Awaited<ReturnType<typeof importQuestionsFromDocx>>;

  beforeAll(async () => {
    const filePath = path.resolve(FIXTURE_DIR, QFIXTURES.UNKNOWN_MARKER + '.docx');
    result = await importQuestionsFromDocx({ filePath });
  });

  it('detects unknown marker', () => {
    expect(result.validationReport!.unknownMarkers.length).toBeGreaterThan(0);
  });

  it('recovers content from unknown marker', () => {
    const recovered = result.validationReport!.unknownMarkers.find((m) => m.markerName === '@@UNKNOWN@@');
    expect(recovered).toBeDefined();
  });
});

describe('Real DOCX — Duplicate Marker', () => {
  let result: Awaited<ReturnType<typeof importQuestionsFromDocx>>;

  beforeAll(async () => {
    const filePath = path.resolve(FIXTURE_DIR, QFIXTURES.DUPLICATE_MARKER + '.docx');
    result = await importQuestionsFromDocx({ filePath });
  });

  it('warns about duplicate marker', () => {
    expect(result.validationReport!.document.duplicateMarkers).toContain('MCQ');
  });
});

describe('Real DOCX — Broken Word Bank', () => {
  let result: Awaited<ReturnType<typeof importQuestionsFromDocx>>;

  beforeAll(async () => {
    const filePath = path.resolve(FIXTURE_DIR, QFIXTURES.BROKEN_WORD_BANK + '.docx');
    result = await importQuestionsFromDocx({ filePath });
  });

  it('detects empty word bank', () => {
    expect(result.validationReport!.wordBank).toBeDefined();
  });
});

describe('Real DOCX — Empty Section', () => {
  let result: Awaited<ReturnType<typeof importQuestionsFromDocx>>;

  beforeAll(async () => {
    const filePath = path.resolve(FIXTURE_DIR, QFIXTURES.EMPTY_SECTION + '.docx');
    result = await importQuestionsFromDocx({ filePath });
  });

  it('handles empty section gracefully', () => {
    expect(result.activities.length).toBe(0);
  });
});
