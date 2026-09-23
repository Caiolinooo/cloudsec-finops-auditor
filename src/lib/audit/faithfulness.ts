import { extractPolicyId, tokenize } from "@/lib/rag/tokenize";
import type { RetrievalHit } from "@/lib/rag/types";
import type { AuditResult } from "@/lib/schemas";

const POLICY_ID_RE = /POL-[A-Z0-9]+-\d{3}/gi;

export type FaithfulnessBreakdown = {
  citation_grounding: number;
  summary_overlap: number;
  invented_policy_penalty: number;
  score: number;
};

function uniquePolicyIds(text: string): string[] {
  return [...new Set((text.match(POLICY_ID_RE) ?? []).map((id) => id.toUpperCase()))];
}

function overlapRatio(text: string, corpusTokens: Set<string>): number {
  const tokens = tokenize(text);
  if (tokens.length === 0) return 0;
  const hits = tokens.filter((token) => corpusTokens.has(token)).length;
  return hits / tokens.length;
}

export function scoreFaithfulness(
  audit: AuditResult,
  retrieved: RetrievalHit[],
): FaithfulnessBreakdown {
  const retrievedIds = new Set(retrieved.map((hit) => hit.policyId));
  const corpus = retrieved
    .map((hit) => `${hit.policyId} ${hit.title} ${hit.heading} ${hit.text}`)
    .join("\n")
    .toLowerCase();
  const corpusTokens = new Set(tokenize(corpus));

  const citationScores = audit.cited_policies.map((citation) => {
    const id = extractPolicyId(citation);
    if (id && retrievedIds.has(id)) return 1;
    if (id && corpus.includes(id.toLowerCase())) return 1;
    return overlapRatio(citation, corpusTokens) >= 0.35 ? 1 : 0;
  });
  const groundedCount = citationScores.reduce<number>((sum, value) => sum + value, 0);
  const citation_grounding =
    citationScores.length === 0 ? 0 : groundedCount / citationScores.length;

  const summary_overlap = Math.min(1, overlapRatio(audit.summary, corpusTokens) / 0.35);

  const mentioned = uniquePolicyIds(
    [...audit.cited_policies, audit.summary, ...audit.remediation_steps].join("\n"),
  );
  const invented = mentioned.filter((id) => !retrievedIds.has(id));
  const invented_policy_penalty = mentioned.length === 0 ? 0 : invented.length / mentioned.length;

  const score = Math.max(
    0,
    Math.min(
      1,
      0.7 * citation_grounding + 0.3 * summary_overlap - 0.25 * invented_policy_penalty,
    ),
  );

  return {
    citation_grounding,
    summary_overlap,
    invented_policy_penalty,
    score: Number(score.toFixed(4)),
  };
}
