import type { Locale } from "@/lib/i18n";
import type { ApiErrorCode, ComplianceStatus, RiskLevel } from "@/lib/schemas";

export type Copy = {
  title: string;
  product: string;
  env: string;
  scenario: string;
  examples: string;
  examplesHint: string;
  scenarioField: string;
  scenarioHint: string;
  scenarioPlaceholder: string;
  run: string;
  running: string;
  result: string;
  status: string;
  risk: string;
  latency: string;
  summary: string;
  finops: string;
  citations: string;
  remediation: string;
  rawJson: string;
  corpus: string;
  idleTitle: string;
  idleBody: string;
  loadingRetrieve: string;
  loadingModel: string;
  keyMissingTitle: string;
  keyMissingBody: string;
  errorTitle: string;
  capacityTitle: string;
  tooShort: string;
  geminiOk: string;
  geminiOff: string;
  policiesLoading: string;
  modelLoading: string;
  edited: string;
  langLabel: string;
  unreachable: string;
  errors: Record<ApiErrorCode, string>;
  policiesCount: (n: number) => string;
  chars: (n: number) => string;
  elapsed: (ms: number) => string;
  httpNotJson: (status: number) => string;
  httpFailed: (status: number) => string;
  timeout: (seconds: number) => string;
};

const pt: Copy = {
  title: "Auditor de conformidade",
  product: "CloudSec / FinOps",
  env: "interno",
  scenario: "Cenário de arquitetura",
  examples: "Exemplos",
  examplesHint: "Atalhos opcionais. Eles só preenchem o campo — a auditoria é o texto que você colar.",
  scenarioField: "Descrição da arquitetura",
  scenarioHint:
    "Cole ou descreva a conta: buckets, IAM, criptografia, logging, tags. Exemplos abaixo são opcionais.",
  scenarioPlaceholder:
    "Cole qualquer descrição de arquitetura — por exemplo um bucket S3, usuários IAM, lifecycle ou o que estiver no desenho.",
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
  idleTitle: "Pronto para auditar",
  idleBody:
    "Cole qualquer descrição de arquitetura e rode a auditoria. Os exemplos são atalhos opcionais.",
  loadingRetrieve: "Buscando cláusulas no corpus…",
  loadingModel: "Montando o parecer…",
  keyMissingTitle: "GEMINI_API_KEY ausente no servidor",
  keyMissingBody:
    "O build sobe sem a chave; a auditoria não. Copie .env.example para .env.local e reinicie, ou grave a variável no projeto da Vercel.",
  errorTitle: "Falha na auditoria",
  capacityTitle: "Modelo ocupado",
  tooShort: "Mínimo 12 caracteres.",
  geminiOk: "Gemini configurado",
  geminiOff: "Gemini sem chave",
  policiesLoading: "políticas…",
  modelLoading: "modelo…",
  edited: "texto editado",
  langLabel: "Idioma",
  unreachable: "Não foi possível falar com /api/v1/audit",
  errors: {
    MISSING_API_KEY:
      "GEMINI_API_KEY ausente. Grave em .env.local ou nas variáveis do projeto na Vercel.",
    INVALID_REQUEST: "Pedido inválido. Descreva a arquitetura com pelo menos 12 caracteres.",
    UPSTREAM_MODEL: "O modelo não concluiu a auditoria. Tente de novo em instantes.",
    PARSE_ERROR: "A resposta do modelo veio fora do formato esperado. Tente de novo.",
    INTERNAL: "Falha inesperada na auditoria. Tente de novo.",
    MODEL_UNAVAILABLE:
      "O modelo está com demanda alta agora. Tente de novo em alguns segundos.",
  },
  policiesCount: (n) => (n === 1 ? "1 política" : `${n} políticas`),
  chars: (n) => `${n} caracteres`,
  elapsed: (ms) => `${(ms / 1000).toFixed(1)} s`,
  httpNotJson: (status) => `Resposta não-JSON (HTTP ${status}).`,
  httpFailed: (status) => `Falha HTTP ${status}`,
  timeout: (seconds) => `Tempo esgotado (${seconds}s) ou auditoria cancelada.`,
};

