import * as fs from 'fs';
import * as path from 'path';
import JSZip from 'jszip';

const FIXTURE_DIR = path.resolve(__dirname);

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function xmlParagraph(text: string): string {
  return `<w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function xmlHeading(text: string, level = 1): string {
  return `<w:p><w:pPr><w:pStyle w:val="Heading${String(level)}"/></w:pPr><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p>`;
}

function xmlCell(text: string): string {
  return `<w:tc><w:p><w:r><w:t xml:space="preserve">${escapeXml(text)}</w:t></w:r></w:p></w:tc>`;
}

function xmlRow(cells: string[]): string {
  return `<w:tr>${cells.map(xmlCell).join('')}</w:tr>`;
}

function xmlTable(headers: string[], rows: string[][]): string {
  const allRows = [headers, ...rows];
  const gridCols = headers.map(() => '<w:gridCol w:w="3000"/>').join('');
  return `<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>${allRows.map(xmlRow).join('')}</w:tbl>`;
}

const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_CT = 'http://schemas.openxmlformats.org/package/2006/content-types';

export interface QuestionDocxSection {
  readonly lines: string[];
}

export interface QuestionDocxOptions {
  readonly title?: string;
  readonly sections: QuestionDocxSection[];
}

function buildZip(options: QuestionDocxOptions): JSZip {
  const zip = new JSZip();
  const body: string[] = [];

  if (options.title) body.push(xmlHeading(options.title));

  for (const section of options.sections) {
    for (const line of section.lines) {
      if (line.startsWith('<table>')) {
        body.push(line);
      } else if (line.startsWith('<h1>')) {
        const text = line.replace(/<\/?h1>/g, '');
        body.push(xmlHeading(text));
      } else if (line.startsWith('TABLE:')) {
        const parts = line.replace('TABLE:', '').split('|');
        if (parts.length >= 2) {
          const headers = parts[0]!.split(',').map((s) => s.trim());
          const rows = parts.slice(1).map((r) => r.split(',').map((s) => s.trim()));
          body.push(xmlTable(headers, rows));
        }
      } else {
        body.push(xmlParagraph(line));
      }
    }
  }

  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS_W}"><w:body>${body.join('\n')}</w:body></w:document>`;

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${NS_CT}"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_REL}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>`);
  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_R}"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`);
  zip.file('word/styles.xml', `<w:styles xmlns:w="${NS_W}"><w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style></w:styles>`);
  zip.file('word/document.xml', documentXml);
  return zip;
}

