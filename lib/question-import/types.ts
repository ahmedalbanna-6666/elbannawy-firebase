export type ActivityType = 'MCQ' | 'DRAG_DROP' | 'READING' | 'REWRITE' | 'CORRECT' | 'DIALOGUE' | 'TRUE_FALSE' | 'WRITING';

export type ErrorCode =
  | 'NO_ANSWER_KEY'
  | 'EMPTY_ANSWER_KEY'
  | 'DUPLICATE_QUESTION_NUMBER'
  | 'DUPLICATE_ACTIVITY_MARKER'
  | 'MCQ_MISSING_OPTIONS'
  | 'MCQ_TOO_FEW_OPTIONS'
  | 'READING_EMPTY_PASSAGE'
  | 'DIALOGUE_EMPTY'
  | 'WRITING_EMPTY_TOPIC'
  | 'DRAG_DROP_MISSING_WORD_BANK'
  | 'TRUE_FALSE_INVALID_BOOLEAN'
  | 'MISSING_ANSWER_ENTRY';

export interface McqOption {
  label: string;
  text: string;
}

export interface McqQuestion {
  number: number;
  prefix: string | null;
  category: string | null;
  question: string;
  options: McqOption[];
}

export interface McqContent {
  instruction: string;
  categories: McqCategory[];
  answers: Record<number, string>;
}

export interface McqCategory {
  name: string;
  questions: McqQuestion[];
}

export interface DragDropContent {
  instruction: string;
  wordBank: string[];
  textWithBlanks: string;
  answers: Record<number, string>;
}

export interface ReadingQuestion {
  number: number;
  question: string;
  options: McqOption[] | null;
}

export interface ReadingPart {
  label: string;
  instruction: string;
  type: 'MCQ' | 'OPEN_ENDED';
  questions: ReadingQuestion[];
  answers: Record<number, string>;
}

export interface ReadingContent {
  instruction: string;
  passage: string;
  parts: ReadingPart[];
}

export interface RewriteQuestion {
  number: number;
  prompt: string;
  indirectPhrase: string;
}

export interface RewriteContent {
  instruction: string;
  questions: RewriteQuestion[];
  answers: Record<number, string>;
}

export interface CorrectQuestion {
  number: number;
  sentence: string;
}

export interface CorrectContent {
  instruction: string;
  questions: CorrectQuestion[];
  answers: Record<number, string>;
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface DialogueContent {
  instruction: string;
  lines: DialogueLine[];
  answers: Record<number, string>;
}

export interface TrueFalseQuestion {
  number: number;
  statement: string;
}

export interface TrueFalseContent {
  instruction: string;
  questions: TrueFalseQuestion[];
  answers: Record<number, boolean>;
}

export interface WritingContent {
  instruction: string;
  topic: string;
  wordCount: number | null;
  gradingType: 'AI' | 'MANUAL';
}

export type ActivityContent =
  | McqContent
  | DragDropContent
  | ReadingContent
  | RewriteContent
  | CorrectContent
  | DialogueContent
  | TrueFalseContent
  | WritingContent;

export interface ImportedActivity {
  type: ActivityType;
  order: number;
  content: ActivityContent;
  errors: ImportError[];
  warnings: ImportError[];
}

export interface ImportError {
  code: ErrorCode;
  message: string;
}

export interface ImportResult {
  documentTitle: string;
  activities: ImportedActivity[];
  errors: ImportError[];
  warnings: ImportError[];
}
