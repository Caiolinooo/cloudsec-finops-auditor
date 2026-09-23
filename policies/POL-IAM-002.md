# [POL-IAM-002] Sem access keys na conta root

- **Severity:** CRITICAL
- **Framework:** CIS AWS 1.4 · SOC 2 CC6.1
- **Domain:** IAM / Root

## Clause

A conta root NÃO pode ter access keys ativas. Uso do root fica restrito a
tarefas que a AWS exige (alterar e-mail, fechar conta, alterar suporte).
Qualquer key `AKIA…` no root é finding CRITICAL, independente de escopo.

## Remediation

1. Desativar e apagar keys do root no IAM Credential Report
2. Guardar MFA hardware do root em cofre, com 4-olhos
3. Alertar `CreateAccessKey` quando `userName` for root
