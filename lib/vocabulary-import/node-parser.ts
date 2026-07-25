import JSZip from 'jszip';
import type { VocabularyDocument, ParsedSection, VocabularyEntry, SynonymEntry } from './types';

interface XmlElement {
  tag: string;
  attrs: Record<string, string>;
  children: XmlElement[];
  text: string;
}

function parseXml(xml: string): XmlElement {
  const cleaned = xml.replace(/<\?xml[^>]*\?>/, '').trim();
  const root = parseElement(cleaned, 0);
  return root.element;
}

function parseElement(xml: string, start: number): { element: XmlElement; end: number } {
  const tagStart = xml.indexOf('<', start);
  if (tagStart === -1 || xml[tagStart + 1] === '/') {
    return { element: { tag: '', attrs: {}, children: [], text: '' }, end: start };
  }

  const tagEnd = xml.indexOf('>', tagStart);
  const tagContent = xml.slice(tagStart + 1, tagEnd);
  const isSelfClosing = tagContent.endsWith('/');

  const spaceIdx = tagContent.indexOf(' ');
  const tag = (spaceIdx === -1 ? tagContent : tagContent.slice(0, spaceIdx)).replace('/', '');

  const attrs: Record<string, string> = {};
  if (spaceIdx !== -1) {
    const attrStr = tagContent.slice(spaceIdx + 1).replace(/\/$/, '').trim();
    const attrRegex = /([\w:.-]+)\s*=\s*"([^"]*)"/g;
    let match;
    while ((match = attrRegex.exec(attrStr)) !== null) {
      attrs[match[1]] = match[2];
    }
  }

  const children: XmlElement[] = [];
  let text = '';
  let pos = tagEnd + 1;

  if (isSelfClosing) {
    return { element: { tag, attrs, children, text }, end: pos };
  }

  const endTag = `</${tag.split(':').pop()!}>`;
  const closeTag = `</${tag}>`;
  let depth = 1;

  while (pos < xml.length && depth > 0) {
    if (xml[pos] === '<') {
      if (xml.slice(pos, pos + closeTag.length) === closeTag || xml.slice(pos, pos + endTag.length) === endTag) {
        depth--;
        if (depth === 0) {
          pos += closeTag.length;
          break;
        }
        pos += closeTag.length;
      } else if (xml[pos + 1] === '/') {
        depth--;
        const ctEnd = xml.indexOf('>', pos);
        pos = ctEnd + 1;
      } else if (xml.slice(pos, pos + 4) === '<!--') {
        const commentEnd = xml.indexOf('-->', pos);
        pos = commentEnd + 3;
      } else if (xml[pos + 1] === '!') {
        const ctEnd = xml.indexOf('>', pos);
        pos = ctEnd + 1;
      } else {
        const result = parseElement(xml, pos);
        children.push(result.element);
        pos = result.end;
      }
    } else {
      const nextTag = xml.indexOf('<', pos);
      if (nextTag === -1) break;
      const textContent = xml.slice(pos, nextTag).replace(/\s+/g, ' ').trim();
      if (textContent) text += textContent;
      pos = nextTag;
    }
  }

  return { element: { tag: tag.split(':').pop()!, attrs, children, text }, end: pos };
}

function findChildren(el: XmlElement, tag: string): XmlElement[] {
  return el.children.filter(c => c.tag === tag);
}

function findFirstChild(el: XmlElement, tag: string): XmlElement | undefined {
  return el.children.find(c => c.tag === tag);
}

function getText(el: XmlElement): string {
  const tElements = findChildren(el, 't');
  return tElements.map(t => t.text).join('').trim();
}

function getParagraphStyle(el: XmlElement): string {
  const pPr = findFirstChild(el, 'pPr');
  if (!pPr) return '';
  const pStyle = findFirstChild(pPr, 'pStyle');
  return pStyle?.attrs['w:val'] ?? '';
}

function extractCellText(cell: XmlElement): string {
  const parts: string[] = [];
  function walk(e: XmlElement): void {
    if (e.tag === 't' && e.text) parts.push(e.text);
    for (const c of e.children) walk(c);
  }
  walk(cell);
  return parts.join('').trim();
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

export async function parseVocabularyDocBuffer(buffer: Buffer): Promise<VocabularyDocument> {
  const zip = await JSZip.loadAsync(buffer);
  const docFile = zip.file('word/document.xml');
  if (!docFile) {
    throw new Error('DOCX file does not contain word/document.xml');
  }
  const xmlStr = await docFile.async('string');

  const root = parseXml(xmlStr);
  const body = findFirstChild(root, 'body');
  if (!body) throw new Error('Cannot find document body');

  const tables: XmlElement[] = [];
  const headingTexts: string[] = [];

  for (const child of body.children) {
    if (child.tag === 'tbl') {
      tables.push(child);
    } else if (child.tag === 'p') {
      const style = getParagraphStyle(child);
      if (style.startsWith('Heading')) {
        const text = getText(child);
        if (text) headingTexts.push(text);
      }
    }
  }

  const sections: ParsedSection[] = [];
  let tableIndex = 0;

  for (const heading of headingTexts) {
    const sectionType = classifySection(heading);
    const section: ParsedSection = {
      heading,
      type: sectionType,
      items: [],
    };

    if (tableIndex < tables.length) {
      const table = tables[tableIndex];
      tableIndex++;
      const rows = findChildren(table, 'tr');

      if (sectionType === 'synonym-antonym') {
        for (let r = 0; r < rows.length; r++) {
          const cells = findChildren(rows[r], 'tc').map(extractCellText);
          if (r === 0) {
            const headerText = (cells[0] ?? '').toLowerCase() + ' ' + (cells[1] ?? '').toLowerCase();
            if (headerText.includes('word') || headerText.includes('synonym')) continue;
          }
          const item = parseSynonymRow(cells);
          if (item) (section as any).items.push(item);
        }
      } else {
        let isFirst = true;
        for (const row of rows) {
          const cells = findChildren(row, 'tc').map(extractCellText);
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
  }

  return { sections };
}
