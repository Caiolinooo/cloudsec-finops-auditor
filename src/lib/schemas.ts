import { z } from "zod";

export const ComplianceStatus = z.enum([
  "COMPLIANT",
  "NON_COMPLIANT",
  "WARNING",
]);
export type ComplianceStatus = z.infer<typeof ComplianceStatus>;

export const RiskLevel = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const MAX_ARCHITECTURE_SCENARIO_CHARS = 8_000;
export const MAX_AUDIT_BODY_CHARS = 24_000;

export const AuditRequestSchema = z.object({
  architecture_scenario: z
    .string()
    .trim()
    .min(12, "architecture_scenario precisa descrever a arquitetura (mín. 12 caracteres)")
    .max(
      MAX_ARCHITECTURE_SCENARIO_CHARS,
      `architecture_scenario excede ${MAX_ARCHITECTURE_SCENARIO_CHARS} caracteres`,
    ),
});
export type AuditRequest = z.infer<typeof AuditRequestSchema>;

export const AuditResultSchema = z.object({
  compliance_status: ComplianceStatus,
  risk_level: RiskLevel,
  summary: z.string().min(1),
  cited_policies: z.array(z.string().min(1)).min(1),
  remediation_steps: z.array(z.string().min(1)).min(1),
  estimated_cost_impact: z.string().min(1),
});
export type AuditResult = z.infer<typeof AuditResultSchema>;

export const AuditEnvelopeSchema = z.object({
  latency_ms: z.number().int().nonnegative(),
  audit: AuditResultSchema,
});
export type AuditEnvelope = z.infer<typeof AuditEnvelopeSchema>;

export const HealthSchema = z.object({
  status: z.literal("ok"),
  service: z.string(),
  gemini_configured: z.boolean(),
  policy_count: z.number().int().nonnegative(),
  models: z.object({
    primary: z.string(),
    fallback: z.string(),
  }),
});
export type Health = z.infer<typeof HealthSchema>;

export const PolicyCatalogSchema = z.object({
  count: z.number().int().nonnegative(),
  policies: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      severity: z.string(),
      framework: z.string(),
      domain: z.string(),
    }),
  ),
});
export type PolicyCatalog = z.infer<typeof PolicyCatalogSchema>;

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: z.enum([
    "MISSING_API_KEY",
    "INVALID_REQUEST",
    "UNAUTHORIZED",
    "RATE_LIMITED",
    "PAYLOAD_TOO_LARGE",
    "UPSTREAM_MODEL",
    "PARSE_ERROR",
    "INTERNAL",
  ]),
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
