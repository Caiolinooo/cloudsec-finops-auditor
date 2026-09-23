import { z } from "zod";

export const ComplianceStatus = z.enum([
  "COMPLIANT",
  "NON_COMPLIANT",
  "WARNING",
]);
export type ComplianceStatus = z.infer<typeof ComplianceStatus>;

export const RiskLevel = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export type RiskLevel = z.infer<typeof RiskLevel>;

export const LocaleSchema = z.enum(["en", "pt"]);
export type RequestLocale = z.infer<typeof LocaleSchema>;

export const AuditRequestSchema = z.object({
  architecture_scenario: z
    .string()
    .trim()
    .min(12, "architecture_scenario must describe the architecture (min. 12 characters)"),
  locale: LocaleSchema.optional(),
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

export const ApiErrorCodeSchema = z.enum([
  "MISSING_API_KEY",
  "INVALID_REQUEST",
  "UPSTREAM_MODEL",
  "PARSE_ERROR",
  "INTERNAL",
  "MODEL_UNAVAILABLE",
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

export const ApiErrorSchema = z.object({
  error: z.string(),
  code: ApiErrorCodeSchema,
  details: z.unknown().optional(),
});
export type ApiError = z.infer<typeof ApiErrorSchema>;
