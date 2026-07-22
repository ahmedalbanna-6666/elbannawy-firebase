import { parseQuestionText } from '../docx-importer.js';
import type { McqContent, DragDropContent, ReadingContent, RewriteContent, CorrectContent, DialogueContent, TrueFalseContent, WritingContent } from '../types.js';

const SAMPLE_DOCX_TEXT = `General Exercises On Lesson 1 & 2

@@MCQ@@

(1) Choose the correct answer from a, b, c, or d:

 Key vocabulary

The .......... living conditions in the desert kill many animals.

a. soft

b. harsh

c. easy

d. nice

 Definitions

SB ".........." means able to change easily.

a. Harsh

b. Hard

c. Steel

d. Flexible

@@ANSWER_KEY@@

1=b

2=d

@@DRAG_DROP@@

(2) Read and complete the text with the words in the box:

@@WORD_BANK@@adaptations – plants – conservation – predators – migration@@END_WORD_BANK@@

Life in the desert is difficult because of the harsh conditions. Animals need special(1) ……… to survive.

@@ANSWER_KEY@@

1= adaptations

2= predators

@@READING@@

(3) Read the following text, then answer the questions:

Life in the desert is extremely challenging.

A. Choose the correct answer from a, b, c or d:

1. The fennec fox uses its large ears to .......... .

a. store water

b. lose heat and hear prey

c. hide from predators

d. protect its feet

@@ANSWER_KEY@@

1=b

B. Answer the following questions:

4. Give a suitable title for the passage.

@@ANSWER_KEY@@

4= AI

@@REWRITE@@

(4) Rewrite the following sentences:

1. "How do lizards survive in the desert?" (He asked)

@@ANSWER_KEY@@

1=he asked if lizards survive in the desert

@@CORRECT@@

(5) Complete the sentences with the correct form of the word(s) in brackets:

1. She asked me if I ……………… (will go) to the party that evening.

@@ANSWER_KEY@@

1=would go

@@DIALOGUE@@

(6) Complete the following dialogue:

Student A

What's your favorite desert animal?

Student B

(1) ........................................ . I think fennec foxes are amazing.

@@ANSWER_KEY@@

1=AI

@@TRUE_FALSE@@

(7) Read and write (T) True or (F) False :

1. The other children were always kind to Amal. ( )

@@ANSWER_KEY@@

1=t

@@WRITING@@

(8) Write a paragraph of ONE HUNDRED and TEN (110) words on:

"How animals adapt to survive in their environments"

@@ANSWER_KEY@@

Check the paragraph=AI
`;

