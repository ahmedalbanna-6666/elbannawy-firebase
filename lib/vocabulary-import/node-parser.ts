import JSZip from 'jszip';
import type { VocabularyDocument, ParsedSection, VocabularyEntry, SynonymEntry } from './types';

const NS_W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';

function stripNs(tag: string): string {
  const idx = tag.indexOf('}');
  return idx >= 0 ? tag.slice(idx + 1) : tag;
}

function extractTextFromElement(el: Element): string {
  const parts: string[] = [];
  const tElements = el.getElementsByTagNameNS(NS_W, 't');
  for (let i = 0; i < tElements.length; i++) {
    const text = tElements[i].textContent;
    if (text) parts.push(text);
  }
  return parts.join('').trim();
}

function getParagraphStyle(el: Element): string {
  const ppr = el.getElementsByTagNameNS(NS_W, 'pPr')[0];
  if (!ppr) return '';
  const pStyle = ppr.getElementsByTagNameNS(NS_W, 'pStyle')[0];
  if (!pStyle) return '';
  return pStyle.getAttributeNS(null, 'w:val') ?? '';
}

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
    const ch = normalized[i];
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
    pairs.push({ english: deduped[i], arabic: splitArabic(deduped[i + 1]) });
  }
  return pairs;
}

function parseSynonymRow(cells: string[]): SynonymEntry | null {
  const deduped = dedupeCells(cells);
  if (deduped.length < 6) return null;
  return {
    word: deduped[0],
    arabic: splitArabic(deduped[1]),
    synonyms: splitLines(deduped[2]),
    antonyms: splitLines(deduped[4]),
  };
}

function classifySection(heading: string): 'vocabulary' | 'synonym-antonym' {
  const lower = heading.toLowerCase();
  if (lower.includes('synonym') || lower.includes('antonym')) return 'synonym-antonym';
  return 'vocabulary';
}

function getCellText(table: Element, rowIdx: number, colIdx: number, nsResolver: (tag: string) => string): string {
  const rows = table.getElementsByTagNameNS(NS_W, 'tr');
  if (rowIdx >= rows.length) return '';
  const cells = rows[rowIdx].getElementsByTagNameNS(NS_W, 'tc');
  if (colIdx >= cells.length) return '';
  return extractTextFromElement(cells[colIdx]);
}

function getRowCells(table: Element, rowIdx: number): string[] {
  const rows = table.getElementsByTagNameNS(NS_W, 'tr');
  if (rowIdx >= rows.length) return [];
  const cells = rows[rowIdx].getElementsByTagNameNS(NS_W, 'tc');
  const result: string[] = [];
  for (let i = 0; i < cells.length; i++) {
    result.push(extractTextFromElement(cells[i]));
  }
  return result;
}

export async function parseVocabularyDocBuffer(buffer: Buffer): Promise<VocabularyDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('DOCX file does not contain word/document.xml');
  }
  const xmlStr = await docFile.async('string');

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlStr, 'text/xml');
  const body = xmlDoc.getElementsByTagNameNS(NS_W, 'body')[0];
  if (!body) throw new Error('Cannot find document body');

  const children = Array.from(body.childNodes).filter(n => n.nodeType === 1) as Element[];

  const headings: { index: number; text: string }[] = [];
  const tableElements: Element[] = [];

  for (const child of children) {
    const tag = stripNs(child.tagName);
    if (tag === 'p') {
      const style = getParagraphStyle(child);
      if (style.startsWith('Heading')) {
        const text = extractTextFromElement(child);
        if (text) headings.push({ index: headings.length + tableElements.length, text });
      }
    } else if (tag === 'tbl') {
      tableElements.push(child);
    }
  }

  const sections: ParsedSection[] = [];
  let tableIndex = 0;
  let headingIndex = 0;

  const sortedHeadings = [...headings].sort((a, b) => a.index - b.index);

  for (const h of sortedHeadings) {
    const sectionType = classifySection(h.text);
    const section: ParsedSection = {
      heading: h.text,
      type: sectionType,
      items: [],
    };

    if (tableIndex < tableElements.length) {
      const table = tableElements[tableIndex];
      tableIndex++;
      const rows = table.getElementsByTagNameNS(NS_W, 'tr');

      if (sectionType === 'synonym-antonym') {
        for (let r = 0; r < rows.length; r++) {
          const cells = getRowCells(table, r);
          if (r === 0) {
            const headerText = (cells[0] ?? '').toLowerCase() + ' ' + (cells[1] ?? '').toLowerCase();
            if (headerText.includes('word') || headerText.includes('synonym')) continue;
          }
          const item = parseSynonymRow(cells);
          if (item) (section as any).items.push(item);
        }
      } else {
        let isFirst = true;
        for (let r = 0; r < rows.length; r++) {
          const cells = getRowCells(table, r);
          if (isFirst) {
            const combined = (cells[0] ?? '').toLowerCase() + ' ' + (cells[1] ?? '').toLowerCase();
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
    headingIndex++;
  }

  return { sections };
}

export { VocabularyDocument, ParsedSection };
