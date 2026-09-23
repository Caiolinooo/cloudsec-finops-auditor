const STOP_WORDS = new Set([
  "a",
  "an",
  "and",
  "are",
  "as",
  "at",
  "be",
  "by",
  "for",
  "from",
  "has",
  "in",
  "is",
  "it",
  "of",
  "on",
  "or",
  "that",
  "the",
  "to",
  "was",
  "with",
]);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9+._/-]+/g, " ")
    .split(/\s+/)
    .map((token) => token.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, ""))
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

export function extractPolicyId(text: string): string | undefined {
  const match = text.match(/POL-[A-Z0-9]+-\d{3}/i);
  return match ? match[0].toUpperCase() : undefined;
}

export function charNgrams(text: string, n = 3): string[] {
  const compact = text.toLowerCase().replace(/[^a-z0-9]+/g, " ");
  const grams: string[] = [];
  for (let i = 0; i <= compact.length - n; i += 1) {
    grams.push(compact.slice(i, i + n));
  }
  return grams;
}
