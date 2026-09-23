import { generateStructuredAudit, MissingApiKeyError } from "@/lib/gemini/client";
import { formatRetrievedContext, retrievePolicies } from "@/lib/rag/retrieve";
import type { RetrievalHit } from "@/lib/rag/types";
import type { AuditEnvelope, AuditRequest } from "@/lib/schemas";

export { MissingApiKeyError };

export type AuditRun = AuditEnvelope & {
  retrieved: RetrievalHit[];
  model: string;
};

function buildPrompt(scenario: string, retrieved: RetrievalHit[]): string {
  return [
    "You are the CloudSec & FinOps Compliance Auditor.",
    "Audit the architecture scenario against ONLY the retrieved policy clauses.",
    "Do not invent policy IDs. Cite exact identifiers such as [POL-S3-001] plus a short clause quote.",
    "If the scenario violates a retrieved CRITICAL/HIGH clause, status is NON_COMPLIANT.",
    "Use WARNING for partial alignment or missing hygiene (tags, logging) without a confirmed breach.",
    "Use COMPLIANT only when the scenario clearly meets the retrieved controls.",
    "Map risk_level from clause severity and exploitability (public data exposure = CRITICAL).",
    "estimated_cost_impact must mention FinOps (storage class, idle spend, or operational cost of the breach).",
    "Write summary, remediation_steps and estimated_cost_impact in Brazilian Portuguese. Keep policy IDs unchanged.",
    "Return JSON only matching the provided schema.",
    "",
    "## Architecture scenario",
    scenario.trim(),
    "",
    "## Retrieved policy clauses",
    formatRetrievedContext(retrieved),
  ].join("\n");
}

export async function runAudit(request: AuditRequest): Promise<AuditRun> {
  const started = Date.now();
  const retrieved = retrievePolicies(request.architecture_scenario, { k: 6 });
  const { result, model } = await generateStructuredAudit(
    buildPrompt(request.architecture_scenario, retrieved),
  );

  return {
    latency_ms: Date.now() - started,
    audit: result,
    retrieved,
    model,
  };
}
