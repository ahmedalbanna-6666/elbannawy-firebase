export interface VocabularyEntry {
  english: string;
  arabic: string | string[];
}

export interface SynonymEntry {
  word: string;
  arabic: string | string[];
  synonyms: string[];
  antonyms: string[];
}

export interface VocabularySection {
  heading: string;
  type: 'vocabulary';
  items: VocabularyEntry[];
}

export interface SynonymSection {
  heading: string;
  type: 'synonym-antonym';
  items: SynonymEntry[];
}

export type ParsedSection = VocabularySection | SynonymSection;

export interface VocabularyDocument {
  sections: ParsedSection[];
}

export type DocumentBlockType = 'heading' | 'paragraph' | 'table';

export interface DocumentBlock {
  readonly type: DocumentBlockType;
  readonly level: number;
  readonly text: string;
  readonly html: string;
  readonly index: number;
  readonly rows?: readonly (readonly string[])[];
}

export interface DuplicateInfo {
  readonly word: string;
  readonly existingSection: string;
  readonly existingTranslation: string;
}

export interface ParsedDocument {
  readonly blocks: readonly DocumentBlock[];
  readonly orphanTables: readonly DocumentBlock[];
  readonly warnings: readonly string[];
}
