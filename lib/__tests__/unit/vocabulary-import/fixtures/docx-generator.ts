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

function xmlHeading(text: string, level: number): string {
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
  const ns = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const gridCols = headers.map(() => '<w:gridCol w:w="3000"/>').join('');
  return `<w:tbl xmlns:w="${ns}"><w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr><w:tblGrid>${gridCols}</w:tblGrid>${allRows.map(xmlRow).join('')}</w:tbl>`;
}

export interface DocxFixtureSection {
  readonly heading?: string;
  readonly headingLevel?: number;
  readonly paragraphs?: string[];
  readonly tableHeaders?: string[];
  readonly tableRows?: string[][];
}

export interface DocxFixtureOptions {
  readonly sections?: DocxFixtureSection[];
  readonly orphanTables?: { headers: string[]; rows: string[][] }[];
}

const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
const NS_R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const NS_REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
const NS_CT = 'http://schemas.openxmlformats.org/package/2006/content-types';

function buildDocumentXml(options: DocxFixtureOptions): string {
  const parts: string[] = [];
  parts.push(`<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="${NS_W}"><w:body>`);

  if (options.orphanTables) {
    for (const table of options.orphanTables) {
      parts.push(xmlTable(table.headers, table.rows));
    }
  }

  if (options.sections) {
    for (const section of options.sections) {
      if (section.heading) {
        parts.push(xmlHeading(section.heading, section.headingLevel ?? 1));
      }
      if (section.paragraphs) {
        for (const p of section.paragraphs) {
          parts.push(xmlParagraph(p));
        }
      }
      if (section.tableHeaders && section.tableRows) {
        parts.push(xmlTable(section.tableHeaders, section.tableRows));
      }
    }
  }

  parts.push('</w:body></w:document>');
  return parts.join('\n');
}

