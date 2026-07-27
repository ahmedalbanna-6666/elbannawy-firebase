export type ActivityType = 'MCQ' | 'DRAG_DROP' | 'READING' | 'REWRITE' | 'CORRECT' | 'DIALOGUE' | 'TRUE_FALSE' | 'WRITING';

export type Severity = 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';

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
  | 'MISSING_ANSWER_ENTRY'
  | 'UNKNOWN_MARKER'
  | 'RECOVERED_SECTION'
  | 'ORPHAN_ANSWER_KEY'
  | 'ORPHAN_QUESTION'
  | 'DUPLICATE_ANSWER'
  | 'INVALID_ANSWER_LABEL'
  | 'EXTRA_ANSWER'
  | 'UNUSED_WORD_BANK_ENTRY'
  | 'MISSING_WORD_BANK_ENTRY'
  | 'DUPLICATE_WORD_BANK_ENTRY'
  | 'BROKEN_WORD_BANK_REFERENCE'
  | 'EMPTY_WORD_BANK'
  | 'MISSING_END_WORD_BANK'
  | 'MISSING_READING_ANSWER'
  | 'BROKEN_READING_STRUCTURE'
  | 'DUPLICATE_OPTION_LABEL'
  | 'EMPTY_OPTION'
  | 'INVALID_CORRECT_ANSWER'
  | 'NESTED_MARKER'
  | 'BROKEN_MARKER'
  | 'UNKNOWN_MARKER_DETECTED'
  | 'ORPHAN_PARAGRAPH'
  | 'UNEXPECTED_TEXT'
  | 'DUPLICATE_DIALOGUE_BLANK'
  | 'MISSING_DIALOGUE_ANSWER';

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

export interface ImportError {
  code: ErrorCode;
  message: string;
}

export interface ImportedActivity {
  type: ActivityType;
  order: number;
  content: ActivityContent;
  errors: ImportError[];
  warnings: ImportError[];
}

export interface ValidationIssue {
  severity: Severity;
  code: ErrorCode;
  message: string;
  activityType?: ActivityType;
  questionNumber?: number;
  section?: string;
  suggestedFix?: string;
  recoveryStatus?: 'RECOVERED' | 'NOT_RECOVERED' | 'FATAL';
  location?: string;
}

export interface UnknownMarkerRecovery {
  markerName: string;
  line: number;
  recoveredText: string;
  suggestedReplacement: string;
}

export interface WordBankValidation {
  duplicateWords: string[];
  unusedWords: string[];
  missingWords: string[];
  brokenReferences: string[];
}

export interface AnswerKeyValidation {
  missingAnswers: number[];
  duplicateAnswers: number[];
  extraAnswers: number[];
  invalidLabels: string[];
}

export interface ReadingValidation {
  emptyPassage: boolean;
  orphanQuestions: number[];
  missingAnswers: number[];
  duplicateNumbers: number[];
}

export interface McqValidation {
  emptyQuestions: number[];
  tooFewOptions: number[];
  duplicateLabels: number[];
  invalidCorrectAnswers: number[];
}

export interface DialogueValidation {
  missingLines: number;
  duplicateBlanks: number[];
  missingAnswers: number[];
}

export interface DocumentValidation {
  duplicateMarkers: string[];
  nestedMarkers: string[];
  brokenMarkers: string[];
  orphanParagraphs: number;
  orphanTables: number;
  emptySections: string[];
}

export interface RecoveryAction {
  type: string;
  description: string;
  success: boolean;
  recoveredContent?: string;
}

export interface ValidationReport {
  unknownMarkers: UnknownMarkerRecovery[];
  answerKeys: AnswerKeyValidation | null;
  wordBank: WordBankValidation | null;
  reading: ReadingValidation | null;
  mcq: McqValidation | null;
  dialogue: DialogueValidation | null;
  document: DocumentValidation;
  recoveryActions: RecoveryAction[];
  issues: ValidationIssue[];
  importSafetyScore: number;
  validationScore: number;
}

export interface ImportResult {
  documentTitle: string;
  activities: ImportedActivity[];
  errors: ImportError[];
  warnings: ImportError[];
  validationReport?: ValidationReport;
}
