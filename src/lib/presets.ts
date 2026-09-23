export type ScenarioPreset = {
  id: string;
  label: string;
  blurb: string;
  architecture_scenario: string;
};

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "public-s3-acl",
    label: "Public S3 ACL on customer-data",
    blurb: "Open AllUsers READ on a regulated bucket — SOC 2 / POL-S3-001.",
    architecture_scenario:
      "Production AWS account hosts an S3 bucket named customer-data-prod that stores PCI cardholder exports and customer PII. Block Public Access is disabled on both the account and the bucket. The bucket ACL grants AllUsers READ. There is no bucket policy denying public s3:GetObject. Default encryption is SSE-S3 only. Server access logging is off. Versioning is disabled.",
  },
  {
    id: "iam-admin-keys",
    label: "IAM user with AdministratorAccess",
    blurb: "Standing admin plus long-lived keys — POL-IAM-005 / least privilege.",
    architecture_scenario:
      "Several human IAM users authenticate with long-lived access keys. Three developers have the AWS managed policy AdministratorAccess attached directly to their IAM users. MFA is not enforced for console login. The oldest admin access key was last rotated 140 days ago. Workloads in GitHub Actions also reuse a developer key instead of an OIDC role.",
  },
  {
    id: "glacier-lifecycle",
    label: "Missing Glacier lifecycle (FinOps)",
    blurb: "18 months of logs stuck on S3 Standard — POL-S3-002 / FinOps 4.2.",
    architecture_scenario:
      "The analytics-archive bucket keeps 18 months of raw clickstream and application logs in S3 Standard. Versioning is enabled, but there is no lifecycle configuration transitioning objects to Glacier or Deep Archive after 90 days. Monthly storage spend on that prefix is growing about 12%. The bucket is tagged env=prod but has no finops:owner tag. Access is private and Block Public Access is on.",
  },
];

export function getPreset(id: string): ScenarioPreset | undefined {
  return SCENARIO_PRESETS.find((preset) => preset.id === id);
}
