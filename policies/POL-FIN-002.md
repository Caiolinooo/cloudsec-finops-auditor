# [POL-FIN-002] Mandatory cost allocation tags

- **Severity:** LOW
- **Framework:** FinOps 2.2
- **Domain:** FinOps / Governance

## Clause

All billable resources (S3 buckets, IAM-related workloads' compute, log
stores) MUST carry `finops:owner`, `finops:env`, and `finops:service` tags.
Untagged production storage is a WARNING even when technically secure.

## Remediation

1. Activate the cost allocation tags in the billing console
2. Enforce via SCP / tag policies
3. Include untagged spend in the weekly FinOps standup
