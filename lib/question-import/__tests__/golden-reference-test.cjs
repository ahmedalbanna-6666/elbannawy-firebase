const path = require('path');
const fs = require('fs');
const BASE = path.resolve(__dirname, '../..');
const mammoth = require(path.join(BASE, 'node_modules/mammoth'));
const { parseQuestionText } = require(path.join(BASE, 'dist/question-import/docx-importer.js'));

const DOCX_PATH = path.resolve(BASE, '../docs/word files/questions.docx');
const EXPECTED_PATH = path.resolve(BASE, '../docs/word files/questions.expected.json');

let passCount = 0;
let failCount = 0;

function assert(condition, label) {
  if (condition) { passCount++; }
  else { failCount++; console.log('FAIL: ' + label); }
}

function deepEqual(a, b, path = '') {
  if (a === b) return true;
  if (a === null || b === null || a === undefined || b === undefined) return a === b;
  if (typeof a !== typeof b) { console.log(`Type mismatch at ${path}: ${typeof a} vs ${typeof b}`); return false; }
  if (Array.isArray(a)) {
    if (!Array.isArray(b) || a.length !== b.length) {
      console.log(`Array length mismatch at ${path}: ${a.length} vs ${b.length}`);
      return false;
    }
    for (let i = 0; i < a.length; i++) {
      if (!deepEqual(a[i], b[i], `${path}[${i}]`)) return false;
    }
    return true;
  }
  if (typeof a === 'object') {
    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) {
      console.log(`Object key count mismatch at ${path}: ${JSON.stringify(keysA)} vs ${JSON.stringify(keysB)}`);
      return false;
    }
    for (const key of keysA) {
      if (!(key in b)) {
        console.log(`Missing key at ${path}.${key}`);
        return false;
      }
      if (!deepEqual(a[key], b[key], `${path}.${key}`)) return false;
    }
    return true;
  }
  return a === b;
}

async function main() {
  console.log('=== Golden Reference Test ===');
  console.log('');

  if (!fs.existsSync(EXPECTED_PATH)) {
    console.log('FAIL: Expected file not found at ' + EXPECTED_PATH);
    console.log('Run the parser first to generate questions.expected.json');
    process.exit(1);
  }

  const expectedJson = JSON.parse(fs.readFileSync(EXPECTED_PATH, 'utf-8'));

  const docxResult = await mammoth.extractRawText({ path: DOCX_PATH });
  const actual = parseQuestionText(docxResult.value);

  assert(deepEqual(actual, expectedJson), 'Parser output matches questions.expected.json');

  console.log('');
  console.log('=== Detailed Structural Checks ===');
  assert(actual.activities.length === expectedJson.activities.length, 'Activity count matches');
  for (let i = 0; i < actual.activities.length; i++) {
    const a = actual.activities[i];
    const e = expectedJson.activities[i];
    assert(a.type === e.type, `Activity ${i + 1} type: ${a.type}`);
    assert(a.order === e.order, `Activity ${i + 1} order: ${a.order}`);
    assert(deepEqual(a.content, e.content), `Activity ${i + 1} (${a.type}) content matches`);
  }
  assert(actual.documentTitle === expectedJson.documentTitle, 'Document title matches');

  console.log('');
  console.log('=== Schema Shape Checks ===');
  assert(typeof actual.documentTitle === 'string', 'documentTitle is string');
  assert(Array.isArray(actual.activities), 'activities is array');
  assert(Array.isArray(actual.errors), 'errors is array');
  assert(Array.isArray(actual.warnings), 'warnings is array');

  for (const act of actual.activities) {
    assert(typeof act.type === 'string', `Activity ${act.order} has type string`);
    assert(typeof act.order === 'number', `Activity ${act.order} has number order`);
    assert(typeof act.content === 'object' && act.content !== null, `Activity ${act.order} has content object`);
    assert(Array.isArray(act.errors), `Activity ${act.order} has errors array`);
    assert(Array.isArray(act.warnings), `Activity ${act.order} has warnings array`);
    for (const err of act.errors) {
      assert(typeof err.code === 'string', `Activity ${act.order} error has code string`);
      assert(typeof err.message === 'string', `Activity ${act.order} error has message string`);
    }
    for (const warn of act.warnings) {
      assert(typeof warn.code === 'string', `Activity ${act.order} warning has code string`);
      assert(typeof warn.message === 'string', `Activity ${act.order} warning has message string`);
    }
  }

  console.log('');
  console.log('=== Result ===');
  console.log('Passed: ' + passCount + ' / Failed: ' + failCount + ' / Total: ' + (passCount + failCount));

  if (failCount > 0) process.exit(1);
  else console.log('All golden reference checks passed.');
}

main().catch(e => { console.error(e); process.exit(1); });
