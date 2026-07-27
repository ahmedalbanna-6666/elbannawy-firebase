import mammoth from 'mammoth';
import type { VocabularyDocument } from './types';
import { DuplicateDetector } from './duplicate-detector';
import { parseDocumentBlocks, buildSectionsFromBlocks } from './document-parser';

export async function parseVocabularyDocBuffer(
  buffer: Buffer,
  existingItems?: readonly { word: string; section: string; translation: string }[],
): Promise<VocabularyDocument> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value ?? '';

  const { blocks, orphanTables } = parseDocumentBlocks(html);

  const detector = existingItems && existingItems.length > 0
    ? new DuplicateDetector({ existingItems })
    : undefined;

  const doc = buildSectionsFromBlocks(blocks, orphanTables, detector
    ? (word: string, section: string) => detector.find(word, section)
    : undefined);

  return doc;
}
