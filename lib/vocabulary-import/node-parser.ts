import mammoth from 'mammoth';
import type { VocabularyDocument, ParsedSection, VocabularyEntry, SynonymEntry } from './types';

function dedupeCells(cells: string[]): string[] {
  const result: string[] = [];
  for (const cell of cells) {
    const text = cell.trim();
    if (result.length > 0 && text === result[result.length - 1]) continue;
    if (text) result.push(text);
  }
  return result;
}

function splitArabic(text: string): string | string[] {
  const trimmed = text.trim();
  if (!trimmed) return '';
  const normalized = trimmed.replace(/\n/g, '/');
  const parts: string[] = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < normalized.length; i++) {
    const ch: string = normalized[i] ?? '';
    if ('({['.includes(ch)) { depth++; current += ch; }
    else if (')}]'.includes(ch)) { depth = Math.max(0, depth - 1); current += ch; }
    else if ('/|'.includes(ch) || (depth === 0 && '–—ـ'.includes(ch))) {
      if (current) { parts.push(current.trim()); current = ''; }
    } else { current += ch; }
  }
  if (current) parts.push(current.trim());
  const filtered = parts.filter(p => p);
  if (filtered.length <= 1) return trimmed;
  return filtered;
}

function splitLines(text: string): string[] {
  return text.split('\n').map(s => s.trim()).filter(s => s);
}

function parseVocabularyRow(cells: string[]): VocabularyEntry[] {
  const deduped = dedupeCells(cells);
  const pairs: VocabularyEntry[] = [];
  for (let i = 0; i + 1 < deduped.length; i += 2) {
    const a = deduped[i] ?? '';
    const b = deduped[i + 1] ?? '';
    pairs.push({ english: a, arabic: splitArabic(b) });
  }
  return pairs;
}

function parseSynonymRow(cells: string[]): SynonymEntry | null {
  const deduped = dedupeCells(cells);
  if (deduped.length < 6) return null;
  const word = deduped[0] ?? '';
  const arabic = deduped[1] ?? '';
  const synonyms = deduped[2] ?? '';
  const antonyms = deduped[4] ?? '';
  if (!word || !arabic) return null;
  return {
    word,
    arabic: splitArabic(arabic),
    synonyms: splitLines(synonyms),
    antonyms: splitLines(antonyms),
  };
}

function classifySection(heading: string): 'vocabulary' | 'synonym-antonym' {
  const lower = heading.toLowerCase();
  if (lower.includes('synonym') || lower.includes('antonym')) return 'synonym-antonym';
  return 'vocabulary';
}

function extractHtmlTables(html: string): string[][][] {
  const tables: string[][][] = [];
  const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;

  let tableMatch: RegExpExecArray | null;
  while ((tableMatch = tableRegex.exec(html)) !== null) {
    const rows: string[][] = [];
    let rowMatch: RegExpExecArray | null;
    const rowHtml: string = tableMatch[1] ?? '';
    while ((rowMatch = rowRegex.exec(rowHtml)) !== null) {
      const cells: string[] = [];
      let cellMatch: RegExpExecArray | null;
      const cellHtml: string = rowMatch[1] ?? '';
      while ((cellMatch = cellRegex.exec(cellHtml)) !== null) {
        const raw: string = cellMatch[1] ?? '';
        const content = raw
          .replace(/<[^>]+>/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, ' ')
          .trim();
        cells.push(content);
      }
      if (cells.length > 0) rows.push(cells);
    }
    if (rows.length > 0) tables.push(rows);
  }
  return tables;
}

function extractHeadings(html: string): string[] {
  const headings: string[] = [];
  const headingRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  let match: RegExpExecArray | null;
  while ((match = headingRegex.exec(html)) !== null) {
    const raw = match[1] ?? '';
    const text = raw.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    if (text) headings.push(text);
  }
  return headings;
}

export async function parseVocabularyDocBuffer(buffer: Buffer): Promise<VocabularyDocument> {
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value ?? '';

  const headingTexts = extractHeadings(html);
  const allTables = extractHtmlTables(html);

  const sections: ParsedSection[] = [];
  let tableIndex = 0;

  for (const heading of headingTexts) {
    const sectionType = classifySection(heading);
    const section: ParsedSection = {
      heading,
      type: sectionType,
      items: [],
    };

    const rows: string[][] | undefined = allTables[tableIndex];
    if (rows) {
      tableIndex++;
      if (sectionType === 'synonym-antonym') {
        for (let r = 0; r < rows.length; r++) {
          const cells = rows[r];
          if (!cells) continue;
          if (r === 0) {
            const c0 = cells[0] ?? '';
            const c1 = cells[1] ?? '';
            const headerText = c0.toLowerCase() + ' ' + c1.toLowerCase();
            if (headerText.includes('word') || headerText.includes('synonym')) continue;
          }
          const item = parseSynonymRow(cells);
          if (item) (section as any).items.push(item);
        }
      } else {
        let isFirst = true;
        for (const cells of rows) {
          if (!cells) continue;
          if (isFirst) {
            const c0 = cells[0] ?? '';
            const c1 = cells[1] ?? '';
            const combined = c0.toLowerCase() + ' ' + c1.toLowerCase();
            if (combined.includes('word') || combined.includes('english') || combined.includes('synonym')) {
              isFirst = false;
              continue;
            }
          }
          isFirst = false;
          const pairs = parseVocabularyRow(cells);
          (section as any).items.push(...pairs);
        }
      }
    }
    sections.push(section);
  }

  return { sections };
}
