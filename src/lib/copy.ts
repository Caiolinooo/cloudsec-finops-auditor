import type { ComplianceStatus, RiskLevel } from "@/lib/schemas";

export const copy = {
  title: "Auditor de conformidade",
  product: "CloudSec / FinOps",
  env: "interno",
  scenario: "Cenário de arquitetura",
  presets: "Casos prontos",
  scenarioField: "Descrição da arquitetura",
  run: "Auditar",
  running: "Auditando…",
  result: "Parecer",
  status: "Status",
  risk: "Risco",
  latency: "Latência",
  summary: "Resumo",
  finops: "Impacto FinOps",
  citations: "Cláusulas citadas",
  remediation: "Remediação",
  rawJson: "JSON da resposta",
  corpus: "Corpus carregado",
  idleTitle: "Nenhum parecer nesta sessão",
  idleBody:
    "Escolha um caso pronto ou descreva a conta. O retorno traz status, risco, latência, cláusulas e remediação.",
  loadingRetrieve: "Buscando cláusulas no corpus…",
  loadingModel: "Montando o parecer…",
  keyMissingTitle: "GEMINI_API_KEY ausente no servidor",
  keyMissingBody:
    "O build sobe sem a chave; a auditoria não. Copie .env.example para .env.local e reinicie, ou grave a variável no projeto da Vercel.",
  errorTitle: "Falha na auditoria",
  tooShort: "Mínimo 12 caracteres.",
  geminiOk: "Gemini configurado",
  geminiOff: "Gemini sem chave",
  policiesLoading: "políticas…",
  modelLoading: "modelo…",
  edited: "texto editado",
  policiesCount: (n: number) =>
    n === 1 ? "1 política" : `${n} políticas`,
  chars: (n: number) => `${n} caracteres`,
  elapsed: (ms: number) => `${(ms / 1000).toFixed(1)} s`,
  httpNotJson: (status: number) => `Resposta não-JSON (HTTP ${status}).`,
  httpFailed: (status: number) => `Falha HTTP ${status}`,
  timeout: (seconds: number) =>
    `Tempo esgotado (${seconds}s) ou auditoria cancelada.`,
  unreachable: "Não foi possível falar com /api/v1/audit",
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
