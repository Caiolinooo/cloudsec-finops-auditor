# [POL-LOG-001] CloudTrail organizacional, multi-região

- **Severity:** HIGH
- **Framework:** CIS AWS 3.1 / 3.2 · SOC 2 CC7.1
- **Domain:** Logging / Detect

## Clause

A organização DEVE ter um trail organizacional multi-região, com
validação de arquivo e destino num bucket dedicado (conta de log,
Block Public Access, SSE-KMS). Conta de aplicação sem trail local
e sem trail org é finding HIGH.

CloudTrail desligado “pra economizar” viola FinOps só na aparência:
o custo do trail é menor que o custo de um incidente sem forense.

## Remediation

1. Criar organization trail (`IsOrganizationTrail = true`, `IsMultiRegionTrail = true`)
2. Ligar log file validation
3. Destino: bucket na conta de segurança, lifecycle para Glacier em 90 dias
