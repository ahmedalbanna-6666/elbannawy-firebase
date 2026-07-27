import * as fs from 'fs';
import * as path from 'path';
import { parseVocabularyDocBuffer } from '../../../vocabulary-import/node-parser';
import { ensureAllFixtures, FIXTURES } from './fixtures/docx-generator';
import type { VocabularyDocument, VocabularySection, SynonymSection } from '../../../vocabulary-import/types';

const FIXTURE_DIR = path.resolve(__dirname, 'fixtures');

function loadDocx(fixtureName: string): Buffer {
  const p = path.resolve(FIXTURE_DIR, fixtureName + '.docx');
  return fs.readFileSync(p);
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

beforeAll(async () => {
  await ensureAllFixtures();
}, 30000);

describe('Real DOCX Parser — Standard Vocabulary', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.STANDARD_VOCABULARY));
  });

  it('parses exactly 1 section', () => {
    expect(doc.sections).toHaveLength(1);
  });

  it('heading is "Key vocabularies"', () => {
    expect(doc.sections[0]?.heading).toBe('Key vocabularies');
  });

  it('section type is vocabulary', () => {
    expect(doc.sections[0]?.type).toBe('vocabulary');
  });

  it('parses all 3 words', () => {
    const section = doc.sections[0] as VocabularySection;
    expect(section.items).toHaveLength(3);
  });

  it('first word is communicate with', () => {
    const section = doc.sections[0] as VocabularySection;
    expect(section.items[0]?.english).toBe('communicate with');
  });

  it('sibling has split arabic (2 meanings)', () => {
    const section = doc.sections[0] as VocabularySection;
    const sibling = section.items[1];
    expect(sibling?.english).toBe('sibling');
    expect(Array.isArray(sibling?.arabic)).toBe(true);
    expect((sibling?.arabic as string[]).length).toBeGreaterThanOrEqual(2);
  });
});

describe('Real DOCX Parser — Synonym & Antonym', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.SYNONYM_ANTONYM));
  });

  it('section type is synonym-antonym', () => {
    const section = doc.sections[0];
    expect(section?.type).toBe('synonym-antonym');
  });

  it('parses 2 items', () => {
    const section = doc.sections[0] as SynonymSection;
    expect(section.items).toHaveLength(2);
  });

  it('parses "care" with synonym [concern] and antonym [ignore]', () => {
    const section = doc.sections[0] as SynonymSection;
    const care = section.items.find((i) => i.word === 'care');
    expect(care?.synonyms).toContain('concern');
    expect(care?.antonyms).toContain('ignore');
  });
});

describe('Real DOCX Parser — Mixed Content', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.MIXED_CONTENT));
  });

  it('parses 2 sections', () => {
    expect(doc.sections).toHaveLength(2);
  });

  it('preserves section order', () => {
    expect(doc.sections[0]?.heading).toBe('Key vocabularies');
    expect(doc.sections[1]?.heading).toBe('Extra vocabularies');
  });

  it('extracts vocabulary from both sections', () => {
    const s1 = doc.sections[0] as VocabularySection;
    const s2 = doc.sections[1] as VocabularySection;
    expect(s1.items.length).toBeGreaterThan(0);
    expect(s2.items.length).toBeGreaterThan(0);
  });
});

describe('Real DOCX Parser — Empty Section', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.EMPTY_SECTION));
  });

  it('parses 2 sections (skips empty one)', () => {
    expect(doc.sections).toHaveLength(2);
  });

  it('first section is Key vocabularies', () => {
    expect(doc.sections[0]?.heading).toBe('Key vocabularies');
  });

  it('second section is Extra vocabularies', () => {
    expect(doc.sections[1]?.heading).toBe('Extra vocabularies');
  });
});

describe('Real DOCX Parser — Duplicate Words', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.DUPLICATE_WORDS));
  });

  it('deduplicates same word in same section', () => {
    const section = doc.sections[0] as VocabularySection;
    const comms = section.items.filter((i) => i.english === 'communicate with');
    expect(comms).toHaveLength(1);
  });

  it('still has unique words', () => {
    const section = doc.sections[0] as VocabularySection;
    const cares = section.items.filter((i) => i.english === 'care');
    expect(cares).toHaveLength(1);
  });
});

describe('Real DOCX Parser — Invalid Rows', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.INVALID_ROWS));
  });

  it('parses only rows with valid pairs', () => {
    const section = doc.sections[0] as VocabularySection;
    const words = section.items.map((i) => i.english);
    expect(words).toContain('valid word');
    expect(words).not.toContain('');
  });
});

describe('Real DOCX Parser — Heading Without Table', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.HEADING_NO_TABLE));
  });

  it('skips heading with no table, only includes heading with data', () => {
    expect(doc.sections).toHaveLength(1);
    expect(doc.sections[0]?.heading).toBe('Key vocabularies');
  });
});

describe('Real DOCX Parser — Orphan Table', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.TABLE_NO_HEADING));
  });

  it('places orphan table in "Recovered Section"', () => {
    const recovered = doc.sections.find((s) => s.heading === 'Recovered Section');
    expect(recovered).toBeDefined();
    if (recovered) {
      const section = recovered as VocabularySection;
      expect(section.items.length).toBeGreaterThan(0);
      expect(section.items[0]?.english).toBe('orphan word');
    }
  });

  it('still includes normal sections', () => {
    const key = doc.sections.find((s) => s.heading === 'Key vocabularies');
    expect(key).toBeDefined();
  });
});

describe('Real DOCX Parser — Large File (100 words)', () => {
  let doc: VocabularyDocument;
  let parseTime: number;

  beforeAll(async () => {
    const buf = loadDocx(FIXTURES.LARGE_FILE);
    const start = performance.now();
    doc = await parseVocabularyDocBuffer(buf);
    parseTime = performance.now() - start;
  });

  it('parses all 100 words', () => {
    const section = doc.sections[0] as VocabularySection;
    expect(section.items).toHaveLength(100);
  });

  it('completes in under 2 seconds', () => {
    expect(parseTime).toBeLessThan(2000);
  });

  it('preserves word order', () => {
    const section = doc.sections[0] as VocabularySection;
    expect(section.items[0]?.english).toBe('word_1');
    expect(section.items[99]?.english).toBe('word_100');
  });
});

describe('Real DOCX Parser — Collocations', () => {
  let doc: VocabularyDocument;

  beforeAll(async () => {
    doc = await parseVocabularyDocBuffer(loadDocx(FIXTURES.COLLOCATIONS));
  });

  it('parses collocations section as vocabulary type', () => {
    const section = doc.sections[0];
    expect(section?.type).toBe('vocabulary');
  });

  it('includes expression translations', () => {
    const section = doc.sections[0] as VocabularySection;
    expect(section.items.length).toBeGreaterThan(0);
    expect(hasArabic(String(section.items[0]?.arabic))).toBe(true);
  });
});
