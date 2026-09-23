"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { copy, riskLabel, statusLabel } from "@/lib/copy";
import { SCENARIO_PRESETS } from "@/lib/presets";
import {
  ApiErrorSchema,
  AuditEnvelopeSchema,
  HealthSchema,
  PolicyCatalogSchema,
  type AuditEnvelope,
  type Health,
  type PolicyCatalog,
} from "@/lib/schemas";
import { riskTone, statusTone, toneClass } from "@/lib/ui/status";

type UiState =
  | { kind: "idle" }
  | { kind: "loading"; startedAt: number }
  | { kind: "error"; message: string; code?: string }
  | { kind: "ok"; envelope: AuditEnvelope };

const AUDIT_TIMEOUT_MS = 45_000;

export function AuditorConsole() {
  const [presetId, setPresetId] = useState(SCENARIO_PRESETS[0].id);
  const [scenario, setScenario] = useState(
    SCENARIO_PRESETS[0].architecture_scenario,
  );
  const [state, setState] = useState<UiState>({ kind: "idle" });
  const [elapsedMs, setElapsedMs] = useState(0);
  const [health, setHealth] = useState<Health | null>(null);
  const [catalog, setCatalog] = useState<PolicyCatalog | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const [healthRes, catalogRes] = await Promise.all([
          fetch("/api/health"),
          fetch("/api/v1/policies"),
        ]);
        const healthJson: unknown = await healthRes.json();
        const catalogJson: unknown = await catalogRes.json();
        const parsedHealth = HealthSchema.safeParse(healthJson);
        const parsedCatalog = PolicyCatalogSchema.safeParse(catalogJson);
        if (cancelled) return;
        if (parsedHealth.success) setHealth(parsedHealth.data);
        if (parsedCatalog.success) setCatalog(parsedCatalog.data);
      } catch {
        if (!cancelled) setHealth(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (state.kind !== "loading") return;
    const startedAt = state.startedAt;
    const timer = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 100);
    return () => window.clearInterval(timer);
  }, [state]);

  const customised = useMemo(() => {
    const preset = SCENARIO_PRESETS.find((item) => item.id === presetId);
    return Boolean(preset && preset.architecture_scenario !== scenario);
  }, [presetId, scenario]);

  async function onAudit() {
    if (scenario.trim().length < 12) return;
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timeout = window.setTimeout(() => controller.abort(), AUDIT_TIMEOUT_MS);
    setElapsedMs(0);
    setState({ kind: "loading", startedAt: Date.now() });

    try {
      const response = await fetch("/api/v1/audit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ architecture_scenario: scenario }),
        signal: controller.signal,
      });

      const raw = await response.text();
      let payload: unknown;
      try {
        payload = JSON.parse(raw);
      } catch {
        setState({
          kind: "error",
          message: copy.httpNotJson(response.status),
        });
        return;
      }

      if (!response.ok) {
        const err = ApiErrorSchema.safeParse(payload);
        setState({
          kind: "error",
          code: err.success ? err.data.code : undefined,
          message: err.success
            ? err.data.error
            : copy.httpFailed(response.status),
        });
        return;
      }

      setState({ kind: "ok", envelope: AuditEnvelopeSchema.parse(payload) });
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") {
        setState({
          kind: "error",
          message: copy.timeout(AUDIT_TIMEOUT_MS / 1000),
        });
        return;
      }
      setState({
        kind: "error",
        message:
          error instanceof Error ? error.message : copy.unreachable,
      });
    } finally {
      window.clearTimeout(timeout);
    }
  }

  function applyPreset(id: string) {
    const preset = SCENARIO_PRESETS.find((item) => item.id === id);
    if (!preset) return;
    setPresetId(id);
    setScenario(preset.architecture_scenario);
    setState({ kind: "idle" });
  }

  const tooShort = scenario.trim().length < 12;
  const policyCount = catalog?.count ?? health?.policy_count;

  return (
    <div className="console">
      <header className="topbar">
        <div>
          <p className="kicker">
            {copy.product} · {copy.env}
          </p>
          <h1>{copy.title}</h1>
        </div>
        <ul className="status-pills">
          <li>
            {policyCount === undefined
              ? copy.policiesLoading
              : copy.policiesCount(policyCount)}
          </li>
          <li className={health?.gemini_configured ? "ok" : "off"}>
            {health
              ? health.gemini_configured
                ? copy.geminiOk
                : copy.geminiOff
              : copy.modelLoading}
          </li>
        </ul>
      </header>

      {health && !health.gemini_configured ? (
        <div className="banner warn" role="status">
          <strong>{copy.keyMissingTitle}</strong>
          <p>{copy.keyMissingBody}</p>
        </div>
      ) : null}

      <div className="workspace">
        <section className="panel" aria-labelledby="scenario-heading">
          <div className="panel-head">
            <h2 id="scenario-heading">{copy.scenario}</h2>
          </div>

          <p className="field-label">{copy.presets}</p>
          <div className="preset-grid">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                className={preset.id === presetId ? "preset active" : "preset"}
                onClick={() => applyPreset(preset.id)}
              >
                <span className="preset-label">{preset.label}</span>
                <span className="preset-blurb">{preset.blurb}</span>
              </button>
            ))}
          </div>

          <label className="field-label" htmlFor="scenario">
            {copy.scenarioField}
          </label>
          <textarea
            id="scenario"
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
            rows={11}
            spellCheck={false}
          />
          <p className="meta-row">
            <span>{copy.chars(scenario.trim().length)}</span>
            {customised ? <span>{copy.edited}</span> : null}
            {tooShort ? <span className="warn-text">{copy.tooShort}</span> : null}
          </p>

          <div className="actions">
            <button
              type="button"
              className="run"
              onClick={onAudit}
              disabled={state.kind === "loading" || tooShort}
            >
              {state.kind === "loading"
                ? `${copy.running} ${copy.elapsed(elapsedMs)}`
                : copy.run}
            </button>
          </div>

          {catalog ? (
            <details className="corpus">
              <summary>
                {copy.corpus} ({catalog.count})
              </summary>
              <ul>
                {catalog.policies.map((policy) => (
                  <li key={policy.id}>
                    <code>{policy.id}</code>
                    <span>
                      {policy.severity} · {policy.domain}
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          ) : null}
        </section>

        <section className="panel" aria-labelledby="result-heading">
          <div className="panel-head">
            <h2 id="result-heading">{copy.result}</h2>
            {state.kind === "loading" ? (
              <span className="chip">{copy.elapsed(elapsedMs)}</span>
            ) : null}
          </div>

          {state.kind === "idle" ? (
            <div className="empty">
              <p className="empty-title">{copy.idleTitle}</p>
              <p>{copy.idleBody}</p>
              <div className="metrics muted">
                <article className={`metric ${toneClass("idle")}`}>
                  <h3>{copy.status}</h3>
                  <p>—</p>
                </article>
                <article className={`metric ${toneClass("idle")}`}>
                  <h3>{copy.risk}</h3>
                  <p>—</p>
                </article>
                <article className={`metric ${toneClass("idle")}`}>
                  <h3>{copy.latency}</h3>
                  <p>—</p>
                </article>
              </div>
            </div>
          ) : null}

          {state.kind === "loading" ? (
            <div className="empty">
              <p className="empty-title pulse">
                {elapsedMs < 900 ? copy.loadingRetrieve : copy.loadingModel}
              </p>
              <div className="skel-stack" aria-hidden>
                <div className="skel" />
                <div className="skel short" />
                <div className="skel" />
              </div>
            </div>
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
                  ? copy.keyMissingTitle
                  : copy.errorTitle}
              </strong>
              <p>{state.message}</p>
              {state.code === "MISSING_API_KEY" ? <p>{copy.keyMissingBody}</p> : null}
            </div>
          ) : null}

          {state.kind === "ok" ? <AuditView envelope={state.envelope} /> : null}
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
          <h3>{copy.status}</h3>
          <p>{statusLabel(audit.compliance_status)}</p>
        </article>
        <article className={`metric ${toneClass(riskTone(audit.risk_level))}`}>
          <h3>{copy.risk}</h3>
          <p>{riskLabel(audit.risk_level)}</p>
        </article>
        <article className={`metric ${toneClass("idle")}`}>
          <h3>{copy.latency}</h3>
          <p>
            {latency_ms}
            <span className="unit">ms</span>
          </p>
        </article>
      </div>

      <article className="block">
        <h3>{copy.summary}</h3>
        <p>{audit.summary}</p>
      </article>

      <article className="block">
        <h3>{copy.finops}</h3>
        <p>{audit.estimated_cost_impact}</p>
      </article>

      <article className="block">
        <h3>{copy.citations}</h3>
        <ul className="cite-list">
          {audit.cited_policies.map((citation) => (
            <li key={citation}>{citation}</li>
          ))}
        </ul>
      </article>

      <article className="block">
        <h3>{copy.remediation}</h3>
        <ol className="steps">
          {audit.remediation_steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </article>

      <details className="json-exp">
        <summary>{copy.rawJson}</summary>
        <pre>
          <code>{JSON.stringify(envelope, null, 2)}</code>
        </pre>
      </details>
    </div>
  );
}
