import type { ComplianceStatus, RiskLevel } from "@/lib/schemas";

export function statusTone(status: ComplianceStatus): string {
  switch (status) {
    case "COMPLIANT":
      return "ok";
    case "WARNING":
      return "warn";
    case "NON_COMPLIANT":
      return "crit";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function riskTone(risk: RiskLevel): string {
  switch (risk) {
    case "LOW":
      return "ok";
    case "MEDIUM":
      return "warn";
    case "HIGH":
      return "high";
    case "CRITICAL":
      return "crit";
    default: {
      const _exhaustive: never = risk;
      return _exhaustive;
    }
  }
}