describe('Question Import Engine', () => {
  test('parses document title', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    expect(result.documentTitle).toBe('General Exercises On Lesson 1 & 2');
  });

  test('identifies all 8 activity types', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const types = result.activities.map((a) => a.type);
    expect(types).toEqual(['MCQ', 'DRAG_DROP', 'READING', 'REWRITE', 'CORRECT', 'DIALOGUE', 'TRUE_FALSE', 'WRITING']);
  });

  test('preserves activity order', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    expect(result.activities.map((a) => a.order)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });

  test('parses MCQ with categories and options', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const mcq = result.activities[0]!;
    expect(mcq.type).toBe('MCQ');
    const content = mcq.content as McqContent;
    expect(content.categories.length).toBeGreaterThanOrEqual(1);
    expect(content.answers['1']).toBe('b');
  });

  test('parses DRAG_DROP with word bank', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const dd = result.activities[1]!;
    expect(dd.type).toBe('DRAG_DROP');
    const content = dd.content as DragDropContent;
    expect(content.wordBank.length).toBeGreaterThan(0);
    expect(content.answers['1']).toBe('adaptations');
  });

  test('parses READING with passage and parts', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const reading = result.activities[2]!;
    expect(reading.type).toBe('READING');
    const content = reading.content as ReadingContent;
    expect(content.passage.length).toBeGreaterThan(0);
    expect(content.parts.length).toBe(2);
    expect(content.parts[0]!.type).toBe('MCQ');
    expect(content.parts[1]!.type).toBe('OPEN_ENDED');
  });

  test('parses REWRITE with prompt and indirect phrase', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const rewrite = result.activities[3]!;
    expect(rewrite.type).toBe('REWRITE');
    const content = rewrite.content as RewriteContent;
    expect(content.questions[0]!.prompt).toBeTruthy();
    expect(content.questions[0]!.indirectPhrase).toBeTruthy();
  });

  test('parses CORRECT with sentence blanks', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const correct = result.activities[4]!;
    expect(correct.type).toBe('CORRECT');
    const content = correct.content as CorrectContent;
    expect(content.questions[0]!.sentence).toContain('………………');
    expect(content.answers['1']).toBe('would go');
  });

  test('parses DIALOGUE with speaker lines', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const dialogue = result.activities[5]!;
    expect(dialogue.type).toBe('DIALOGUE');
    const content = dialogue.content as DialogueContent;
    expect(content.lines.length).toBeGreaterThan(0);
    expect(content.lines[0]!.speaker).toBe('Student A');
  });

  test('parses TRUE_FALSE with boolean answers', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const tf = result.activities[6]!;
    expect(tf.type).toBe('TRUE_FALSE');
    const content = tf.content as TrueFalseContent;
    expect(content.questions[0]!.statement).toBeTruthy();
    expect(content.answers['1']).toBe(true);
  });

  test('parses WRITING with topic and word count', () => {
    const result = parseQuestionText(SAMPLE_DOCX_TEXT);
    const writing = result.activities[7]!;
    expect(writing.type).toBe('WRITING');
    const content = writing.content as WritingContent;
    expect(content.topic).toContain('animals');
    expect(content.wordCount).not.toBeNull();
  });

  test('detects missing answer key', () => {
    const text = '@@MCQ@@\n\n(1) Test question\n\na. opt1\nb. opt2\n';
    const result = parseQuestionText(text);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]!.code).toBe('NO_ANSWER_KEY');
  });

  test('handles extra whitespace and blank lines', () => {
    const text = '\n\n\n@@MCQ@@\n\n\n\n(1)   Test   question\n\n\n\na.   opt1\n\nb.   opt2\n\n\n\n@@ANSWER_KEY@@\n\n1   =   a\n\n\n\n';
    const result = parseQuestionText(text);
    expect(result.activities.length).toBe(1);
    expect(result.activities[0]!.type).toBe('MCQ');
  });

  test('ignores unknown markers', () => {
    const text = '@@MCQ@@\n\n(1) Test\n\na. o1\nb. o2\n\n@@ANSWER_KEY@@\n1=a\n\n@@UNKNOWN@@\n\nSome content\n';
    const result = parseQuestionText(text);
    expect(result.activities.length).toBe(1);
    expect(result.activities[0]!.type).toBe('MCQ');
  });

  test('detects duplicate activity marker', () => {
    const text = '@@MCQ@@\n\n(1) Q\n\na. a\nb. b\n\n@@ANSWER_KEY@@\n1=a\n\n@@MCQ@@\n\n(2) Q2\n\na. a\nb. b\n\n@@ANSWER_KEY@@\n2=a\n';
    const result = parseQuestionText(text);
    expect(result.warnings.some((w) => w.code === 'DUPLICATE_ACTIVITY_MARKER')).toBe(true);
  });

  test('returns typed ImportError objects', () => {
    const noAk = parseQuestionText('@@MCQ@@\n\n(1) Q\n\na. a\nb. b\n');
    expect(noAk.errors[0]).toMatchObject({ code: 'NO_ANSWER_KEY', message: expect.any(String) });
  });

  test('empty document returns default title', () => {
    const result = parseQuestionText('');
    expect(result.documentTitle).toBe('Untitled Document');
    expect(result.activities).toEqual([]);
  });
});
