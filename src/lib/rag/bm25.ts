import { tokenize } from "./tokenize";
import type { PolicyChunk } from "./types";

export type Bm25Index = {
  chunks: PolicyChunk[];
  avgdl: number;
  df: Map<string, number>;
  tf: Map<string, Map<string, number>>;
  docLen: Map<string, number>;
};

const K1 = 1.5;
const B = 0.75;

export function buildBm25Index(chunks: PolicyChunk[]): Bm25Index {
  const df = new Map<string, number>();
  const tf = new Map<string, Map<string, number>>();
  const docLen = new Map<string, number>();
  let totalLen = 0;

  for (const chunk of chunks) {
    const tokens = tokenize(`${chunk.policyId} ${chunk.title} ${chunk.heading} ${chunk.text}`);
    const freq = new Map<string, number>();
    for (const token of tokens) {
      freq.set(token, (freq.get(token) ?? 0) + 1);
    }
    tf.set(chunk.chunkId, freq);
    docLen.set(chunk.chunkId, tokens.length);
    totalLen += tokens.length;
    for (const token of freq.keys()) {
      df.set(token, (df.get(token) ?? 0) + 1);
    }
  }

  return {
    chunks,
    avgdl: chunks.length === 0 ? 0 : totalLen / chunks.length,
    df,
    tf,
    docLen,
  };
}

function idf(df: number, n: number): number {
  return Math.log(1 + (n - df + 0.5) / (df + 0.5));
}

export function scoreBm25(index: Bm25Index, query: string): Map<string, number> {
  const scores = new Map<string, number>();
  const queryTokens = tokenize(query);
  const n = index.chunks.length;

  for (const chunk of index.chunks) {
    const freq = index.tf.get(chunk.chunkId);
    const dl = index.docLen.get(chunk.chunkId) ?? 0;
    if (!freq || dl === 0) {
      scores.set(chunk.chunkId, 0);
      continue;
    }

    let score = 0;
    for (const token of queryTokens) {
      const f = freq.get(token) ?? 0;
      if (f === 0) continue;
      const denom = f + K1 * (1 - B + B * (dl / (index.avgdl || 1)));
      score += idf(index.df.get(token) ?? 0, n) * ((f * (K1 + 1)) / denom);
    }
    scores.set(chunk.chunkId, score);
  }

  return scores;
}
