import type { ComplianceStatus, RiskLevel } from "@/lib/schemas";

export type Tone = "ok" | "warn" | "high" | "crit";

export function statusTone(status: ComplianceStatus): Tone {
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

export function riskTone(risk: RiskLevel): Tone {
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

export function toneClass(tone: Tone | "idle"): string {
  switch (tone) {
    case "ok":
      return "tone-ok";
    case "warn":
      return "tone-warn";
    case "high":
      return "tone-high";
    case "crit":
      return "tone-crit";
    case "idle":
      return "tone-idle";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}
