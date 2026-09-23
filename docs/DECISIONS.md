# Decisões

## ADR 1 — Next.js na Vercel, não Streamlit

**Contexto.** Precisávamos de um console e de uma API no mesmo deploy.

**Decisão.** App Router (Next.js) na Vercel. UI e `POST /api/v1/audit`
no mesmo projeto. Sem FastAPI ao lado e sem Streamlit no caminho
principal.

**Porquê.** Um runtime, um preview, uma variável de ambiente. Streamlit
serve para notebook interno; aqui o browser só fala com a route
handler. Python fica nos evals (`evals/deepeval_faithfulness.py`), não
no request path.

## ADR 2 — Chave só no servidor

**Contexto.** Gemini precisa de `GEMINI_API_KEY`.

**Decisão.** A chave vive em `.env.local` / variáveis da Vercel. O
cliente nunca a vê. `GET /api/health` só expõe `gemini_configured`.

**Porquê.** Qualquer JS no browser vaza. O build sobe sem a chave; a
auditoria é que falha com `MISSING_API_KEY`.

## ADR 3 — RAG híbrido in-process

**Contexto.** Corpus pequeno (`policies/*.md`). Qdrant na nuvem seria
outro serviço, outra conta, outra fatura.

**Decisão.** BM25 + TF-IDF hasheado + Reciprocal Rank Fusion, tudo em
memória no processo Node. `scoreDense()` é o gancho para um vector
store depois.

**Porquê.** O retriever precisa de acertar `POL-S3-001` num bucket
público sem round-trip. Quando o corpus passar de “cabe na memória”,
o envelope `{ latency_ms, audit }` continua igual.

## ADR 4 — Evals no CI, skip sem chave

**Contexto.** Citação inventada queima o parecer. Faithfulness ≥ 0.85
é o piso.

**Decisão.** Job `eval` no Actions. Sem secret `GEMINI_API_KEY`, o job
só registra o skip. Unitários (retrieval + schema) sempre correm.

**Porquê.** Score fabricado no CI pior do que skip explícito. O gate
ao vivo só existe quando há modelo de verdade.

## ADR 5 — Flash 3.8 com fallback 3.6

**Contexto.** IDs de modelo mudam. Capacidade do Flash oscila (503 /
`UNAVAILABLE`).

**Decisão.** Default `gemini-3.8-flash`, fallback `gemini-3.6-flash`
(Flash já estável neste deploy). Retry curto no mesmo modelo, depois
troca. `GEMINI_MODEL` / `GEMINI_FALLBACK_MODEL` aceitam override —
incluindo `gemini-3.1-pro-preview` se alguém quiser Pro. Pro não é o
default.

**Porquê.** O caminho quente precisa de Flash. Pro fica opt-in.