const en: Copy = {
  title: "Compliance auditor",
  product: "CloudSec / FinOps",
  env: "internal",
  scenario: "Architecture scenario",
  examples: "Examples",
  examplesHint: "Optional shortcuts. They only fill the field — the audit uses whatever you paste.",
  scenarioField: "Architecture description",
  scenarioHint:
    "Paste or describe the account: buckets, IAM, encryption, logging, tags. Examples below are optional.",
  scenarioPlaceholder:
    "Paste any architecture description — an S3 bucket, IAM users, a lifecycle rule, or whatever is on the diagram.",
  run: "Audit",
  running: "Auditing…",
  result: "Findings",
  status: "Status",
  risk: "Risk",
  latency: "Latency",
  summary: "Summary",
  finops: "FinOps impact",
  citations: "Cited clauses",
  remediation: "Remediation",
  rawJson: "Response JSON",
  corpus: "Loaded corpus",
  idleTitle: "Ready to audit",
  idleBody:
    "Paste any architecture description and run the audit. Examples are optional shortcuts.",
  loadingRetrieve: "Retrieving clauses from the corpus…",
  loadingModel: "Drafting the findings…",
  keyMissingTitle: "GEMINI_API_KEY missing on the server",
  keyMissingBody:
    "The app builds without the key; audits do not. Copy .env.example to .env.local and restart, or set the variable on the Vercel project.",
  errorTitle: "Audit failed",
  capacityTitle: "Model is busy",
  tooShort: "Minimum 12 characters.",
  geminiOk: "Gemini configured",
  geminiOff: "Gemini key missing",
  policiesLoading: "policies…",
  modelLoading: "model…",
  edited: "text edited",
  langLabel: "Language",
  unreachable: "Could not reach /api/v1/audit",
  errors: {
    MISSING_API_KEY:
      "GEMINI_API_KEY is missing. Set it in .env.local or on the Vercel project.",
    INVALID_REQUEST: "Invalid request. Describe the architecture in at least 12 characters.",
    UPSTREAM_MODEL: "The model did not finish the audit. Try again in a moment.",
    PARSE_ERROR: "The model response did not match the expected format. Try again.",
    INTERNAL: "Unexpected audit failure. Try again.",
    MODEL_UNAVAILABLE:
      "The model is under high demand right now. Try again in a few seconds.",
  },
  policiesCount: (n) => (n === 1 ? "1 policy" : `${n} policies`),
  chars: (n) => `${n} characters`,
  elapsed: (ms) => `${(ms / 1000).toFixed(1)} s`,
  httpNotJson: (status) => `Non-JSON response (HTTP ${status}).`,
  httpFailed: (status) => `HTTP ${status} failed`,
  timeout: (seconds) => `Timed out (${seconds}s) or the audit was cancelled.`,
};

const dictionaries: Record<Locale, Copy> = { en, pt };

export function getCopy(locale: Locale): Copy {
  return dictionaries[locale];
}

export function statusLabel(status: ComplianceStatus, locale: Locale): string {
  switch (status) {
    case "COMPLIANT":
      return locale === "pt" ? "CONFORME" : "COMPLIANT";
    case "WARNING":
      return locale === "pt" ? "ALERTA" : "WARNING";
    case "NON_COMPLIANT":
      return locale === "pt" ? "NÃO CONFORME" : "NON-COMPLIANT";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function riskLabel(risk: RiskLevel, locale: Locale): string {
  switch (risk) {
    case "LOW":
      return locale === "pt" ? "BAIXO" : "LOW";
    case "MEDIUM":
      return locale === "pt" ? "MÉDIO" : "MEDIUM";
    case "HIGH":
      return locale === "pt" ? "ALTO" : "HIGH";
    case "CRITICAL":
      return locale === "pt" ? "CRÍTICO" : "CRITICAL";
    default: {
      const _exhaustive: never = risk;
      return _exhaustive;
    }
  }
}

export function apiErrorMessage(code: ApiErrorCode, locale: Locale): string {
  return getCopy(locale).errors[code];
}

export { looksLikeUpstreamDump } from "@/lib/gemini/retry";
