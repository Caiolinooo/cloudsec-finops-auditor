import { buildBm25Index, scoreBm25 } from "./bm25";
import { buildDenseIndex, scoreDense } from "./embeddings";
import { chunkPolicies, loadPolicies } from "./load-policies";
import type { PolicyChunk, RetrievalHit, RetrieveOptions } from "./types";

const RRF_K = 60;
const DEFAULT_K = 6;

export type PolicyIndex = {
  chunks: PolicyChunk[];
  bm25: ReturnType<typeof buildBm25Index>;
  dense: ReturnType<typeof buildDenseIndex>;
};

let cached: PolicyIndex | null = null;

export function getPolicyIndex(): PolicyIndex {
  if (cached) return cached;
  const chunks = chunkPolicies(loadPolicies());
  cached = {
    chunks,
    bm25: buildBm25Index(chunks),
    dense: buildDenseIndex(chunks),
  };
  return cached;
}

export function resetPolicyIndex(): void {
  cached = null;
}

function rankDesc(scores: Map<string, number>): string[] {
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([id]) => id);
}

function rrf(rank: number): number {
  return 1 / (RRF_K + rank);
}

export function retrievePolicies(
  query: string,
  options: RetrieveOptions = {},
  index = getPolicyIndex(),
): RetrievalHit[] {
  const k = options.k ?? DEFAULT_K;
  const lexical = scoreBm25(index.bm25, query);
  const dense = scoreDense(index.dense, query);
  const lexicalRanks = rankDesc(lexical);
  const denseRanks = rankDesc(dense);

  const fused = new Map<string, { score: number; lexicalRank: number; denseRank: number }>();
  lexicalRanks.forEach((id, i) => {
    const current = fused.get(id) ?? { score: 0, lexicalRank: i + 1, denseRank: Number.MAX_SAFE_INTEGER };
    current.score += rrf(i + 1);
    current.lexicalRank = i + 1;
    fused.set(id, current);
  });
  denseRanks.forEach((id, i) => {
    const current = fused.get(id) ?? { score: 0, lexicalRank: Number.MAX_SAFE_INTEGER, denseRank: i + 1 };
    current.score += rrf(i + 1);
    current.denseRank = i + 1;
    fused.set(id, current);
  });

  const byId = new Map(index.chunks.map((chunk) => [chunk.chunkId, chunk]));

  return [...fused.entries()]
    .sort((a, b) => b[1].score - a[1].score)
    .slice(0, k)
    .flatMap(([chunkId, meta]) => {
      const chunk = byId.get(chunkId);
      if (!chunk) return [];
      return [
        {
          ...chunk,
          score: meta.score,
          lexicalRank: meta.lexicalRank,
          denseRank: meta.denseRank,
        },
      ];
    });
}

export function formatRetrievedContext(hits: RetrievalHit[]): string {
  return hits
    .map(
      (hit, index) =>
        `[${index + 1}] ${hit.policyId} (${hit.heading})\nSource: ${hit.sourceFile}\n${hit.text}`,
    )
    .join("\n\n---\n\n");
}
