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
