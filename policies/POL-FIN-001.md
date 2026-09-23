# [POL-FIN-001] Storage class and idle spend controls

- **Severity:** MEDIUM
- **Framework:** FinOps 4.1 / 4.2
- **Domain:** FinOps / S3 / Compute

## Clause

Teams MUST classify data as hot, warm, or cold and map it to an S3 storage
class. Idle spend signals include:

- Objects in S3 Standard with no GET for 90+ days (pair with [POL-S3-002])
- Unattached EBS volumes and unused Elastic IPs
- Over-provisioned RDS / EC2 without rightsizing review

Monthly unit-cost reports are required for any bucket growing faster than 10%.

## Remediation

1. Enable Cost Explorer + Storage Lens
2. Apply lifecycle transitions and Intelligent-Tiering where access is unknown
3. Tag owners (`finops:owner`) and expire orphaned snapshots
