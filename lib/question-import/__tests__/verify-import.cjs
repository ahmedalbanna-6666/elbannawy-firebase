const path = require('path');
const BASE = path.resolve(__dirname, '../..');
const mammoth = require(path.join(BASE, 'node_modules/mammoth'));
const { importQuestionsFromDocx, parseQuestionText } = require(path.join(BASE, 'dist/question-import/docx-importer.js'));

async function main() {
  console.log('=== PRODUCTION VERIFICATION ===');
  console.log('');

  let passCount = 0, failCount = 0;
  function assert(condition, label) {
    if (condition) { passCount++; }
    else { failCount++; console.log('  FAIL: ' + label); }
  }

  // ─── Phase 1: Real Document Parsing ───────────────────────────
  console.log('--- Phase 1: Real Document ---');
  const result = await importQuestionsFromDocx({ filePath: 'docs/word files/questions.docx' });

  assert(result.documentTitle === 'General Exercises On Lesson 1 & 2', 'Document title');
  assert(result.activities.length === 8, '8 activities found');
  assert(result.errors.length === 0, 'No top-level errors');
  assert(result.warnings.length === 0, 'No top-level warnings');

  const acts = result.activities;
  const types = acts.map(a => a.type);
  assert(types.join() === 'MCQ,DRAG_DROP,READING,REWRITE,CORRECT,DIALOGUE,TRUE_FALSE,WRITING', 'Activity types in order');
  assert(acts.every(a => a.order >= 1 && a.order <= 8), 'All orders 1-8');
  assert(acts.every(a => typeof a.content === 'object' && a.content !== null), 'All have content object');
  assert(acts.every(a => Array.isArray(a.errors) && Array.isArray(a.warnings)), 'All have errors/warnings arrays');
  assert(acts.every(a => a.errors.every(e => typeof e.code === 'string' && typeof e.message === 'string')), 'Error objects typed correctly');
  assert(acts.every(a => a.warnings.every(w => typeof w.code === 'string' && typeof w.message === 'string')), 'Warning objects typed correctly');

  // ─── Phase 2: MCQ ─────────────────────────────────────────────
  console.log('');
  console.log('--- Phase 2: MCQ ---');
  const mcq = acts[0].content;
  assert(mcq.categories.length >= 4, '4+ categories');
  assert(mcq.categories[0].name === 'Key vocabulary', 'First category is Key vocabulary');
  assert(mcq.categories[0].questions.length === 3, 'Key vocabulary has 3 questions');
  assert(mcq.categories[1].name === 'Definitions', 'Second category is Definitions');
  assert(mcq.categories[1].questions.length === 2, 'Definitions has 2 questions');
  assert(mcq.categories.find(c => c.name === 'Collocations').questions.length === 1, 'Collocations has 1 question');
  assert(mcq.answers['1'] === 'b', 'Q1 answer = b');
  assert(mcq.answers['2'] === 'c', 'Q2 answer = c');
  assert(mcq.answers['13'] === 'c', 'Q13 answer = c');
  assert(mcq.categories[0].questions[0].options.length === 4, 'Q1 has 4 options');
  assert(mcq.categories[0].questions[0].options[0].label === 'a', 'Option a label');
  assert(mcq.categories[0].questions[0].options[0].text === 'soft', 'Option a text');
  assert(mcq.categories[0].questions[1].prefix === 'AB', 'Q2 has AB prefix');
  assert(mcq.categories[1].questions[0].prefix === 'SB', 'Q4 has SB prefix');

  // ─── Phase 3: DRAG_DROP ───────────────────────────────────────
  console.log('');
  console.log('--- Phase 3: DRAG_DROP ---');
  const dd = acts[1].content;
  assert(dd.wordBank.length === 5, 'Word bank has 5 words');
  assert(dd.wordBank[0] === 'adaptations', 'WB[0] = adaptations');
  assert(dd.wordBank[1] === 'plants', 'WB[1] = plants');
  assert(dd.wordBank[2] === 'conservation', 'WB[2] = conservation');
  assert(dd.wordBank[3] === 'predators', 'WB[3] = predators');
  assert(dd.wordBank[4] === 'migration', 'WB[4] = migration');
  assert(dd.answers['1'] === 'adaptations', 'Blank 1 answer');
  assert(dd.answers['2'] === 'predators', 'Blank 2 answer');
  assert(dd.answers['3'] === 'conservation', 'Blank 3 answer');
  assert(dd.answers['4'] === 'plants', 'Blank 4 answer');
  assert(dd.textWithBlanks.includes('(1)'), 'Text contains blank (1)');
  assert(dd.textWithBlanks.includes('(4)'), 'Text contains blank (4)');

  // ─── Phase 4: READING ─────────────────────────────────────────
  console.log('');
  console.log('--- Phase 4: READING ---');
  const reading = acts[2].content;
  assert(reading.passage.length > 100, 'Passage extracted');
  assert(reading.passage.includes('fennec fox'), 'Passage mentions fennec fox');
  assert(reading.passage.toLowerCase().includes('camels'), 'Passage mentions camels');
  assert(reading.parts.length === 2, '2 parts');
  assert(reading.parts[0].label === 'A', 'Part A label');
  assert(reading.parts[0].type === 'MCQ', 'Part A type');
  assert(reading.parts[0].questions.length === 3, 'Part A has 3 questions');
  assert(reading.parts[0].questions[0].options.length === 4, 'Part A Q1 has 4 options');
  assert(reading.parts[0].answers['1'] === 'b', 'Part A Q1 answer = b');
  assert(reading.parts[0].answers['3'] === 'd', 'Part A Q3 answer = d');
  assert(reading.parts[1].label === 'B', 'Part B label');
  assert(reading.parts[1].type === 'OPEN_ENDED', 'Part B type');
  assert(reading.parts[1].questions.length === 3, 'Part B has 3 questions');
  assert(reading.parts[1].answers['4'] === 'AI', 'Part B Q4 = AI');
  assert(reading.parts[1].answers['6'] === 'AI', 'Part B Q6 = AI');
  assert(reading.parts[1].questions[2].options === null, 'Open-ended has null options');

  // ─── Phase 5: REWRITE ─────────────────────────────────────────
  console.log('');
  console.log('--- Phase 5: REWRITE ---');
  const rewrite = acts[3].content;
  assert(rewrite.questions.length === 3, '3 questions');
  assert(rewrite.questions[0].number === 1, 'Q1 number = 1');
  assert(rewrite.questions[0].prompt.includes('lizards'), 'Q1 prompt about lizards');
  assert(rewrite.questions[0].indirectPhrase === 'He asked', 'Q1 indirect = He asked');
  assert(rewrite.questions[1].indirectPhrase === 'She wanted to know', 'Q2 indirect');
  assert(rewrite.questions[2].indirectPhrase === 'The teacher asked', 'Q3 indirect');
  assert(typeof rewrite.answers['1'] === 'string', 'Answer 1 is string');

  // ─── Phase 6: CORRECT ─────────────────────────────────────────
  console.log('');
  console.log('--- Phase 6: CORRECT ---');
  const correct = acts[4].content;
  assert(correct.questions.length === 3, '3 questions');
  assert(correct.questions[0].sentence.includes('………………'), 'Q1 has blanks');
  assert(correct.questions[0].sentence.includes('will go'), 'Q1 has bracket word');
  assert(correct.answers['1'] === 'would go', 'Q1 answer = would go');
  assert(correct.answers['2'] === 'had', 'Q2 answer = had');
  assert(correct.answers['3'] === 'went', 'Q3 answer = went');

  // ─── Phase 7: DIALOGUE ────────────────────────────────────────
  console.log('');
  console.log('--- Phase 7: DIALOGUE ---');
  const dialogue = acts[5].content;
  assert(dialogue.lines.length === 10, '10 dialogue lines');
  assert(dialogue.lines[0].speaker === 'Student A', 'Line 1 speaker = Student A');
  assert(dialogue.lines[0].text.includes('favorite desert animal'), 'Line 1 text about favorite');
  assert(dialogue.lines[1].speaker === 'Student B', 'Line 2 speaker = Student B');
  assert(dialogue.lines[1].text.includes('(1)'), 'Line 2 has blank (1)');
  assert(dialogue.answers['1'] === 'AI', 'Blank 1 = AI');
  assert(dialogue.answers['5'] === 'AI', 'Blank 5 = AI');

  // ─── Phase 8: TRUE_FALSE ──────────────────────────────────────
  console.log('');
  console.log('--- Phase 8: TRUE_FALSE ---');
  const tf = acts[6].content;
  assert(tf.questions.length === 4, '4 questions');
  assert(tf.answers['1'] === true, 'Q1 = true');
  assert(tf.answers['2'] === true, 'Q2 = true');
  assert(tf.answers['3'] === true, 'Q3 = true');
  assert(tf.answers['4'] === false, 'Q4 = false');

  // ─── Phase 9: WRITING ─────────────────────────────────────────
  console.log('');
  console.log('--- Phase 9: WRITING ---');
  const writing = acts[7].content;
  assert(writing.topic.includes('animals') || writing.topic.includes('Animals'), 'Topic about animals');
  assert(writing.wordCount === 110, 'Word count = 110');
  assert(writing.gradingType === 'AI', 'Grading = AI');

  // ─── Phase 10: Validation Rules ───────────────────────────────
  console.log('');
  console.log('--- Phase 10: Validation ---');

  // Missing answer key
  const noAk = parseQuestionText('@@MCQ@@\n\n(1) Test\n\na. o1\nb. o2\n');
  assert(noAk.errors.length === 1, 'No AK: 1 error');
  assert(noAk.errors[0].code === 'NO_ANSWER_KEY', 'No AK: correct code');
  assert(noAk.activities[0].errors.length === 1, 'No AK: activity has error');

  // Duplicate activity markers
  const dupMarkers = parseQuestionText('@@MCQ@@\n\n(1) Q\n\na. a\nb. b\n\n@@ANSWER_KEY@@\n1=a\n\n@@MCQ@@\n\n(2) Q2\n\na. a\nb. b\n\n@@ANSWER_KEY@@\n2=a\n');
  assert(dupMarkers.warnings.some(w => w.code === 'DUPLICATE_ACTIVITY_MARKER'), 'Duplicate marker warning');

  // Unknown markers ignored
  const unknown = parseQuestionText('@@MCQ@@\n\n(1) Q\n\na. a\nb. b\n\n@@ANSWER_KEY@@\n1=a\n\n@@UNKNOWN@@\n\nContent\n');
  assert(unknown.activities.length === 1, 'Unknown marker ignored');
  assert(unknown.activities[0].type === 'MCQ', 'Only MCQ parsed');

  // Empty document
  const empty = parseQuestionText('');
  assert(empty.activities.length === 0, 'Empty doc: no activities');
  assert(empty.documentTitle === 'Untitled Document', 'Empty doc: default title');

  // MCQ too few options
  const mcqFewOpts = parseQuestionText('@@MCQ@@\n\n(1) Test\n\na. only\n\n@@ANSWER_KEY@@\n1=a\n');
  assert(mcqFewOpts.warnings.some(w => w.code === 'MCQ_TOO_FEW_OPTIONS'), 'MCQ few options warning');

  // Missing word bank
  const ddNoWb = parseQuestionText('@@DRAG_DROP@@\n\n(1) Test\n\nBlank (1) here\n\n@@ANSWER_KEY@@\n1=test\n');
  assert(ddNoWb.warnings.some(w => w.code === 'DRAG_DROP_MISSING_WORD_BANK'), 'Missing WB warning');

  // Empty dialogue
  const emptyDlg = parseQuestionText('@@DIALOGUE@@\n\n(1) Empty\n\n@@ANSWER_KEY@@\n1=AI\n');
  assert(emptyDlg.warnings.some(w => w.code === 'DIALOGUE_EMPTY'), 'Empty dialogue warning');

  // Empty writing topic
  const emptyWr = parseQuestionText('@@WRITING@@\n\n(1) Write\n\n@@ANSWER_KEY@@\nCheck=AI\n');
  assert(emptyWr.warnings.some(w => w.code === 'WRITING_EMPTY_TOPIC'), 'Empty writing topic warning');

  // Duplicate question number (using CORRECT which uses explicit numbering)
  const dupQ = parseQuestionText('@@CORRECT@@\n\n(1) Fix:\n\n1. Word1\n\n1. Word2\n\n@@ANSWER_KEY@@\n1=correct\n');
  assert(dupQ.warnings.some(w => w.code === 'DUPLICATE_QUESTION_NUMBER'), 'Duplicate question number warning');

  // AbortSignal test
  const abortController = new AbortController();
  abortController.abort();
  try {
    await importQuestionsFromDocx({ filePath: 'docs/word files/questions.docx', signal: abortController.signal });
    assert(false, 'AbortSignal should throw');
  } catch (e) {
    assert(e.message.includes('cancelled'), 'AbortSignal: cancelled message');
  }

  // ─── Phase 11: File Validation ────────────────────────────────
  console.log('');
  console.log('--- Phase 11: File Validation ---');
  try {
    await importQuestionsFromDocx({ filePath: 'nonexistent.docx' });
    assert(false, 'Missing file should throw');
  } catch (e) {
    assert(e.message.includes('not found'), 'Missing file error');
  }
  try {
    await importQuestionsFromDocx({ filePath: 'test.txt' });
    assert(false, 'Wrong extension should throw');
  } catch (e) {
    assert(e.message.includes('extension'), 'Wrong extension error');
  }

  // ─── Result ───────────────────────────────────────────────────
  console.log('');
  console.log('========================================');
  console.log('Production Verification Complete');
  console.log('Passed: ' + passCount + ' / Failed: ' + failCount + ' / Total: ' + (passCount + failCount));
  console.log('========================================');

  if (failCount > 0) process.exit(1);
}

main().catch(e => { console.error(e); process.exit(1); });
