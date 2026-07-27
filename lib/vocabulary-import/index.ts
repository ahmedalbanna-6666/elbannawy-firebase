export { parseVocabularyDoc } from './parser';
export { parseVocabularyDocBuffer } from './node-parser';
export { DuplicateDetector } from './duplicate-detector';
export { parseDocumentBlocks, buildSectionsFromBlocks } from './document-parser';
export type { ParseOptions } from './parser';
export type {
  VocabularyDocument,
  ParsedSection,
  VocabularySection,
  SynonymSection,
  VocabularyEntry,
  SynonymEntry,
  DocumentBlock,
  ParsedDocument,
  DuplicateInfo,
} from './types';
