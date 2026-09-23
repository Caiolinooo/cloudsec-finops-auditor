import { Type } from "@google/genai";

export const GEMINI_AUDIT_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    compliance_status: {
      type: Type.STRING,
      enum: ["COMPLIANT", "NON_COMPLIANT", "WARNING"],
      description: "Overall compliance verdict against retrieved policies.",
    },
    risk_level: {
      type: Type.STRING,
      enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"],
      description: "Residual risk if the architecture is left unchanged.",
    },
    summary: {
      type: Type.STRING,
      description: "Executive summary grounded only in the retrieved clauses.",
    },
    cited_policies: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description:
        "Exact policy identifiers and short clause quotes, e.g. '[POL-S3-001] Block Public Access…'.",
    },
    remediation_steps: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "Ordered, actionable remediations from the cited clauses.",
    },
    estimated_cost_impact: {
      type: Type.STRING,
      description: "FinOps-oriented cost/impact narrative (qualitative + order of magnitude).",
    },
  },
  required: [
    "compliance_status",
    "risk_level",
    "summary",
    "cited_policies",
    "remediation_steps",
    "estimated_cost_impact",
  ],
};
