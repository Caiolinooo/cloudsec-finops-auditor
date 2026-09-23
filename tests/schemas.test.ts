import { describe, expect, it } from "vitest";
import {
  AuditEnvelopeSchema,
  AuditRequestSchema,
  AuditResultSchema,
  HealthSchema,
  MAX_ARCHITECTURE_SCENARIO_CHARS,
} from "@/lib/schemas";
import { scoreFaithfulness } from "@/lib/audit/faithfulness";
import type { RetrievalHit } from "@/lib/rag/types";

const validAudit = {
  compliance_status: "NON_COMPLIANT" as const,
  risk_level: "CRITICAL" as const,
  summary:
    "customer-data-prod is publicly readable via AllUsers ACL with Block Public Access disabled, violating [POL-S3-001].",
  cited_policies: [
    "[POL-S3-001] Block Public Access for customer-data buckets — public AllUsers ACL is forbidden",
  ],
  remediation_steps: [
    "Enable all four S3 Block Public Access settings on the account and bucket",
    "Remove the AllUsers READ ACL and deny public GetObject",
  ],
  estimated_cost_impact:
    "Breach response and notification dominate; storage cost is secondary to SOC 2 exposure.",
};

const retrieved: RetrievalHit[] = [
  {
    chunkId: "POL-S3-001#1",
    policyId: "POL-S3-001",
    title: "[POL-S3-001] Block Public Access for customer-data buckets",
    heading: "Clause",
    text: "Buckets that store customer data MUST enable Amazon S3 Block Public Access. Public ACLs (AllUsers) are forbidden.",
    sourceFile: "POL-S3-001.md",
    score: 0.1,
    lexicalRank: 1,
    denseRank: 1,
  },
];

describe("AuditRequest / AuditResult schemas", () => {
  it("rejects an empty architecture_scenario", () => {
    const parsed = AuditRequestSchema.safeParse({ architecture_scenario: "short" });
    expect(parsed.success).toBe(false);
  });

  it("accepts a valid request", () => {
    const parsed = AuditRequestSchema.parse({
      architecture_scenario: "A production S3 bucket is public via ACL.",
    });
    expect(parsed.architecture_scenario.length).toBeGreaterThan(12);
  });

  it("rejects an oversized architecture_scenario", () => {
    const parsed = AuditRequestSchema.safeParse({
      architecture_scenario: "x".repeat(MAX_ARCHITECTURE_SCENARIO_CHARS + 1),
    });
    expect(parsed.success).toBe(false);
  });

  it("parses a typed envelope { latency_ms, audit }", () => {
    const envelope = AuditEnvelopeSchema.parse({
      latency_ms: 842,
      audit: validAudit,
    });
    expect(envelope.audit.compliance_status).toBe("NON_COMPLIANT");
    expect(AuditResultSchema.parse(envelope.audit).cited_policies[0]).toContain(
      "POL-S3-001",
    );
  });

  it("rejects unknown compliance_status values", () => {
    const parsed = AuditResultSchema.safeParse({
      ...validAudit,
      compliance_status: "MOSTLY_OK",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("health / catalog schemas", () => {
  it("accepts a health payload with policy_count", () => {
    const parsed = HealthSchema.parse({
      status: "ok",
      service: "cloudsec-finops-auditor",
      gemini_configured: false,
      policy_count: 15,
      models: { primary: "gemini-2.5-flash", fallback: "gemini-2.0-flash" },
    });
    expect(parsed.policy_count).toBe(15);
  });
});

describe("faithfulness gate (deterministic)", () => {
  it("scores grounded citations above the 0.85 threshold", () => {
    const breakdown = scoreFaithfulness(validAudit, retrieved);
    expect(breakdown.citation_grounding).toBe(1);
    expect(breakdown.score).toBeGreaterThanOrEqual(0.85);
  });

  it("penalizes invented policy IDs", () => {
    const breakdown = scoreFaithfulness(
      {
        ...validAudit,
        cited_policies: ["[POL-FAKE-999] This clause does not exist"],
      },
      retrieved,
    );
    expect(breakdown.score).toBeLessThan(0.85);
  });
});
