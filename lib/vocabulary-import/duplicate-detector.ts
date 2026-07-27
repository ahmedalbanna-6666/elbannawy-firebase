import type { DuplicateInfo } from './types';

export interface DuplicateDetectorOptions {
  readonly existingItems?: readonly { word: string; section: string; translation: string }[];
}

export class DuplicateDetector {
  private readonly index: Map<string, DuplicateInfo>;

  constructor(options?: DuplicateDetectorOptions) {
    this.index = new Map();
    if (options?.existingItems) {
      for (const item of options.existingItems) {
        const key = this.makeKey(item.word, item.section);
        this.index.set(key, {
          word: item.word,
          existingSection: item.section,
          existingTranslation: item.translation,
        });
      }
    }
  }

  private makeKey(word: string, section: string): string {
    return word.toLowerCase().trim() + '|' + section.toLowerCase().trim();
  }

  find(word: string, section: string): DuplicateInfo | null {
    const key = this.makeKey(word, section);
    return this.index.get(key) ?? null;
  }

  add(word: string, section: string, translation: string): void {
    const key = this.makeKey(word, section);
    if (!this.index.has(key)) {
      this.index.set(key, { word, existingSection: section, existingTranslation: translation });
    }
  }

  get all(): readonly DuplicateInfo[] {
    return Array.from(this.index.values());
  }

  get count(): number {
    return this.index.size;
  }
}