export async function generateDocxFixture(name: string, options: QuestionDocxOptions): Promise<string> {
  const outputPath = path.resolve(FIXTURE_DIR, name + '.docx');
  const zip = buildZip(options);
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

export function buildRawText(options: QuestionDocxOptions): string {
  const lines: string[] = [];
  if (options.title) lines.push(options.title);
  for (const section of options.sections) {
    for (const line of section.lines) {
      if (line.startsWith('<table>') || line.startsWith('TABLE:') || line.startsWith('<h1>')) continue;
      lines.push(line);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export const QFIXTURES = {
  PERFECT: 'q-perfect',
  LARGE: 'q-large',
  BROKEN_AK: 'q-broken-ak',
  UNKNOWN_MARKER: 'q-unknown-marker',
  DUPLICATE_MARKER: 'q-duplicate-marker',
  BROKEN_WORD_BANK: 'q-broken-wb',
  NESTED_MARKER: 'q-nested',
  EMPTY_SECTION: 'q-empty',
} as const;

export async function ensureAllFixtures(): Promise<Map<string, string>> {
  const fixturePaths = new Map<string, string>();
  const existing = new Set(fs.readdirSync(FIXTURE_DIR).filter((f) => f.endsWith('.docx')).map((f) => path.basename(f, '.docx')));

  const defs: { name: string; options: QuestionDocxOptions }[] = [
    {
      name: QFIXTURES.PERFECT,
      options: {
        title: 'General Exercises On Lesson 1 & 2',
        sections: [
          { lines: ['@@MCQ@@', '', '(1) Choose the correct answer from a, b, c, or d:', '', ' Key vocabulary', '', 'The .......... living conditions in the desert kill many animals.', '', 'a. soft', 'b. harsh', 'c. easy', 'd. nice', '', ' Definitions', '', 'SB ".........." means able to change easily.', '', 'a. Harsh', 'b. Hard', 'c. Steel', 'd. Flexible', '', '@@ANSWER_KEY@@', '', '1=b', '2=d'] },
          { lines: ['@@DRAG_DROP@@', '', '(2) Read and complete the text with the words in the box:', '', '@@WORD_BANK@@adaptations – plants – conservation – predators – migration@@END_WORD_BANK@@', '', 'Life in the desert is difficult because of the harsh conditions. Animals need special(1) ……… to survive.', '', '@@ANSWER_KEY@@', '', '1=adaptations', '2=predators'] },
          { lines: ['@@READING@@', '', '(3) Read the following text, then answer the questions:', '', 'Life in the desert is extremely challenging.', '', 'A. Choose the correct answer from a, b, c or d:', '', '1. The fennec fox uses its large ears to .......... .', '', 'a. store water', 'b. lose heat and hear prey', 'c. hide from predators', 'd. protect its feet', '', '@@ANSWER_KEY@@', '', '1=b', '', 'B. Answer the following questions:', '', '4. Give a suitable title for the passage.', '', '@@ANSWER_KEY@@', '', '4=AI'] },
          { lines: ['@@REWRITE@@', '', '(4) Rewrite the following sentences:', '', '1. "How do lizards survive in the desert?" (He asked)', '', '@@ANSWER_KEY@@', '1=He asked if lizards survive in the desert'] },
          { lines: ['@@CORRECT@@', '', '(5) Complete the sentences with the correct form of the word(s) in brackets:', '', '1. She asked me if I ……………… (will go) to the party that evening.', '', '@@ANSWER_KEY@@', '', '1=would go'] },
          { lines: ['@@DIALOGUE@@', '', '(6) Complete the following dialogue:', '', 'Student A', 'What\'s your favorite desert animal?', 'Student B', '(1) ........................................ . I think fennec foxes are amazing.', '', '@@ANSWER_KEY@@', '', '1=AI'] },
          { lines: ['@@TRUE_FALSE@@', '', '(7) Read and write (T) True or (F) False :', '', '1. The other children were always kind to Amal. ( )', '', '@@ANSWER_KEY@@', '', '1=t'] },
          { lines: ['@@WRITING@@', '', '(8) Write a paragraph of ONE HUNDRED and TEN (110) words on:', '', '"How animals adapt to survive in their environments"', '', '@@ANSWER_KEY@@', '', 'Check the paragraph=AI'] },
        ],
      },
    },
    {
      name: QFIXTURES.BROKEN_AK,
      options: {
        sections: [
          { lines: ['@@MCQ@@', '', '(1) Test question?', '', 'a. yes', 'b. no', '', '@@ANSWER_KEY@@', '', '1=', '2=x'] },
        ],
      },
    },
    {
      name: QFIXTURES.UNKNOWN_MARKER,
      options: {
        sections: [
          { lines: ['@@MCQ@@', '', '(1) Valid MCQ?', '', 'a. yes', 'b. no', '', '@@ANSWER_KEY@@', '1=a'] },
          { lines: ['@@UNKNOWN@@', '', 'This content uses an unknown marker'] },
        ],
      },
    },
    {
      name: QFIXTURES.DUPLICATE_MARKER,
      options: {
        sections: [
          { lines: ['@@MCQ@@', '', '(1) First MCQ?', '', 'a. one', 'b. two', '', '@@ANSWER_KEY@@', '1=a'] },
          { lines: ['@@MCQ@@', '', '(2) Duplicate MCQ?', '', 'a. three', 'b. four', '', '@@ANSWER_KEY@@', '2=b'] },
        ],
      },
    },
    {
      name: QFIXTURES.BROKEN_WORD_BANK,
      options: {
        sections: [
          { lines: ['@@DRAG_DROP@@', '', '@@WORD_BANK@@@@END_WORD_BANK@@', '', 'Test (1) ..... with no bank', '', '@@ANSWER_KEY@@', '1=missing'] },
        ],
      },
    },
    {
      name: QFIXTURES.NESTED_MARKER,
      options: {
        sections: [
          { lines: ['@@MCQ@@', '', '(1) Nested marker @@READING@@ inside?', '', 'a. bad', 'b. good', '', '@@ANSWER_KEY@@', '1=b'] },
        ],
      },
    },
    {
      name: QFIXTURES.EMPTY_SECTION,
      options: {
        sections: [
          { lines: ['@@MCQ@@', '', ''] },
        ],
      },
    },
  ];

  const promises = defs.map(async (def) => {
    if (!existing.has(def.name)) {
      const p = await generateDocxFixture(def.name, def.options);
      fixturePaths.set(def.name, p);
    } else {
      fixturePaths.set(def.name, path.resolve(FIXTURE_DIR, def.name + '.docx'));
    }
  });
  await Promise.all(promises);
  return fixturePaths;
}
