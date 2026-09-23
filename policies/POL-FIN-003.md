# [POL-FIN-003] Transferência de dados e NAT sem dono

- **Severity:** MEDIUM
- **Framework:** FinOps 4.3
- **Domain:** FinOps / Rede

## Clause

NAT Gateway único por VPC “porque é mais simples”, VPC endpoints
ausentes para S3/Dynamo, e Cross-AZ traffic sem revisão mensal são
desperdício FinOps. Qualquer linha de `DataTransfer` > 15% da fatura
sem `finops:owner` é WARNING. Não é finding de segurança sozinho,
mas entra no parecer quando o cenário fala de custo ou de logs
saindo de S3 Standard sem lifecycle ([POL-S3-002], [POL-FIN-001]).

## Remediation

1. Gateway endpoints para S3 e Dynamo na VPC de dados
2. Medir NAT por AZ; apagar NAT ocioso
3. Tag de owner em IGW/NAT e review no standup FinOps
