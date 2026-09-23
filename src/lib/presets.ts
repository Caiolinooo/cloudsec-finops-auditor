import type { Locale } from "@/lib/i18n";

export type ScenarioPreset = {
  id: string;
  label: Record<Locale, string>;
  blurb: Record<Locale, string>;
  architecture_scenario: Record<Locale, string>;
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "public-s3-acl",
    label: {
      pt: "S3 público em dado de cliente",
      en: "Public S3 on customer data",
    },
    blurb: {
      pt: "ACL AllUsers + Block Public Access off — POL-S3-001.",
      en: "AllUsers ACL + Block Public Access off — POL-S3-001.",
    },
    architecture_scenario: {
      pt: "Conta AWS de produção com o bucket S3 customer-data-prod guardando exportações PCI e PII de cliente. Block Public Access está desligado na conta e no bucket. A ACL do bucket concede READ para AllUsers. Não há bucket policy negando s3:GetObject público. Criptografia default é só SSE-S3. Server access logging desligado. Versionamento desligado.",
      en: "Production AWS account with S3 bucket customer-data-prod holding PCI and customer PII exports. Block Public Access is off at the account and the bucket. The bucket ACL grants READ to AllUsers. There is no bucket policy denying public s3:GetObject. Default encryption is SSE-S3 only. Server access logging is off. Versioning is off.",
    },
  },
  {
    id: "iam-admin-keys",
    label: {
      pt: "IAM user com AdministratorAccess",
      en: "IAM user with AdministratorAccess",
    },
    blurb: {
      pt: "Admin permanente e access key antiga — POL-IAM-005.",
      en: "Standing admin and a stale access key — POL-IAM-005.",
    },
    architecture_scenario: {
      pt: "Vários usuários IAM humanos autenticam com access keys de longa duração. Três desenvolvedores têm a managed policy AdministratorAccess colada direto no usuário. MFA não é exigido no console. A access key de admin mais antiga foi rotacionada há 140 dias. O GitHub Actions da conta reutiliza a key de um desenvolvedor em vez de role OIDC.",
      en: "Several human IAM users authenticate with long-lived access keys. Three developers have the AdministratorAccess managed policy attached directly to the user. MFA is not required on the console. The oldest admin access key was last rotated 140 days ago. The account's GitHub Actions reuses a developer's key instead of an OIDC role.",
    },
  },
  {
    id: "glacier-lifecycle",
    label: {
      pt: "Sem lifecycle para Glacier",
      en: "No Glacier lifecycle",
    },
    blurb: {
      pt: "18 meses de log em S3 Standard — POL-S3-002 / FinOps 4.2.",
      en: "18 months of logs on S3 Standard — POL-S3-002 / FinOps 4.2.",
    },
    architecture_scenario: {
      pt: "O bucket analytics-archive guarda 18 meses de clickstream e logs de aplicação em S3 Standard. Versionamento está ligado, mas não existe lifecycle passando objetos para Glacier ou Deep Archive depois de 90 dias. O gasto mensal nesse prefixo cresce uns 12%. O bucket tem tag env=prod e não tem finops:owner. Acesso é privado e Block Public Access está ligado.",
      en: "The analytics-archive bucket keeps 18 months of clickstream and application logs on S3 Standard. Versioning is on, but there is no lifecycle moving objects to Glacier or Deep Archive after 90 days. Monthly spend on that prefix grows about 12%. The bucket is tagged env=prod and has no finops:owner. Access is private and Block Public Access is on.",
    },
  },
  {
    id: "baseline-ok",
    label: {
      pt: "Baseline aparentemente conforme",
      en: "Apparently compliant baseline",
    },
    blurb: {
      pt: "BPA, KMS, lifecycle e SSO no baseline.",
      en: "BPA, KMS, lifecycle, and SSO on the baseline.",
    },
    architecture_scenario: {
      pt: "Bucket customer-data-prod com Block Public Access nas quatro flags, sem ACL pública, default encryption SSE-KMS numa CMK com rotação anual e S3 Bucket Key. Versionamento ligado, MFA Delete ligado, lifecycle transicionando para Glacier aos 90 dias. Access logging vai para um bucket de log na conta de segurança. Humanos entram por IAM Identity Center; ninguém tem AdministratorAccess no usuário. MFA obrigatório. Keys de workload são role + OIDC. Tags finops:owner, finops:env, finops:service preenchidas. Organization trail multi-região ativo.",
      en: "Bucket customer-data-prod has all four Block Public Access flags, no public ACL, default encryption SSE-KMS on a CMK with annual rotation and S3 Bucket Key. Versioning on, MFA Delete on, lifecycle transitioning to Glacier at 90 days. Access logging goes to a log bucket in the security account. Humans sign in through IAM Identity Center; nobody has AdministratorAccess on the user. MFA required. Workload keys are role + OIDC. Tags finops:owner, finops:env, finops:service are set. Multi-region organization trail is active.",
    },
  },
  {
    id: "higiene-warning",
    label: {
      pt: "Seguro, higiene FinOps fraca",
      en: "Secure, weak FinOps hygiene",
    },
    blurb: {
      pt: "Privado e com KMS, mas sem tag/lifecycle/logging.",
      en: "Private with KMS, but no tags, lifecycle, or logging.",
    },
    architecture_scenario: {
      pt: "Bucket analytics-raw é privado, Block Public Access ligado, criptografia SSE-KMS. Não é público. Versionamento ligado. Não há lifecycle para Glacier, não há server access logging, e as tags finops:owner / finops:service estão vazias. IAM dos analistas é permission set de leitura, sem AdministratorAccess. Sem access keys humanas. O time reclama que a fatura de Standard sobe todo mês.",
      en: "Bucket analytics-raw is private, Block Public Access on, SSE-KMS encryption. It is not public. Versioning is on. There is no Glacier lifecycle, no server access logging, and finops:owner / finops:service tags are empty. Analysts use a read-only permission set, no AdministratorAccess. No human access keys. The team complains that Standard spend rises every month.",
    },
  },
  {
    id: "misto-s3-iam",
    label: {
      pt: "S3 aberto + admin IAM",
      en: "Open S3 + IAM admin",
    },
    blurb: {
      pt: "ACL pública e AdministratorAccess na mesma conta.",
      en: "Public ACL and AdministratorAccess in the same account.",
    },
    architecture_scenario: {
      pt: "Mesma conta: customer-data-prod com ACL AllUsers READ e Block Public Access desabilitado, mais dois IAM users com AdministratorAccess e access keys de 11 meses. MFA off no console. Sem CloudTrail organizacional. Criptografia SSE-S3. Sem lifecycle. Time usa NAT único sem VPC endpoint de S3 e a linha DataTransfer passa de 20% da fatura, sem owner.",
      en: "Same account: customer-data-prod with AllUsers READ ACL and Block Public Access disabled, plus two IAM users with AdministratorAccess and 11-month-old access keys. MFA off on the console. No organization CloudTrail. SSE-S3 encryption. No lifecycle. The team uses a single NAT without an S3 VPC endpoint and DataTransfer is over 20% of the bill, with no owner.",
    },
  },
];

export function getPreset(id: string): ScenarioPreset | undefined {
  return SCENARIO_PRESETS.find((preset) => preset.id === id);
}

export const CORE_PRESET_IDS = [
  "public-s3-acl",
  "iam-admin-keys",
  "glacier-lifecycle",
] as const;
