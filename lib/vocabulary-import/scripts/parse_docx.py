"""
Vocabulary DOCX Parser for El-Bannawy Platform.

Reads a Word document containing vocabulary sections and outputs structured JSON.

Usage:
    python parse_docx.py <path_to_docx>

Output (stdout):
    JSON object with fully processed sections.
"""

import json
import re
import sys
from typing import Any

from docx import Document
from docx.oxml.ns import qn


def extract_text_from_element(element: Any) -> str:
    parts: list[str] = []
    for t in element.iter(qn('w:t')):
        if t.text:
            parts.append(t.text)
    return ''.join(parts).strip()


def get_paragraph_style(element: Any) -> str:
    ppr = element.find(qn('w:pPr'))
    if ppr is not None:
        pstyle = ppr.find(qn('w:pStyle'))
        if pstyle is not None:
            val = pstyle.get(qn('w:val'))
            if val:
                return val
    return ''


def is_heading_element(element: Any) -> bool:
    tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
    if tag != 'p':
        return False
    style = get_paragraph_style(element)
    return style.startswith('Heading')


def is_table_element(element: Any) -> bool:
    tag = element.tag.split('}')[-1] if '}' in element.tag else element.tag
    return tag == 'tbl'


def extract_text(cell_text: str) -> str:
    parts = cell_text.split('\n')
    return '\n'.join(p.strip() for p in parts if p.strip())


def dedupe_row_cells(row_cells: list[str]) -> list[str]:
    result: list[str] = []
    for cell in row_cells:
        text = extract_text(cell)
        if result and text == result[-1]:
            continue
        if text:
            result.append(text)
    return result


def split_arabic(text: str) -> str | list[str]:
    trimmed = text.strip()
    if not trimmed:
        return ''

    normalized = trimmed.replace('\n', '/')

    parts: list[str] = []
    current: list[str] = []
    depth = 0
    i = 0
    while i < len(normalized):
        ch = normalized[i]
        if ch in '({[':
            depth += 1
            current.append(ch)
        elif ch in ')}]':
            depth = max(0, depth - 1)
            current.append(ch)
        elif ch in '/|' or (depth == 0 and ch in '–—ـ'):
            if current:
                parts.append(''.join(current).strip())
                current = []
        else:
            current.append(ch)
        i += 1
    if current:
        parts.append(''.join(current).strip())

    parts = [p.strip() for p in parts if p.strip()]
    if len(parts) <= 1:
        return trimmed
    return parts


def split_lines(text: str) -> list[str]:
    return [s.strip() for s in text.split('\n') if s.strip()]


def parse_vocabulary_row(cells: list[str]) -> list[dict[str, Any]]:
    deduped = dedupe_row_cells(cells)
    pairs: list[dict[str, Any]] = []
    i = 0
    while i + 1 < len(deduped):
        pairs.append({
            'english': deduped[i],
            'arabic': split_arabic(deduped[i + 1]),
        })
        i += 2
    return pairs


def parse_synonym_row(cells: list[str]) -> dict[str, Any] | None:
    deduped = dedupe_row_cells(cells)
    if len(deduped) < 6:
        return None
    return {
        'word': deduped[0],
        'arabic': split_arabic(deduped[1]) if len(deduped) > 1 else '',
        'synonyms': split_lines(deduped[2]) if len(deduped) > 2 else [],
        'antonyms': split_lines(deduped[4]) if len(deduped) > 4 else [],
    }


def classify_section(heading: str) -> str:
    lower = heading.lower()
    if 'synonym' in lower or 'antonym' in lower:
        return 'synonym-antonym'
    return 'vocabulary'


def parse_document(filepath: str) -> dict[str, Any]:
    doc = Document(filepath)
    body = doc.element.body
    tables = doc.tables

    elements: list[tuple[str, str | None]] = []
    for child in body:
        if is_heading_element(child):
            text = extract_text_from_element(child)
            if text:
                elements.append(('heading', text))
        elif is_table_element(child):
            elements.append(('table', None))

    sections: list[dict[str, Any]] = []
    table_index = 0
    i = 0
    while i < len(elements):
        if elements[i][0] != 'heading':
            i += 1
            continue

        heading_texts: list[str] = []
        while i < len(elements) and elements[i][0] == 'heading':
            heading_texts.append(elements[i][1])  # type: ignore
            i += 1

        canonical = heading_texts[0]
        section = {
            'heading': canonical,
            'type': classify_section(canonical),
            'items': [],
        }

        if i < len(elements) and elements[i][0] == 'table' and table_index < len(tables):
            i += 1
            table = tables[table_index]
            table_index += 1

            section_type = section['type']

            if section_type == 'synonym-antonym':
                for r_idx, row in enumerate(table.rows):
                    cells = [cell.text for cell in row.cells]
                    raw = [extract_text(c) for c in cells]
                    if r_idx == 0:
                        header_text = ' '.join(raw[0:2]).lower()
                        if 'word' in header_text or 'synonym' in header_text:
                            continue
                    item = parse_synonym_row(cells)
                    if item:
                        section['items'].append(item)
            else:
                is_first = True
                for row in table.rows:
                    cells = [cell.text for cell in row.cells]
                    raw = [extract_text(c) for c in cells]
                    if is_first:
                        combined = ' '.join(raw[0:2]).lower()
                        if 'word' in combined or 'english' in combined or 'synonym' in combined:
                            is_first = False
                            continue
                    is_first = False
                    pairs = parse_vocabulary_row(cells)
                    section['items'].extend(pairs)

        sections.append(section)

    return {'sections': sections}


def main() -> None:
    if len(sys.argv) < 2:
        print('Usage: python parse_docx.py <path_to_docx>', file=sys.stderr)
        sys.exit(1)

    filepath = sys.argv[1]
    result = parse_document(filepath)
    json.dump(result, sys.stdout, ensure_ascii=False, indent=2)


if __name__ == '__main__':
    main()
