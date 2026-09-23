# Arquitetura

O console descreve um cenário de arquitetura. O servidor recupera cláusulas
do corpus e pede um parecer estruturado ao Gemini. O browser nunca fala
com o modelo.

```
UI (AuditorConsole)
  POST /api/v1/audit  { architecture_scenario, locale? }
        │
        ▼
Route handler (Node, App Router)
        │
        ├─ Zod: AuditRequest
        ├─ RAG in-process
        │    BM25 (léxico)
        │    TF-IDF hasheado (denso local, 384 dims)
        │    Reciprocal Rank Fusion (k = 60)
        │    policies/*.md → top 6 chunks
        ├─ Prompt + locale (EN ou PT-BR)
        ├─ Gemini structured JSON
        │    primary  gemini-3.8-flash
        │    fallback gemini-3.6-flash
        │    retry em 429 / 503 / UNAVAILABLE / RESOURCE_EXHAUSTED
        └─ Zod: AuditResult → { latency_ms, audit }
```

## UI

`src/components/AuditorConsole.tsx` é a única tela. O caminho principal é
um textarea vazio: colar ou descrever a conta e clicar **Auditar**.
Os chips de **Exemplos** só preenchem o campo. O toggle EN | PT vive no
topbar e grava a preferência em `localStorage`.

`POST /api/v1/audit` leva `architecture_scenario` (mín. 12 caracteres) e
`locale` opcional. Sem locale, o servidor assume `en`.

## API

| Rota | Uso |
| --- | --- |
| `POST /api/v1/audit` | Corre a auditoria |
| `GET /api/health` | `gemini_configured`, `policy_count`, IDs dos modelos |
| `GET /api/v1/health` | Alias do health |
| `GET /api/v1/policies` | Catálogo do corpus |

Erros saem como `{ error, code }`. Códigos: `INVALID_REQUEST`,
`MISSING_API_KEY`, `MODEL_UNAVAILABLE`, `UPSTREAM_MODEL`, `PARSE_ERROR`,
`INTERNAL`. A mensagem segue o `locale` do pedido. JSON cru do Gemini
não vai para o cliente.

## RAG

`src/lib/rag/` carrega `policies/*.md` uma vez por processo, fatia por
heading e indexa em memória.

1. **BM25** — tokens do cenário contra o texto das cláusulas.
2. **Denso local** — TF-IDF de tokens + char-trigrams, projetado num
   vetor de 384 dimensões (`src/lib/rag/embeddings.ts`). Não é um
   embedding de API.
3. **RRF** — funde as duas listas (`1 / (60 + rank)`), devolve k = 6.

O denso existe para o dia em que o corpus crescer: a função
`scoreDense()` é o ponto de troca para um `qdrant.search`. O contrato
da API não muda.

## Gemini

`src/lib/gemini/client.ts` chama `generateContent` com
`responseMimeType: application/json` e `responseSchema`. Zod valida de
novo no servidor. Sem chave, `MISSING_API_KEY` — o build não exige
`GEMINI_API_KEY`.

Falha transitória no primário (503, 429, `UNAVAILABLE`,
`RESOURCE_EXHAUSTED`): até 3 tentativas com backoff curto, depois o
modelo de fallback. Sem parecer inventado.

O prompt pede o parecer no idioma da UI. IDs de política ficam iguais.

## Faithfulness

`src/lib/audit/faithfulness.ts` pontua citações contra os chunks
recuperados. O job de eval no Actions só corre com `GEMINI_API_KEY`;
sem chave, skip — score inventado não entra no repo.
