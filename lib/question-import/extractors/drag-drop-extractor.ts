import type { DragDropContent } from '../types';
import { findAnswerKeyInText } from '../answer-key-parser';
import { MARKER_WORD_BANK, MARKER_END_WORD_BANK, MARKER_ANSWER_KEY } from '../constants';

export function extractDragDrop(rawText: string): DragDropContent {
  const lines = rawText.split('\n').map((l) => l.trim());
  const instruction = lines[0] || '';

  const wordBankStart = rawText.indexOf(MARKER_WORD_BANK);
  const wordBankEnd = rawText.indexOf(MARKER_END_WORD_BANK);

  let wordBank: string[] = [];
  if (wordBankStart !== -1 && wordBankEnd !== -1) {
    const wbContent = rawText.substring(wordBankStart + MARKER_WORD_BANK.length, wordBankEnd);
    wordBank = wbContent
      .split(/[–\-—,\n]/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);
  }

  const afterWordBank = wordBankEnd !== -1
    ? rawText.substring(wordBankEnd + MARKER_END_WORD_BANK.length)
    : rawText;

  const answerKeyStart = afterWordBank.indexOf(MARKER_ANSWER_KEY);
  const textWithBlanks = answerKeyStart !== -1
    ? afterWordBank.substring(0, answerKeyStart).trim()
    : afterWordBank.trim();

  const answers = findAnswerKeyInText(rawText);

  return {
    instruction,
    wordBank,
    textWithBlanks,
    answers: Object.fromEntries(answers),
  };
}
