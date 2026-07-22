import type { DialogueContent, DialogueLine } from '../types.js';
import { findAnswerKeyInText, extractBodyBeforeAnswerKey } from '../answer-key-parser.js';

function isSpeakerLabel(line: string): boolean {
  return /^Student\s+[A-B]$/i.test(line.trim());
}

function isSpeakerAndText(line: string): RegExpMatchArray | null {
  return line.match(/^(Student\s+[A-B])\s+(.+)/i);
}

export function extractDialogue(rawText: string): DialogueContent {
  const body = extractBodyBeforeAnswerKey(rawText);
  const answers = findAnswerKeyInText(rawText);

  const lines = body.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  const instruction = lines[0] || '';
  const dialogueLines = lines.slice(1);

  const extractedLines: DialogueLine[] = [];
  let currentSpeaker: string | null = null;

  for (const line of dialogueLines) {
    const speakerTextMatch = isSpeakerAndText(line);
    if (speakerTextMatch) {
      currentSpeaker = speakerTextMatch[1]!;
      extractedLines.push({
        speaker: currentSpeaker,
        text: speakerTextMatch[2]!.trim(),
      });
      continue;
    }

    if (isSpeakerLabel(line)) {
      currentSpeaker = line;
      continue;
    }

    if (currentSpeaker) {
      extractedLines.push({
        speaker: currentSpeaker,
        text: line,
      });
    }
  }

  return {
    instruction,
    lines: extractedLines,
    answers: Object.fromEntries(answers),
  };
}
