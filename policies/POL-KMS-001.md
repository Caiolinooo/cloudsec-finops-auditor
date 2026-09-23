# [POL-KMS-001] Rotação anual de CMK de dados de cliente

- **Severity:** MEDIUM
- **Framework:** SOC 2 CC6.7 · CIS AWS 3.8
- **Domain:** KMS / Crypto

## Clause

CMKs que protegem buckets `customer-data*` ou backups regulamentados
DEVEM ter rotação automática anual. SSE-S3 não conta como CMK — ver
[POL-S3-003]. Chave AWS-managed (`aws/s3`) em dado regulado é WARNING
se o resto estiver certo; HIGH se o bucket também for público.

## Remediation

1. `EnableKeyRotation` na CMK de dados
2. Trocar default encryption do bucket para essa CMK
3. Revisar grants órfãos depois de offboarding
