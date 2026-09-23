# Hardening de POST /api/v1/audit

1. Limitar `architecture_scenario` (Zod + UI).
2. Rate limit + teto de corpo no route handler.
3. Token opcional `AUDIT_ACCESS_TOKEN` (não quebra o console se ausente).
4. Evitar alocação O(n) em `charNgrams`.
5. Não vazar `Error.message` cru para o cliente.
6. Testes de schema/limites + `npm test` / typecheck.
