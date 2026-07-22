import * as fs from 'fs';
import * as path from 'path';
import type { VocabularyDocument, VocabularySection, SynonymSection } from '../../../vocabulary-import/types';

function loadFixture(): VocabularyDocument {
  const fixturePath = path.resolve(__dirname, 'parsed_fixture.json');
  const raw = fs.readFileSync(fixturePath, 'utf-8');
  return JSON.parse(raw) as VocabularyDocument;
}

function hasArabic(text: string): boolean {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(text);
}

function hasArabicIn(value: string | string[]): boolean {
  if (Array.isArray(value)) {
    return value.some(hasArabic);
  }
  return hasArabic(value);
}

describe('VocabularyParser', () => {
  let doc: VocabularyDocument;

  beforeAll(() => {
    doc = loadFixture();
  });

  it('parses all 4 sections', () => {
    expect(doc.sections).toHaveLength(4);
  });

  describe('section headings', () => {
    it('has correct headings in order', () => {
      const headings = doc.sections.map(s => s.heading);
      expect(headings).toEqual([
        'Key vocabularies',
        'Extra vocabularies',
        'Collocations, Prepositions & Expressions',
        'Synonym & Antonym',
      ]);
    });

    it('classifies section types correctly', () => {
      expect(doc.sections[0].type).toBe('vocabulary');
      expect(doc.sections[1].type).toBe('vocabulary');
      expect(doc.sections[2].type).toBe('vocabulary');
      expect(doc.sections[3].type).toBe('synonym-antonym');
    });

    it('detects synonym-antonym from heading text', () => {
      const section = doc.sections[3];
      expect(section.heading).toContain('Synonym');
      expect(section.type).toBe('synonym-antonym');
    });
  });

  describe('Key vocabularies', () => {
    let section: VocabularySection;

    beforeAll(() => {
      section = doc.sections[0] as VocabularySection;
    });

    it('has 14 items', () => {
      expect(section.items).toHaveLength(14);
    });

    it('parses first entry english correctly', () => {
      expect(section.items[0].english).toBe('communicate with');
    });

    it('first entry has arabic string', () => {
      expect(typeof section.items[0].arabic).toBe('string');
      expect(hasArabicIn(section.items[0].arabic)).toBe(true);
    });

    it('sibling entry splits into 2 forms', () => {
      const item = section.items[1];
      expect(item.english).toBe('sibling');
      expect(Array.isArray(item.arabic)).toBe(true);
      expect(item.arabic).toHaveLength(2);
      expect(hasArabicIn(item.arabic[0])).toBe(true);
      expect(hasArabicIn(item.arabic[1])).toBe(true);
    });

    it('relationship has 3 split meanings', () => {
      const item = section.items[8];
      expect(item.english).toBe('relationship');
      expect(Array.isArray(item.arabic)).toBe(true);
      expect(item.arabic).toHaveLength(3);
    });

    it('connection has 2 split meanings', () => {
      const item = section.items[6];
      expect(item.english).toBe('connection');
      expect(Array.isArray(item.arabic)).toBe(true);
      expect(item.arabic).toHaveLength(2);
    });

    it('misunderstanding has 2 split meanings', () => {
      const item = section.items[12];
      expect(item.english).toBe('misunderstanding');
      expect(Array.isArray(item.arabic)).toBe(true);
      expect(item.arabic).toHaveLength(2);
    });

    it('texting has 2 split meanings', () => {
      const item = section.items[13];
      expect(item.english).toBe('texting');
      expect(Array.isArray(item.arabic)).toBe(true);
      expect(item.arabic).toHaveLength(2);
    });

    it('all items have non-empty arabic', () => {
      for (const item of section.items) {
        expect(item.english).toBeTruthy();
        if (Array.isArray(item.arabic)) {
          expect(item.arabic.length).toBeGreaterThan(0);
          for (const a of item.arabic) {
            expect(a).toBeTruthy();
          }
        } else {
          expect(item.arabic).toBeTruthy();
        }
      }
    });

    it('preserves original order', () => {
      const english = section.items.map(i => i.english);
      expect(english[0]).toBe('communicate with');
      expect(english[english.length - 1]).toBe('texting');
    });
  });

  describe('Extra vocabularies', () => {
    let section: VocabularySection;

    beforeAll(() => {
      section = doc.sections[1] as VocabularySection;
    });

    it('has 16 items', () => {
      expect(section.items).toHaveLength(16);
    });

    it('starts with text message', () => {
      expect(section.items[0].english).toBe('text message');
    });

    it('has correct last entry', () => {
      expect(section.items[15].english).toBe('stand out');
      expect(Array.isArray(section.items[15].arabic)).toBe(true);
      expect(section.items[15].arabic).toHaveLength(2);
    });

    it('preserves order of all items', () => {
      const englishOrder = section.items.map(i => i.english);
      expect(englishOrder.slice(0, 4)).toEqual([
        'text message', 'avoid', 'care', 'upset',
      ]);
      expect(englishOrder.slice(12)).toEqual([
        'blend into', 'solution', 'stay in mind', 'stand out',
      ]);
    });
  });

  describe('Collocations, Prepositions & Expressions', () => {
    let section: VocabularySection;

    beforeAll(() => {
      section = doc.sections[2] as VocabularySection;
    });

    it('has 8 items', () => {
      expect(section.items).toHaveLength(8);
    });

    it('parses collocations as vocabulary pairs', () => {
      expect(section.items[0].english).toBe('make time');
      expect(typeof section.items[0].arabic).toBe('string');
      expect(section.items[7].english).toBe('express regret');
    });

    it('all arabic fields are non-empty strings', () => {
      for (const item of section.items) {
        expect(typeof item.arabic).toBe('string');
        expect(item.arabic).toBeTruthy();
      }
    });
  });

  describe('Synonym & Antonym', () => {
    let section: SynonymSection;

    beforeAll(() => {
      section = doc.sections[3] as SynonymSection;
    });

    it('has 5 items', () => {
      expect(section.items).toHaveLength(5);
    });

    it('parses "care" correctly', () => {
      const item = section.items[0];
      expect(item.word).toBe('care');
      expect(item.synonyms).toEqual(['concern', 'regard']);
      expect(item.antonyms).toEqual(['ignore']);
    });

    it('parses "stay in touch" correctly', () => {
      const item = section.items[1];
      expect(item.word).toBe('stay in touch');
      expect(item.synonyms).toEqual(['keep in touch']);
      expect(item.antonyms).toEqual(['lose touch with']);
    });

    it('parses "conflict" with multiple synonyms and antonyms', () => {
      const item = section.items[2];
      expect(item.word).toBe('conflict');
      expect(item.synonyms).toEqual(['disagreement', 'argument']);
      expect(item.antonyms).toEqual(['agreement', 'harmony']);
    });

    it('parses "respectful" correctly', () => {
      const item = section.items[3];
      expect(item.word).toBe('respectful');
      expect(item.synonyms).toEqual(['polite']);
      expect(item.antonyms).toEqual(['disrespectful']);
    });

    it('parses "upset" with split arabic', () => {
      const item = section.items[4];
      expect(item.word).toBe('upset');
      expect(Array.isArray(item.arabic)).toBe(true);
      expect(item.arabic).toHaveLength(2);
      expect(item.synonyms).toEqual(['worried', 'disturbed']);
      expect(item.antonyms).toEqual(['relaxed', 'happy']);
    });

    it('all items have correctly typed fields', () => {
      for (const item of section.items) {
        expect(typeof item.word).toBe('string');
        expect(item.word).toBeTruthy();
        expect(hasArabicIn(item.arabic)).toBe(true);
        expect(Array.isArray(item.synonyms)).toBe(true);
        expect(item.synonyms.length).toBeGreaterThan(0);
        expect(Array.isArray(item.antonyms)).toBe(true);
        expect(item.antonyms.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('VocabularyParser fixture types', () => {
  it('VocabularySection has correct shape', () => {
    const section = loadFixture().sections[0] as VocabularySection;
    expect(section.type).toBe('vocabulary');
    expect(section.items[0]).toHaveProperty('english');
    expect(section.items[0]).toHaveProperty('arabic');
    expect(section.items[0]).not.toHaveProperty('synonyms');
  });

  it('SynonymSection has correct shape', () => {
    const section = loadFixture().sections[3] as SynonymSection;
    expect(section.type).toBe('synonym-antonym');
    expect(section.items[0]).toHaveProperty('word');
    expect(section.items[0]).toHaveProperty('arabic');
    expect(section.items[0]).toHaveProperty('synonyms');
    expect(section.items[0]).toHaveProperty('antonyms');
  });
});
