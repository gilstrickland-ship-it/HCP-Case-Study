"use client";

import { useState } from "react";
import type { EvalCaseResult, EvalSummary } from "../../lib/types";

export default function EvalPage() {
  const [running, setRunning] = useState(false);
  const [results, setResults] = useState<EvalCaseResult[] | null>(null);
  const [summary, setSummary] = useState<EvalSummary | null>(null);

  async function run() {
    setRunning(true);
    setResults(null);
    setSummary(null);
    try {
      const res = await fetch("/api/eval", { method: "POST" });
      const data = await res.json();
      setResults(data.results);
      setSummary(data.summary);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h2>Eval — ship gate</h2>
          <p className="muted">
            Runs the 15-case test set through the real agent pipeline. Any P0 failure
            blocks ship. Runnable and extendable by a teammate — the cases live in{" "}
            <code>lib/cases.json</code>.
          </p>
        </div>
        <button className="hcp-btn hcp-btn--primary" onClick={run} disabled={running}>
          {running ? "running…" : "run all 15 cases"}
        </button>
      </div>

      {running && (
        <div className="hcp-card"><span className="spinner" /> running cases through classify / gate / compose / triage…</div>
      )}

      {summary && (
        <>
          <div className={`gate ${summary.gatePassed ? "gate--pass" : "gate--fail"}`} style={{ marginBottom: 16 }}>
            {summary.gatePassed
              ? `✓ SHIP GATE PASSED — P0 rate = 0 (${summary.p0Count} P0 cases all clean)`
              : `✗ SHIP BLOCKED — ${summary.p0Failures} P0 failure(s). Do not ship.`}
          </div>

          <div className="eval-summary">
            <Metric label="Passed" value={`${summary.passed}/${summary.total}`} good={summary.passed === summary.total} />
            <Metric label="P0 rate" value={`${(summary.p0Rate * 100).toFixed(0)}%`} good={summary.p0Rate === 0} target="= 0" />
            <Metric label="Classify acc." value={summary.classifyAccuracy != null ? `${Math.round(summary.classifyAccuracy * 100)}%` : "—"} good={(summary.classifyAccuracy ?? 0) >= 0.9} target="≥ 90%" />
            <Metric label="Escalation recall" value={summary.escalationRecall != null ? `${Math.round(summary.escalationRecall * 100)}%` : "—"} good={(summary.escalationRecall ?? 0) === 1} target="= 100%" />
            <Metric label="P0 cases" value={`${summary.p0Count}`} good />
          </div>
        </>
      )}

      {results && (
        <div className="hcp-card hcp-card--flush">
          <table className="hcp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Case</th>
                <th>Result</th>
                <th>On miss</th>
                <th>Expected → Got</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.id}>
                  <td className="mono">{r.id}</td>
                  <td>{r.title}</td>
                  <td className={r.pass ? "pill-pass" : "pill-fail"}>{r.pass ? "PASS" : "FAIL"}</td>
                  <td>{r.errorClass ? <span className="hcp-badge hcp-badge--overdue">{r.errorClass}</span> : <span className="muted small">—</span>}</td>
                  <td className="small muted">{compact(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!results && !running && (
        <div className="hcp-card">
          <p className="muted">
            Press <strong>run all 15 cases</strong>. The gate enforces P0 = 0 (no false
            dun, no guardrail breach), classification ≥ 90%, and escalation recall = 100%.
          </p>
        </div>
      )}
    </div>
  );
}

function Metric({ label, value, good, target }: { label: string; value: string; good?: boolean; target?: string }) {
  return (
    <div className="tile">
      <div className="tile__label">{label}</div>
      <div className="tile__value" style={{ fontSize: 21, color: good ? "var(--hcp-success)" : "var(--hcp-danger)" }}>{value}</div>
      {target && <div className="tile__delta muted">target {target}</div>}
    </div>
  );
}

function compact(r: EvalCaseResult): string {
  const exp = Object.entries(r.expected).map(([k, v]) => `${k}=${v}`).join(", ");
  const gotKeys = Object.keys(r.expected);
  const got = gotKeys.map((k) => `${k}=${(r.got as Record<string, unknown>)[k]}`).join(", ");
  return `{${exp}} → {${got}}`;
}
