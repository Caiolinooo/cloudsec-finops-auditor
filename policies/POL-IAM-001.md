# [POL-IAM-001] MFA required for console and privileged roles

- **Severity:** HIGH
- **Framework:** CIS AWS 1.5 / 1.10 · SOC 2 CC6.1
- **Domain:** IAM / Authentication

## Clause

Every IAM user with console password and every role that can administer
IAM, billing, or production data MUST require MFA. Privileged
`sts:AssumeRole` trust policies MUST include
`aws:MultiFactorAuthPresent = true`.

## Remediation

1. Enforce MFA in the Identity Center permission set or IAM user policy
2. Block `iam:CreateAccessKey` for users without MFA
3. Review the Credential Report monthly for `mfa_active = false`
