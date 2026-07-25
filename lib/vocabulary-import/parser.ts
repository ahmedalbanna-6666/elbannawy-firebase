import { readFile } from 'fs/promises';
import type { VocabularyDocument } from './types';
import { parseVocabularyDocBuffer } from './node-parser';
import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';

const execFileAsync = promisify(execFile);

export interface ParseOptions {
  filePath: string;
  pythonPath?: string;
}

export async function parseVocabularyDoc(options: ParseOptions): Promise<VocabularyDocument> {
  const buffer = await readFile(options.filePath);
  try {
    return await parseVocabularyDocBuffer(buffer);
  } catch {
    // Fallback to Python parser if Node parser fails
  }

  const pythonPath = options.pythonPath ?? 'python';
  const scriptPath = resolve(__dirname, 'scripts', 'parse_docx.py');
  try {
    const result = await execFileAsync(pythonPath, [scriptPath, options.filePath], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    return JSON.parse(result.stdout) as VocabularyDocument;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Vocabulary parser failed: ${msg}`);
  }
}
