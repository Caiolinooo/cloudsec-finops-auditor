# Segurança

## O que o app faz

- Aceita um texto de cenário de arquitetura.
- Recupera cláusulas de `policies/*.md` no processo do servidor.
- Chama Gemini no route handler e devolve `{ latency_ms, audit }`.

Não liga em contas AWS, GCP ou Azure. Não lê CloudTrail, Config ou
Security Hub. Não é um scanner. O parecer vale o que o texto colado
e o corpus local aguentam.

## O que o app não faz

- Sem autenticação de usuário no console público.
- Sem isolamento multi-tenant.
- Sem varredura live de cloud.
- Sem persistência do cenário — o texto vive no request.

Não cole segredos, keys ou dumps reais de conta se o deploy for
público. Trate o textarea como um campo que o servidor vai ler e
encaminhar ao modelo.

## Segredos

`GEMINI_API_KEY` é só de servidor. Não entra em bundle, cookie ou
`GET /api/health`. O health responde `gemini_configured: true|false`.
Overrides de modelo (`GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL`) também
ficam no ambiente.

## Ameaças

| Nota | Detalhe |
| --- | --- |
| Proxy público ao Gemini | Qualquer cliente que alcance `POST /api/v1/audit` gasta a cota da chave. Rate limit e token opcional não estão neste recorte. |
| Prompt injection | O cenário vai no prompt. O modelo deve citar só cláusulas recuperadas; o gate de faithfulness pega ID inventado, não injeta defesa no request. |
| Dados no texto | PII ou credencial colada no cenário chega ao provedor do modelo. |
| Modelo indisponível | 503 / `UNAVAILABLE` / 429 disparam retry e fallback. A API devolve `MODEL_UNAVAILABLE` — sem parecer falso. |
| Superfície de erro | Respostas de falha usam código + frase localizada. JSON cru do Google não deve vazar no UI. |

## Deploy

Vercel, runtime Node nas rotas. Variáveis em **Settings → Environment
Variables**, Production e Preview. Sem a chave, o console sobe e a
auditoria recusa com `MISSING_API_KEY`.
