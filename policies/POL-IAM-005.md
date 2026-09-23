# [POL-IAM-005] No direct AdministratorAccess on IAM users

- **Severity:** HIGH
- **Framework:** CIS AWS 1.16 · SOC 2 CC6.1 · least privilege
- **Domain:** IAM / Identity

## Clause

IAM **users** MUST NOT have the AWS managed policy `AdministratorAccess`
attached directly. Break-glass administration is allowed only via:

- A dedicated role assumed through IAM Identity Center (SSO) or a
  time-bound `sts:AssumeRole` with MFA
- A recorded change ticket and 4-eye approval

Long-lived access keys on users that also carry `AdministratorAccess` are an
automatic **HIGH** (treat as **CRITICAL** if keys are older than 90 days).

## Rationale

Standing admin on a user principal expands blast radius after key leakage.
Least privilege requires permission boundaries and role assumption, not
direct `AdministratorAccess` on human or CI users.

## Remediation

1. Detach `arn:aws:iam::aws:policy/AdministratorAccess` from every IAM user
2. Move humans to Identity Center permission sets with job-function policies
3. Replace user access keys with roles for workloads
4. Enable IAM Access Analyzer unused-access findings and MFA on the break-glass role

## Evidence

`iam:ListAttachedUserPolicies`, Credential Report, CloudTrail `AttachUserPolicy`.
