# [POL-IAM-003] Access key rotation within 90 days

- **Severity:** MEDIUM
- **Framework:** CIS AWS 1.14 · FinOps / hygiene
- **Domain:** IAM / Credentials

## Clause

IAM user access keys MUST be rotated at least every **90 days**. Keys unused
for 45 days MUST be deactivated. Workloads SHOULD not use user keys at all
(prefer instance/task roles).

Standing admin keys older than 90 days escalate [POL-IAM-005] to CRITICAL.

## Remediation

1. Generate a replacement key, update secrets, then retire the old key
2. Alert on Credential Report `access_key_1_last_rotated`
3. Migrate CI to OIDC federation (GitHub Actions → IAM role)
