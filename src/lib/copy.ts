import type { ComplianceStatus, RiskLevel } from "@/lib/schemas";

export const copy = {
  title: "Auditoria de conformidade",
  product: "CloudSec / FinOps",
  env: "interno",
  scenario: "Cenário de arquitetura",
  presets: "Cenários",
  scenarioField: "Descrição da arquitetura",
  run: "Rodar auditoria",
  running: "Auditando…",
  result: "Parecer",
  status: "Status",
  risk: "Risco",
  latency: "Latência",
  summary: "Resumo",
  finops: "Impacto FinOps",
  citations: "Políticas citadas",
  remediation: "Remediação",
  rawJson: "JSON da resposta",
  corpus: "Políticas carregadas",
  idleTitle: "Nenhum parecer nesta sessão",
  idleBody:
    "Escolha um cenário ou descreva a arquitetura. O retorno é status, risco, latência, cláusulas e remediação.",
  loadingRetrieve: "Recuperando cláusulas…",
  loadingModel: "Montando o parecer…",
  keyMissingTitle: "GEMINI_API_KEY ausente no servidor",
  keyMissingBody:
    "O build sobe sem a chave; a auditoria não. Copie .env.example para .env.local e reinicie, ou grave a variável no projeto da Vercel.",
  errorTitle: "Falha na auditoria",
  tooShort: "Mínimo 12 caracteres.",
  geminiOk: "Gemini ok",
  geminiOff: "Gemini sem chave",
  policiesCount: (n: number) =>
    n === 1 ? "1 política" : `${n} políticas`,
  chars: (n: number) => `${n} caracteres`,
  elapsed: (ms: number) => `${(ms / 1000).toFixed(1)} s`,
} as const;

export function statusLabel(status: ComplianceStatus): string {
  switch (status) {
    case "COMPLIANT":
      return "CONFORME";
    case "WARNING":
      return "ALERTA";
    case "NON_COMPLIANT":
      return "NÃO CONFORME";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function riskLabel(risk: RiskLevel): string {
  switch (risk) {
    case "LOW":
      return "BAIXO";
    case "MEDIUM":
      return "MÉDIO";
    case "HIGH":
      return "ALTO";
    case "CRITICAL":
      return "CRÍTICO";
    default: {
      const _exhaustive: never = risk;
      return _exhaustive;
    }
  }
}
