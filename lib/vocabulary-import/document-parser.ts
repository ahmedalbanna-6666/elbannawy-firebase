import type { DocumentBlock, ParsedDocument, VocabularyEntry, SynonymEntry, VocabularyDocument, ParsedSection } from './types';

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#x60;/g, '`').replace(/&#(\d+);/g, (_m: string, n: string) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim();
}

function extractCellText(cellHtml: string): string {
  return cellHtml.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseTableHtml(tableHtml: string): readonly (readonly string[])[] {
  const rows: (readonly string[])[] = [];
  const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
  let rowMatch: RegExpExecArray | null;
  while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
    const cells: string[] = [];
    const cellHtml = rowMatch[1] ?? '';
    let cellMatch: RegExpExecArray | null;
    while ((cellMatch = cellRegex.exec(cellHtml)) !== null) {
      cells.push(extractCellText(cellMatch[1] ?? ''));
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

function extractHeadingLevel(tag: string): number {
  const m = tag.match(/<h([1-6])/i);
  return m ? Number(m[1]) : 1;
}

export function parseDocumentBlocks(html: string): ParsedDocument {
  const blocks: DocumentBlock[] = [];
  const warnings: string[] = [];
  const pattern = /<(h[1-6]|table|p)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = pattern.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1]?.toLowerCase() ?? '';

    if (/^h[1-6]$/.test(tagName)) {
      const level = extractHeadingLevel(fullTag);
      const text = decodeEntities(fullTag.replace(/<\/?h[1-6][^>]*>/gi, ''));
      if (text) {
        blocks.push({ type: 'heading', level, text, html: fullTag, index: blockIndex++ });
      }
    } else if (tagName === 'table') {
      const rows = parseTableHtml(fullTag);
      const text = rows.flat().join(' ');
      blocks.push({ type: 'table', level: 0, text, html: fullTag, index: blockIndex++, rows });
    } else if (tagName === 'p') {
      const text = decodeEntities(fullTag.replace(/<\/?p[^>]*>/gi, ''));
      if (text) {
        blocks.push({ type: 'paragraph', level: 0, text, html: fullTag, index: blockIndex++ });
      }
    }
  }

  const orphanTables: DocumentBlock[] = [];
  const nonOrphanBlocks: DocumentBlock[] = [];
  let foundFirstHeading = false;

  for (const block of blocks) {
    if (block.type === 'heading') {
      foundFirstHeading = true;
      nonOrphanBlocks.push(block);
    } else if (block.type === 'paragraph') {
      if (foundFirstHeading) nonOrphanBlocks.push(block);
    } else if (block.type === 'table') {
      if (foundFirstHeading) {
        nonOrphanBlocks.push(block);
      } else {
        orphanTables.push(block);
      }
    }
  }

  if (orphanTables.length > 0) {
    warnings.push(`${String(orphanTables.length)} table(s) found before first heading — placed in "Recovered Section"`);
  }

  return { blocks: nonOrphanBlocks, orphanTables, warnings };
}

function dedupeCells(cells: readonly string[]): string[] {
  const result: string[] = [];
  for (const cell of cells) {
    const text = cell.trim();
    if (result.length > 0 && text === result[result.length - 1] && text !== '') continue;
    result.push(text);
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
    const ch = normalized[i] ?? '';
    if ('({['.includes(ch)) { depth++; current += ch; }
    else if (')}]'.includes(ch)) { depth = Math.max(0, depth - 1); current += ch; }
    else if ('/|'.includes(ch) || (depth === 0 && '–—ـ'.includes(ch))) {
      if (current) { parts.push(current.trim()); current = ''; }
    } else { current += ch; }
  }
  if (current) parts.push(current.trim());
  const filtered = parts.filter((p) => p);
  if (filtered.length <= 1) return trimmed;
  return filtered;
}

function splitLines(text: string): string[] {
  return text.split('\n').map((s) => s.trim()).filter((s) => s);
}

function parseVocabularyRow(cells: readonly string[]): VocabularyEntry[] {
  const deduped = dedupeCells(cells);
  const pairs: VocabularyEntry[] = [];
  for (let i = 0; i + 1 < deduped.length; i += 2) {
    pairs.push({ english: deduped[i] ?? '', arabic: splitArabic(deduped[i + 1] ?? '') });
  }
  return pairs;
}

function parseSynonymRow(cells: readonly string[]): SynonymEntry | null {
  const deduped = dedupeCells(cells);
  if (deduped.length < 6) return null;
  const word = deduped[0] ?? '';
  const arabic = deduped[1] ?? '';
  if (!word || !arabic) return null;
  return {
    word,
    arabic: splitArabic(arabic),
    synonyms: splitLines(deduped[2] ?? ''),
    antonyms: splitLines(deduped[4] ?? ''),
  };
}

function classifySection(heading: string): 'vocabulary' | 'synonym-antonym' {
  const lower = heading.toLowerCase();
  if (lower.includes('synonym') || lower.includes('antonym')) return 'synonym-antonym';
  return 'vocabulary';
}

export function buildSectionsFromBlocks(
  blocks: readonly DocumentBlock[],
  orphanTables: readonly DocumentBlock[],
  detectDuplicatesFn?: (word: string, section: string) => import('./types').DuplicateInfo | null,
): VocabularyDocument {
  const headingGroups: { block: DocumentBlock; content: DocumentBlock[] }[] = [];
  let current: { block: DocumentBlock; content: DocumentBlock[] } | null = null;

  for (const block of blocks) {
    if (block.type === 'heading') {
      current = { block, content: [] };
      headingGroups.push(current);
    } else if (current) {
      current.content.push(block);
    }
  }

  const sections: ParsedSection[] = [];
  const withinSectionDups = new Set<string>();

  for (const group of headingGroups) {
    const sectionType = classifySection(group.block.text);
    const section: ParsedSection = sectionType === 'synonym-antonym'
      ? { heading: group.block.text, type: 'synonym-antonym', items: [] }
      : { heading: group.block.text, type: 'vocabulary', items: [] };

    for (const content of group.content) {
      if (content.type !== 'table') continue;
      const rows = content.rows ?? [];
      if (sectionType === 'synonym-antonym') {
        for (let r = 0; r < rows.length; r++) {
          const cells = rows[r]; if (!cells) continue;
          if (r === 0) {
            const h = (cells[0] ?? '') + ' ' + (cells[1] ?? '');
            if (h.toLowerCase().includes('word')) continue;
          }
          const item = parseSynonymRow(cells);
          if (item) (section as import('./types').SynonymSection).items.push(item);
        }
      } else {
        let isFirst = true;
        for (const cells of rows) {
          if (!cells) continue;
          if (isFirst) {
            const c0 = (cells[0] ?? '').toLowerCase();
            const c1 = (cells[1] ?? '').toLowerCase();
            if (c0.includes('word') || c0.includes('english') || c0.includes('expression') || c0 === c1 || (!c0 && !c1)) { isFirst = false; continue; }
          }
          isFirst = false;
          for (const pair of parseVocabularyRow(cells)) {
            if (!pair.english) continue;
            const dupKey = pair.english.toLowerCase().trim() + '|' + group.block.text.toLowerCase().trim();
            if (withinSectionDups.has(dupKey)) continue;
            withinSectionDups.add(dupKey);
            if (detectDuplicatesFn) {
              const dup = detectDuplicatesFn(pair.english, group.block.text);
              if (dup) continue;
            }
            (section as import('./types').VocabularySection).items.push(pair);
          }
        }
      }
    }

    if (sectionType === 'vocabulary' && (section as import('./types').VocabularySection).items.length > 0) {
      sections.push(section);
    } else if (sectionType === 'synonym-antonym' && (section as import('./types').SynonymSection).items.length > 0) {
      sections.push(section);
    }
  }

  if (orphanTables.length > 0) {
    const recovery: import('./types').VocabularySection = {
      heading: 'Recovered Section', type: 'vocabulary', items: [],
    };
    for (const table of orphanTables) {
      const rows = table.rows ?? [];
      let isFirst = true;
      for (const cells of rows) {
        if (isFirst) {
          const c0 = (cells[0] ?? '').toLowerCase();
          const c1 = (cells[1] ?? '').toLowerCase();
          if (c0.includes('word') || c0.includes('english') || c0.includes('expression') || c0 === c1 || (!c0 && !c1)) { isFirst = false; continue; }
        }
        isFirst = false;
        recovery.items.push(...parseVocabularyRow(cells));
      }
    }
    if (recovery.items.length > 0) sections.push(recovery);
  }

  return { sections };
}

export {
  dedupeCells, splitArabic, splitLines, parseVocabularyRow, parseSynonymRow,
  classifySection, extractCellText, parseTableHtml, decodeEntities,
};
