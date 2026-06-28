const WORDS_PER_MINUTE = 250;

export function wordCount(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(words: number): number {
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

export function lineCount(text: string): number {
  return text ? text.split("\n").length : 0;
}
