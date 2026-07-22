export const MARKER_ANSWER_KEY = '@@ANSWER_KEY@@';
export const MARKER_WORD_BANK = '@@WORD_BANK@@';
export const MARKER_END_WORD_BANK = '@@END_WORD_BANK@@';

export const CATEGORY_HEADERS = [
  'Key vocabulary',
  'Definitions',
  'Guessing the meaning',
  'Synonyms, Antonyms, Prefixes & Suffixes',
  'Collocations',
  'Structure & Writing',
  'Language Functions',
  'Reading Comprehension',
] as const;

export const ACTIVITY_MARKERS = [
  '@@MCQ@@',
  '@@DRAG_DROP@@',
  '@@READING@@',
  '@@REWRITE@@',
  '@@CORRECT@@',
  '@@DIALOGUE@@',
  '@@TRUE_FALSE@@',
  '@@WRITING@@',
] as const;

export const ACTIVITY_MARKER_PATTERN = /@@(MCQ|DRAG_DROP|READING|REWRITE|CORRECT|DIALOGUE|TRUE_FALSE|WRITING)@@/g;

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['.docx'] as const;
