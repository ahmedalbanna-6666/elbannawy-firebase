import { execFile } from 'child_process';
import { promisify } from 'util';
import { resolve } from 'path';
import type { VocabularyDocument } from './types';

const execFileAsync = promisify(execFile);

function getScriptPath(): string {
  return resolve(__dirname, 'scripts', 'parse_docx.py');
}

export interface ParseOptions {
  filePath: string;
  pythonPath?: string;
}

export async function parseVocabularyDoc(options: ParseOptions): Promise<VocabularyDocument> {
  const { filePath, pythonPath = 'python' } = options;
  const scriptPath = getScriptPath();

  let stdout: string;
  try {
    const result = await execFileAsync(pythonPath, [scriptPath, filePath], {
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
    });
    stdout = result.stdout;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    throw new Error(`Vocabulary parser failed: ${msg}`);
  }

  return JSON.parse(stdout) as VocabularyDocument;
}