export function generateDocxFixture(
  name: string,
  options: DocxFixtureOptions,
): string {
  const zip = new JSZip();

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${NS_CT}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_REL}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_R}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${NS_W}">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
</w:styles>`);

  zip.file('word/document.xml', buildDocumentXml(options));

  const outputPath = path.resolve(FIXTURE_DIR, name + '.docx');
  return outputPath;
}

async function writeDocx(name: string, zip: JSZip): Promise<string> {
  const outputPath = path.resolve(FIXTURE_DIR, name + '.docx');
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  fs.writeFileSync(outputPath, buffer);
  return outputPath;
}

export const FIXTURES = {
  STANDARD_VOCABULARY: 'standard-vocabulary',
  EXTRA_VOCABULARY: 'extra-vocabulary',
  COLLOCATIONS: 'collocations',
  SYNONYM_ANTONYM: 'synonym-antonym',
  MIXED_CONTENT: 'mixed-content',
  EMPTY_SECTION: 'empty-section',
  DUPLICATE_WORDS: 'duplicate-words',
  INVALID_ROWS: 'invalid-rows',
  HEADING_NO_TABLE: 'heading-no-table',
  TABLE_NO_HEADING: 'table-no-heading',
  LARGE_FILE: 'large-file',
} as const;

export async function ensureAllFixtures(): Promise<void> {
  const existing = new Set(
    fs.readdirSync(FIXTURE_DIR)
      .filter((f) => f.endsWith('.docx'))
      .map((f) => path.basename(f, '.docx')),
  );

  const fixtureDefs: { name: string; options: DocxFixtureOptions }[] = [
    {
      name: FIXTURES.STANDARD_VOCABULARY,
      options: { sections: [{ heading: 'Key vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['communicate with', 'يتواصل مع'], ['sibling', 'اخ / اخت ( شقيق – شقيقه )'], ['communication', 'تواصل']] }] },
    },
    {
      name: FIXTURES.EXTRA_VOCABULARY,
      options: { sections: [{ heading: 'Extra vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['text message', 'رسالة نصية'], ['avoid', 'يتجنب'], ['care', 'يهتم / يعتني'], ['upset', 'منزعج / مستاء']] }] },
    },
    {
      name: FIXTURES.COLLOCATIONS,
      options: { sections: [{ heading: 'Collocations, Prepositions & Expressions', tableHeaders: ['Expression', 'Arabic'], tableRows: [['make time', 'يخصص وقت'], ['express regret', 'يعبر عن الندم']] }] },
    },
    {
      name: FIXTURES.SYNONYM_ANTONYM,
      options: { sections: [{ heading: 'Synonym & Antonym', tableHeaders: ['Word', 'Arabic', 'Synonym', '', 'Antonym', ''], tableRows: [['care', 'اهتمام', 'concern', '', 'ignore', ''], ['conflict', 'صراع', 'disagreement', 'argument', 'agreement', 'harmony']] }] },
    },
    {
      name: FIXTURES.MIXED_CONTENT,
      options: { sections: [{ heading: 'Key vocabularies', paragraphs: ['This section contains important vocabulary words.'], tableHeaders: ['English', 'Arabic'], tableRows: [['communicate with', 'يتواصل مع']] }, { heading: 'Extra vocabularies', paragraphs: ['Additional words.', 'Study carefully.'], tableHeaders: ['English', 'Arabic'], tableRows: [['avoid', 'يتجنب']] }] },
    },
    {
      name: FIXTURES.EMPTY_SECTION,
      options: { sections: [{ heading: 'Key vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['communicate with', 'يتواصل مع']] }, { heading: 'Empty Section (no data)' }, { heading: 'Extra vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['avoid', 'يتجنب']] }] },
    },
    {
      name: FIXTURES.DUPLICATE_WORDS,
      options: { sections: [{ heading: 'Key vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['communicate with', 'يتواصل مع'], ['communicate with', 'يتواصل مع'], ['care', 'يهتم']] }] },
    },
    {
      name: FIXTURES.INVALID_ROWS,
      options: { sections: [{ heading: 'Key vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['valid word', 'ترجمة صحيحة'], ['', 'missing english'], ['missing arabic', ''], ['', '']] }] },
    },
    {
      name: FIXTURES.HEADING_NO_TABLE,
      options: { sections: [{ heading: 'Introduction', paragraphs: ['This section has no table.'] }, { heading: 'Key vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['communicate with', 'يتواصل مع']] }] },
    },
    {
      name: FIXTURES.TABLE_NO_HEADING,
      options: { sections: [{ heading: 'Key vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: [['communicate with', 'يتواصل مع']] }], orphanTables: [{ headers: ['English', 'Arabic'], rows: [['orphan word', 'كلمة يتيمة']] }] },
    },
    {
      name: FIXTURES.LARGE_FILE,
      options: { sections: [{ heading: 'Key vocabularies', tableHeaders: ['English', 'Arabic'], tableRows: Array.from({ length: 100 }, (_, i) => [`word_${String(i + 1)}`, `ترجمة_${String(i + 1)}`]) }] },
    },
  ];

  const toGenerate = fixtureDefs.filter((f) => !existing.has(f.name));
  await Promise.all(toGenerate.map(async (fixture) => {
    console.log(`  Generating: ${fixture.name}.docx`);
    const zip = buildZip(fixture.name, fixture.options);
    await writeDocx(fixture.name, zip);
  }));
}

function buildZip(_name: string, options: DocxFixtureOptions): JSZip {
  const zip = new JSZip();

  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="${NS_CT}">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);

  zip.file('_rels/.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_REL}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);

  zip.file('word/_rels/document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="${NS_R}">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`);

  zip.file('word/styles.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="${NS_W}">
  <w:style w:type="paragraph" w:styleId="Normal"><w:name w:val="Normal"/></w:style>
  <w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/></w:style>
</w:styles>`);

  zip.file('word/document.xml', buildDocumentXml(options));
  return zip;
}

if (require.main === module) {
  ensureAllFixtures();
  console.log('All fixtures generated.');
}
