"use client";

import { useMemo, useState } from "react";
import { SCENARIO_PRESETS } from "@/lib/presets";
import {
  AuditEnvelopeSchema,
  ApiErrorSchema,
  type AuditEnvelope,
} from "@/lib/schemas";
import { riskTone, statusTone } from "@/lib/ui/status";

type UiState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "error"; message: string; code?: string }
  | { kind: "ok"; envelope: AuditEnvelope };

function toneClass(tone: string): string {
  switch (tone) {
    case "ok":
      return "tone-ok";
    case "warn":
      return "tone-warn";
    case "high":
      return "tone-high";
    case "crit":
      return "tone-crit";
    default:
      return "tone-idle";
  }
}

export function AuditorConsole() {
  const [presetId, setPresetId] = useState(SCENARIO_PRESETS[0].id);
  const [scenario, setScenario] = useState(SCENARIO_PRESETS[0].architecture_scenario);
  const [state, setState] = useState<UiState>({ kind: "idle" });

  const activePreset = useMemo(
    () => SCENARIO_PRESETS.find((preset) => preset.id === presetId),
    [presetId],
  );

  async function onAudit() {
    setState({ kind: "loading" });
    try {
      const response = await fetch("/api/v1/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ architecture_scenario: scenario }),
      });
      const payload: unknown = await response.json();

      if (!response.ok) {
        const err = ApiErrorSchema.safeParse(payload);
        setState({
          kind: "error",
          code: err.success ? err.data.code : undefined,
          message: err.success
            ? err.data.error
            : `Audit failed (${response.status})`,
        });
        return;
      }

      const envelope = AuditEnvelopeSchema.parse(payload);
      setState({ kind: "ok", envelope });
    } catch (error) {
      setState({
        kind: "error",
        message:
          error instanceof Error
            ? error.message
            : "Unable to reach /api/v1/audit",
      });
    }
  }

  function applyPreset(id: string) {
    const preset = SCENARIO_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setScenario(preset.architecture_scenario);
    setState({ kind: "idle" });
  }

  return (
    <div className="console">
      <header className="masthead">
        <div className="brand-block">
          <p className="eyebrow">Caiolinooo · portfolio / curriculum</p>
          <h1>
            CloudSec <span className="amp">&</span> FinOps
            <span className="title-sub">Compliance Auditor</span>
          </h1>
          <p className="lede">
            Hybrid RAG over versioned CIS / SOC 2 / FinOps clauses. Gemini
            returns a typed <code>AuditResult</code> — the browser never
            touches the model.
          </p>
        </div>
        <dl className="mast-meta">
          <div>
            <dt>API</dt>
            <dd>POST /api/v1/audit</dd>
          </div>
          <div>
            <dt>Retrieval</dt>
            <dd>BM25 + in-memory TF-IDF</dd>
          </div>
          <div>
            <dt>Model</dt>
            <dd>gemini-2.5-flash → 2.0-flash</dd>
          </div>
        </dl>
      </header>

      <div className="workspace">
        <section className="panel input-panel" aria-labelledby="scenario-heading">
          <div className="panel-head">
            <h2 id="scenario-heading">Architecture scenario</h2>
            <span className="chip">input</span>
          </div>

          <label className="field-label" htmlFor="preset">
            Preset scenarios
          </label>
          <div className="preset-grid" role="list">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                role="listitem"
                className={preset.id === presetId ? "preset active" : "preset"}
                onClick={() => applyPreset(preset.id)}
              >
                <span className="preset-label">{preset.label}</span>
                <span className="preset-blurb">{preset.blurb}</span>
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="scenario">
            Scenario text
          </label>
          <textarea
            id="scenario"
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            rows={12}
            spellCheck={false}
          />
          {activePreset ? (
            <p className="hint">Loaded preset: {activePreset.label}</p>
          ) : null}

          <div className="actions">
            <button
              type="button"
              className="run"
              onClick={onAudit}
              disabled={state.kind === "loading" || scenario.trim().length < 12}
            >
              {state.kind === "loading" ? "Auditing…" : "Run compliance audit"}
            </button>
            <p className="hint tight">
              Calls the Next.js route handler. Requires <code>GEMINI_API_KEY</code>{" "}
              only on the server.
            </p>
          </div>
        </section>

        <section className="panel result-panel" aria-labelledby="result-heading">
          <div className="panel-head">
            <h2 id="result-heading">Audit result</h2>
            <span className="chip">typed envelope</span>
          </div>

          {state.kind === "idle" ? (
            <p className="empty">
              Select a preset and run the auditor. Findings, citations, and
              FinOps impact will land here.
            </p>
          ) : null}

          {state.kind === "loading" ? (
            <p className="empty pulse">Retrieving clauses and requesting structured JSON…</p>
          ) : null}

          {state.kind === "error" ? (
            <div
              className={
                state.code === "MISSING_API_KEY" ? "banner warn" : "banner crit"
              }
              role="alert"
            >
              <strong>
                {state.code === "MISSING_API_KEY"
                  ? "GEMINI_API_KEY missing"
                  : "Audit error"}
              </strong>
              <p>{state.message}</p>
              {state.code === "MISSING_API_KEY" ? (
                <p className="banner-help">
                  Copy <code>.env.example</code> to <code>.env.local</code> and
                  restart <code>npm run dev</code>, or set the variable on the
                  Vercel project.
                </p>
              ) : null}
            </div>
          ) : null}

          {state.kind === "ok" ? (
            <AuditView envelope={state.envelope} />
          ) : null}
        </section>
      </div>
    </div>
  );
}

function AuditView({ envelope }: { envelope: AuditEnvelope }) {
  const { audit, latency_ms } = envelope;

  return (
    <div className="result">
      <div className="metrics">
        <article className={`metric ${toneClass(statusTone(audit.compliance_status))}`}>
          <h3>Status</h3>
          <p>{audit.compliance_status.replaceAll("_", " ")}</p>
        </article>
        <article className={`metric ${toneClass(riskTone(audit.risk_level))}`}>
          <h3>Risk</h3>
          <p>{audit.risk_level}</p>
        </article>
        <article className="metric tone-idle">
          <h3>Latency</h3>
          <p>
            {latency_ms}
            <span className="unit">ms</span>
          </p>
        </article>
      </div>

      <article className="block">
        <h3>Executive summary</h3>
        <p>{audit.summary}</p>
      </article>

      <article className="block">
        <h3>FinOps / cost impact</h3>
        <p>{audit.estimated_cost_impact}</p>
      </article>

      <article className="block">
        <h3>Cited policies</h3>
        <ul className="cite-list">
          {audit.cited_policies.map((citation) => (
            <li key={citation}>{citation}</li>
          ))}
        </ul>
      </article>

      <article className="block">
        <h3>Remediation</h3>
        <ol className="steps">
          {audit.remediation_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      <details className="json-exp">
        <summary>Raw JSON envelope</summary>
        <pre>
          <code>{JSON.stringify(envelope, null, 2)}</code>
        </pre>
      </details>
    </div>
  );
}
