import { charNgrams, tokenize } from "./tokenize";
import type { PolicyChunk } from "./types";

const VECTOR_SIZE = 384;

export type DenseIndex = {
  chunks: PolicyChunk[];
  vectors: Map<string, Float32Array>;
  idf: Map<string, number>;
};

function hashFeature(feature: string): number {
  let hash = 2166136261;
  for (let i = 0; i < feature.length; i += 1) {
    hash ^= feature.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash) % VECTOR_SIZE;
}

function featuresFor(text: string): string[] {
  const tokens = tokenize(text);
  return [...tokens, ...charNgrams(text, 3, 400)];
}

function accumulate(
  target: Float32Array,
  features: string[],
  idf: Map<string, number>,
): void {
  const tf = new Map<string, number>();
  for (const feature of features) {
    tf.set(feature, (tf.get(feature) ?? 0) + 1);
  }
  for (const [feature, count] of tf) {
    const weight = (1 + Math.log(count)) * (idf.get(feature) ?? 1);
    target[hashFeature(feature)] += weight;
  }
}

function l2normalize(vector: Float32Array): Float32Array {
  let sum = 0;
  for (const value of vector) {
    sum += value * value;
  }
  const norm = Math.sqrt(sum) || 1;
  const out = new Float32Array(vector.length);
  for (let i = 0; i < vector.length; i += 1) {
    out[i] = vector[i] / norm;
  }
  return out;
}

export function buildDenseIndex(chunks: PolicyChunk[]): DenseIndex {
  const df = new Map<string, number>();
  const chunkFeatures = new Map<string, string[]>();

  for (const chunk of chunks) {
    const features = featuresFor(
      `${chunk.policyId} ${chunk.title} ${chunk.heading} ${chunk.text}`,
    );
    chunkFeatures.set(chunk.chunkId, features);
    for (const feature of new Set(features)) {
      df.set(feature, (df.get(feature) ?? 0) + 1);
    }
  }

  const idf = new Map<string, number>();
  const n = Math.max(chunks.length, 1);
  for (const [feature, count] of df) {
    idf.set(feature, Math.log((n + 1) / (count + 1)) + 1);
  }

  const vectors = new Map<string, Float32Array>();
  for (const chunk of chunks) {
    const raw = new Float32Array(VECTOR_SIZE);
    accumulate(raw, chunkFeatures.get(chunk.chunkId) ?? [], idf);
    vectors.set(chunk.chunkId, l2normalize(raw));
  }

  return { chunks, vectors, idf };
}

export function embedQuery(index: DenseIndex, query: string): Float32Array {
  const raw = new Float32Array(VECTOR_SIZE);
  accumulate(raw, featuresFor(query), index.idf);
  return l2normalize(raw);
}

export function cosine(a: Float32Array, b: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < a.length; i += 1) {
    sum += a[i] * b[i];
  }
  return sum;
}

export function scoreDense(index: DenseIndex, query: string): Map<string, number> {
  const queryVec = embedQuery(index, query);
  const scores = new Map<string, number>();
  for (const chunk of index.chunks) {
    const vector = index.vectors.get(chunk.chunkId);
    scores.set(chunk.chunkId, vector ? Math.max(0, cosine(queryVec, vector)) : 0);
  }
  return scores;
}
