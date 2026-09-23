import {
  generateStructuredAudit,
  MissingApiKeyError,
} from "@/lib/gemini/client";
import type { Locale } from "@/lib/i18n";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import { formatRetrievedContext, retrievePolicies } from "@/lib/rag/retrieve";
import type { RetrievalHit } from "@/lib/rag/types";
import type { AuditEnvelope, AuditRequest } from "@/lib/schemas";

export { MissingApiKeyError };

export type AuditRun = AuditEnvelope & {
  retrieved: RetrievalHit[];
  model: string;
};

function languageInstruction(locale: Locale): string {
  switch (locale) {
    case "pt":
      return "Write summary, remediation_steps and estimated_cost_impact in Brazilian Portuguese. Keep policy IDs unchanged.";
    case "en":
      return "Write summary, remediation_steps and estimated_cost_impact in English. Keep policy IDs unchanged.";
    default: {
      const _exhaustive: never = locale;
      return _exhaustive;
    }
  }
}

function buildPrompt(
  scenario: string,
  retrieved: RetrievalHit[],
  locale: Locale,
): string {
  return [
    "You are the CloudSec & FinOps Compliance Auditor.",
    "Audit the architecture scenario against ONLY the retrieved policy clauses.",
    "Do not invent policy IDs. Cite exact identifiers such as [POL-S3-001] plus a short clause quote.",
    "If the scenario violates a retrieved CRITICAL/HIGH clause, status is NON_COMPLIANT.",
    "Use WARNING for partial alignment or missing hygiene (tags, logging) without a confirmed breach.",
    "Use COMPLIANT only when the scenario clearly meets the retrieved controls.",
    "Map risk_level from clause severity and exploitability (public data exposure = CRITICAL).",
    "estimated_cost_impact must mention FinOps (storage class, idle spend, or operational cost of the breach).",
    languageInstruction(locale),
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
  const locale = request.locale ?? DEFAULT_LOCALE;
  const retrieved = retrievePolicies(request.architecture_scenario, { k: 6 });
  const { result, model } = await generateStructuredAudit(
    buildPrompt(request.architecture_scenario, retrieved, locale),
  );

  return {
    latency_ms: Date.now() - started,
    audit: result,
    retrieved,
    model,
  };
}
