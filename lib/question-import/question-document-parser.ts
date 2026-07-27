import type { DocumentBlock, ParsedDocument } from '../vocabulary-import/types';
import { ACTIVITY_MARKERS as KNOWN_ACTIVITY_MARKERS, ACTIVITY_MARKER_PATTERN } from './constants';
import type { ActivityType, ImportError, ErrorCode } from './types';

const MARKERS: Record<string, ActivityType> = {
  '@@MCQ@@': 'MCQ',
  '@@DRAG_DROP@@': 'DRAG_DROP',
  '@@READING@@': 'READING',
  '@@REWRITE@@': 'REWRITE',
  '@@CORRECT@@': 'CORRECT',
  '@@DIALOGUE@@': 'DIALOGUE',
  '@@TRUE_FALSE@@': 'TRUE_FALSE',
  '@@WRITING@@': 'WRITING',
};

const KNOWN_MARKER_SET = new Set<string>(KNOWN_ACTIVITY_MARKERS as readonly string[]);

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m: string, n: string) => String.fromCodePoint(Number(n)))
    .replace(/\s+/g, ' ').trim();
}

function htmlToRawText(html: string): string {
  let text = html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<\/tr>/gi, '\n')
    .replace(/<\/t[dh]>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_m: string, n: string) => String.fromCodePoint(Number(n)));
  return text.split('\n').map((l) => l.trim()).join('\n').trim();
}

function extractBlockText(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
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
      cells.push(extractBlockText(cellMatch[1] ?? ''));
    }
    if (cells.length > 0) rows.push(cells);
  }
  return rows;
}

export function parseQuestionDocumentBlocks(html: string): ParsedDocument & { rawText: string } {
  const blocks: DocumentBlock[] = [];
  const warnings: string[] = [];
  const orphanMarkers: string[] = [];
  const rawText = htmlToRawText(html);
  const pattern = /<(h[1-6]|p|table)(?:\s[^>]*)?>[\s\S]*?<\/\1>/gi;
  let match: RegExpExecArray | null;
  let blockIndex = 0;

  while ((match = pattern.exec(html)) !== null) {
    const fullTag = match[0];
    const tagName = match[1]?.toLowerCase() ?? '';

    if (/^h[1-6]$/.test(tagName)) {
      const level = Number(tagName[1]);
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

  const markerLines: { line: string; blockIdx: number }[] = [];
  for (let bi = 0; bi < blocks.length; bi++) {
    const block = blocks[bi];
    if (!block) continue;
    const lines = block.text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('@@')) {
        markerLines.push({ line: trimmed, blockIdx: bi });
      }
    }
  }

  for (const ml of markerLines) {
    const markerTag = Object.keys(MARKERS).find((m) => ml.line.startsWith(m));
    if (markerTag) continue;
    if (KNOWN_MARKER_SET.has(ml.line)) continue;
    const isAnswerKey = ml.line.startsWith('@@ANSWER_KEY@@');
    const isWordBank = ml.line.startsWith('@@WORD_BANK@@') || ml.line.startsWith('@@END_WORD_BANK@@');
    if (isAnswerKey || isWordBank) continue;
    orphanMarkers.push(ml.line);
  }

  if (orphanMarkers.length > 0) {
    warnings.push(`${String(orphanMarkers.length)} unknown marker(s) detected: ${orphanMarkers.join(', ')} — content may be lost`);
  }

  const orphanTableBlocks: DocumentBlock[] = [];
  const nonOrphanBlocks: DocumentBlock[] = [];
  let foundMarker = false;

  for (const block of blocks) {
    const blockText = block.text;
    const hasMarker = blockText.includes('@@MCQ@@') || blockText.includes('@@DRAG_DROP@@')
      || blockText.includes('@@READING@@') || blockText.includes('@@REWRITE@@')
      || blockText.includes('@@CORRECT@@') || blockText.includes('@@DIALOGUE@@')
      || blockText.includes('@@TRUE_FALSE@@') || blockText.includes('@@WRITING@@');

    if (hasMarker) {
      foundMarker = true;
      nonOrphanBlocks.push(block);
    } else if (foundMarker) {
      nonOrphanBlocks.push(block);
    } else {
      if (block.type === 'table') {
        orphanTableBlocks.push(block);
      }
    }
  }

  if (orphanTableBlocks.length > 0) {
    warnings.push(`${String(orphanTableBlocks.length)} table(s) found before first activity marker`);
  }

  return { blocks: nonOrphanBlocks, orphanTables: orphanTableBlocks, warnings, rawText };
}

export function buildQuestionSectionsFromBlocks(
  blocks: readonly DocumentBlock[],
  orphanTables: readonly DocumentBlock[],
): { sections: { type: ActivityType; order: number; rawText: string }[]; header: string; warnings: ImportError[] } {
  const warnings: ImportError[] = [];

  if (orphanTables.length > 0) {
    warnings.push({ code: 'DRAG_DROP_MISSING_WORD_BANK' as ErrorCode, message: `${String(orphanTables.length)} table(s) found before first activity marker` });
  }

  const parts: { text: string; marker: string | null }[] = [];
  let currentParts: string[] = [];
  let currentMarker: string | null = null;
  let foundFirst = false;

  function flush(): void {
    if (currentParts.length > 0 || currentMarker) {
      parts.push({ text: currentParts.join('\n').trim(), marker: currentMarker });
      currentParts = [];
    }
  }

  for (const block of blocks) {
    const blockText = block.text;
    const markerMatch = blockText.match(ACTIVITY_MARKER_PATTERN);

    if (markerMatch) {
      flush();
      currentMarker = markerMatch[0];
      foundFirst = true;
      const afterMarker = blockText.replace(ACTIVITY_MARKER_PATTERN, '').trim();
      if (afterMarker) currentParts.push(afterMarker);
    } else if (foundFirst) {
      currentParts.push(blockText);
    }
  }

  flush();

  const sections: { type: ActivityType; order: number; rawText: string }[] = [];
  let activityOrder = 0;
  const seenMarkers = new Set<ActivityType>();

  for (const part of parts) {
    if (!part.marker) continue;
    const marker = MARKERS[part.marker];
    if (!marker) continue;
    if (seenMarkers.has(marker)) {
      warnings.push({ code: 'DUPLICATE_ACTIVITY_MARKER' as ErrorCode, message: `Duplicate ${marker} marker at position ${activityOrder + 1}` });
    }
    seenMarkers.add(marker);
    activityOrder++;
    sections.push({ type: marker, order: activityOrder, rawText: part.text });
  }

  const firstMarkerIdx = blocks.findIndex((b) => ACTIVITY_MARKER_PATTERN.test(b.text));
  const headerLines: string[] = [];
  if (firstMarkerIdx > 0) {
    for (let i = 0; i < firstMarkerIdx; i++) {
      const b = blocks[i];
      if (b) headerLines.push(b.text);
    }
  } else if (firstMarkerIdx < 0) {
    for (const b of blocks) headerLines.push(b.text);
  }

  return {
    sections,
    header: headerLines.join(' | '),
    warnings,
  };
}
