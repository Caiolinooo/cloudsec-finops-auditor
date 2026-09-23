export type ScenarioPreset = {
  id: string;
  label: string;
  blurb: string;
  architecture_scenario: string;
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "public-s3-acl",
    label: "S3 público em dado de cliente",
    blurb: "ACL AllUsers + Block Public Access off — POL-S3-001.",
    architecture_scenario:
      "Conta AWS de produção com o bucket S3 customer-data-prod guardando exportes PCI e PII de cliente. Block Public Access está desligado na conta e no bucket. A ACL do bucket concede READ para AllUsers. Não há bucket policy negando s3:GetObject público. Criptografia default é só SSE-S3. Server access logging desligado. Versionamento desligado.",
  },
  {
    id: "iam-admin-keys",
    label: "IAM user com AdministratorAccess",
    blurb: "Admin permanente + access key velha — POL-IAM-005.",
    architecture_scenario:
      "Vários usuários IAM humanos autenticam com access keys de longa duração. Três desenvolvedores têm a managed policy AdministratorAccess colada direto no usuário. MFA não é exigido no console. A access key de admin mais antiga foi rotacionada há 140 dias. O GitHub Actions da conta reutiliza a key de um desenvolvedor em vez de role OIDC.",
  },
  {
    id: "glacier-lifecycle",
    label: "Sem lifecycle para Glacier",
    blurb: "18 meses de log em S3 Standard — POL-S3-002 / FinOps 4.2.",
    architecture_scenario:
      "O bucket analytics-archive guarda 18 meses de clickstream e logs de aplicação em S3 Standard. Versionamento está ligado, mas não existe lifecycle passando objetos para Glacier ou Deep Archive depois de 90 dias. O gasto mensal nesse prefixo cresce uns 12%. O bucket tem tag env=prod e não tem finops:owner. Acesso é privado e Block Public Access está ligado.",
  },
  {
    id: "baseline-ok",
    label: "Baseline aparentemente conforme",
    blurb: "BPA, KMS, lifecycle, SSO — deve sair CONFORME ou ALERTA leve.",
    architecture_scenario:
      "Bucket customer-data-prod com Block Public Access nas quatro flags, sem ACL pública, default encryption SSE-KMS numa CMK com rotação anual e S3 Bucket Key. Versionamento ligado, MFA Delete ligado, lifecycle transicionando para Glacier aos 90 dias. Access logging vai para um bucket de log na conta de segurança. Humanos entram por IAM Identity Center; ninguém tem AdministratorAccess no usuário. MFA obrigatório. Keys de workload são role + OIDC. Tags finops:owner, finops:env, finops:service preenchidas. Organization trail multi-região ativo.",
  },
  {
    id: "higiene-warning",
    label: "Seguro, higiene FinOps fraca",
    blurb: "Privado e com KMS, mas sem tag/lifecycle/logging.",
    architecture_scenario:
      "Bucket analytics-raw é privado, Block Public Access ligado, criptografia SSE-KMS. Não é público. Versionamento ligado. Não há lifecycle para Glacier, não há server access logging, e as tags finops:owner / finops:service estão vazias. IAM dos analistas é permission set de leitura, sem AdministratorAccess. Sem access keys humanas. O time reclama que a fatura de Standard sobe todo mês.",
  },
  {
    id: "misto-s3-iam",
    label: "S3 aberto + admin IAM",
    blurb: "Dois findings graves no mesmo cenário.",
    architecture_scenario:
      "Mesma conta: customer-data-prod com ACL AllUsers READ e Block Public Access desabilitado, mais dois IAM users com AdministratorAccess e access keys de 11 meses. MFA off no console. Sem CloudTrail organizacional. Criptografia SSE-S3. Sem lifecycle. Time usa NAT único sem VPC endpoint de S3 e a linha DataTransfer passa de 20% da fatura, sem owner.",
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
