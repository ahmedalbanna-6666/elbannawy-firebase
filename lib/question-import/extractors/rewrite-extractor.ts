import type { RewriteContent, RewriteQuestion } from '../types.js';
import { findAnswerKeyInText } from '../answer-key-parser.js';

function parseRewritePrompt(line: string): { prompt: string; indirectPhrase: string } | null {
  const trimmed = line.trim();

  const stdMatch = trimmed.match(/^["\u201c\u201d](.+?)["\u201c\u201d]\s+\((.+?)\)$/);
  if (stdMatch) {
    return { prompt: stdMatch[1]!.trim(), indirectPhrase: stdMatch[2]!.trim() };
  }

  const dashMatch = trimmed.match(/^["\u201c\u201d](.+?)["\u201c\u201d]\s+[\u2013\u2014\-]\s*(.+)$/);
  if (dashMatch) {
    return { prompt: dashMatch[1]!.trim(), indirectPhrase: dashMatch[2]!.trim() };
  }

  const firstChar = trimmed[0];
  if (firstChar === '"' || firstChar === '\u201c') {
    const closeQuote = firstChar === '"' ? '"' : '\u201d';
    const endQuote = trimmed.indexOf(closeQuote, 1);
    if (endQuote > 0) {
      const prompt = trimmed.substring(1, endQuote).trim();
      const rest = trimmed.substring(endQuote + 1).trim();
      const restClean = rest.replace(/^[\u2013\u2014\-]\s*/, '').replace(/^\((.+?)\)$/, '$1').trim();
      if (prompt) {
        return { prompt, indirectPhrase: restClean || rest };
      }
    }
  }

  return null;
}

export function extractRewrite(rawText: string): RewriteContent {
  const lines = rawText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0 && !l.startsWith('@@'));

  const answers = findAnswerKeyInText(rawText);

  const instruction = lines[0] || '';
  const questionLines = lines.slice(1);

  const questions: RewriteQuestion[] = [];

  for (const line of questionLines) {
    const qMatch = line.match(/^(\d+)\.\s+(.+)/);
    if (qMatch) {
      const qNum = parseInt(qMatch[1]!, 10);
      const rest = qMatch[2]!.trim();
      const parsed = parseRewritePrompt(rest);
      if (parsed) {
        questions.push({
          number: qNum,
          prompt: parsed.prompt,
          indirectPhrase: parsed.indirectPhrase,
        });
      } else {
        questions.push({
          number: qNum,
          prompt: rest,
          indirectPhrase: '',
        });
      }
    }
  }

  return {
    instruction,
    questions,
    answers: Object.fromEntries(answers),
  };
}
