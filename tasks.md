# Tarefas

Fora de propósito (v1): Qdrant, auth, Streamlit, multi-tenant.

Se for usar de verdade:

- secret `GEMINI_API_KEY` no Actions (senão o job de eval só faz skip)
- embeddings de verdade + Qdrant quando o corpus passar de “cabe na memória”

## Neste recorte

- [x] Console: textarea vazio primeiro; exemplos como chips
- [x] Gemini: retry 503/429/UNAVAILABLE + fallback 3.8 → 3.6
- [x] EN | PT no topbar, persistência, locale no prompt
- [x] Docs de produto (ARCHITECTURE, DECISIONS, SECURITY) + README
