# CloudSec & FinOps Compliance Auditor — implementation tasks

High-level build checklist for the portfolio v1.

1. [x] Scaffold Next.js App Router + TypeScript + Tailwind
2. [x] Version CIS/SOC2/FinOps policies as `policies/*.md` (not a hardcoded blob)
3. [x] Shared Zod schemas (`AuditRequest`, `AuditResult`, typed envelope)
4. [x] Light hybrid RAG: BM25 + in-memory TF-IDF vectors + RRF
5. [x] Gemini structured JSON via Route Handlers (`/api/v1/audit`, `/api/health`)
6. [x] Security-console UI with 3 presets, metrics, citations, remediations, raw JSON
7. [x] Unit tests (retrieval + schema) and faithfulness eval (≥ 0.85) on real audit path
8. [x] GitHub Actions CI (lint/typecheck/unit; eval skips without `GEMINI_API_KEY`)
9. [x] README (mermaid, local/Vercel, CI, PT+EN blurb), `.env.example`, no secrets
