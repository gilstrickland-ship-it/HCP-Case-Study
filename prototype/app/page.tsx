import Link from "next/link";
import {
  getInvoices,
  getCustomer,
  getSettings,
  isVip,
  RECOVERIES,
  SEGMENT_TRACK,
  DSO_SNAPSHOT,
  PRO,
} from "../lib/data";
import { fmtMoney, weightedRecoveryCredit } from "../lib/weighting";
import { SegmentChip, StatusBadge } from "../components/ui";

export const dynamic = "force-dynamic";

export default function Dashboard() {
  const settings = getSettings();
  const invoices = getInvoices();

  // Deterministic (no-LLM) review-queue heuristic for the dashboard: what the
  // guardrails would force to a human regardless of the reason read.
  const open = invoices.filter((i) => i.status === "overdue");
  const queue = open.filter(
    (i) => isVip(i.customerId) || i.amount > settings.loopMeInThreshold || i.disputed,
  );
  const recentSends = invoices.filter((i) => i.status === "sent");
  const halted = invoices.filter((i) => i.status === "halted");

  const recoveredWeighted = RECOVERIES.reduce((s, r) => s + r.weighted, 0);
  const recoveredDollars = RECOVERIES.reduce((s, r) => s + r.amount, 0);
  const zeroTouch = RECOVERIES.filter((r) => r.zeroTouch).length;
  const hoursSaved = Math.round((RECOVERIES.length + recentSends.length) * 0.4);

  const atRisk = open
    .map((i) => ({ i, c: getCustomer(i.customerId)!, w: weightedRecoveryCredit(i, getCustomer(i.customerId)!, settings) }))
    .sort((a, b) => b.w - a.w)
    .slice(0, 4);

  return (
    <div className="stack">
      <div className="page-head row row--between">
        <div>
          <h2>Collections Teammate</h2>
          <p className="muted">
            {PRO.name} · your AR teammate on the AI Team · demo snapshot
          </p>
        </div>
        <Link href="/invoices" className="hcp-btn hcp-btn--primary" style={{ textDecoration: "none" }}>
          open collections
        </Link>
      </div>

      {/* Outcome tiles */}
      <div className="tiles">
        <div className="tile">
          <div className="tile__label">Weighted recovered</div>
          <div className="tile__value">{fmtMoney(recoveredWeighted)}</div>
          <div className="tile__delta tile__delta--good">{fmtMoney(recoveredDollars)} collected · hard cases credited</div>
        </div>
        <div className="tile">
          <div className="tile__label">DSO vs. your baseline</div>
          <div className="tile__value">{DSO_SNAPSHOT.current}d</div>
          <div className="tile__delta tile__delta--good">▼ {DSO_SNAPSHOT.baseline - DSO_SNAPSHOT.current} days from {DSO_SNAPSHOT.baseline}d</div>
        </div>
        <div className="tile">
          <div className="tile__label">Zero-touch resolutions</div>
          <div className="tile__value">{zeroTouch}</div>
          <div className="tile__delta muted">resolved with no Pro effort</div>
        </div>
        <div className="tile">
          <div className="tile__label">Hours saved</div>
          <div className="tile__value">~{hoursSaved}h</div>
          <div className="tile__delta muted">this cycle, not writing messages</div>
        </div>
      </div>

      {halted.length > 0 && (
        <div className="alert alert--danger">
          <div className="alert__title">
            {halted.length} invoice{halted.length > 1 ? "s" : ""} paused — needs your review
          </div>
          <div className="small">
            A customer said they already paid or disputed a charge. The agent froze
            those threads. {" "}
            {halted.map((i, idx) => (
              <span key={i.id}>
                <Link href={`/invoices/${i.id}`}>{i.id}</Link>
                {idx < halted.length - 1 ? ", " : ""}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="detail-grid">
        <div className="col" style={{ gap: 16 }}>
          {/* Review queue */}
          <div className="hcp-card hcp-card--flush">
            <div style={{ padding: "16px 24px 0" }}>
              <h3 className="hcp-card__title">Waiting on you ({queue.length})</h3>
              <p className="muted small" style={{ marginTop: -6 }}>
                High-stakes cases the guardrails always route to a human — VIPs, big
                balances, disputes.
              </p>
            </div>
            <table className="hcp-table">
              <thead>
                <tr><th>Customer</th><th className="num">Amount</th><th className="num">Days</th><th>Why you</th><th></th></tr>
              </thead>
              <tbody>
                {queue.map((i) => {
                  const c = getCustomer(i.customerId)!;
                  const why = i.disputed ? "dispute" : isVip(i.customerId) ? "VIP" : "over threshold";
                  return (
                    <tr key={i.id}>
                      <td><Link href={`/invoices/${i.id}`}>{c.name}</Link></td>
                      <td className="num mono">{fmtMoney(i.amount)}</td>
                      <td className="num mono">{i.daysOverdue}</td>
                      <td><span className="chip">{why}</span></td>
                      <td><Link href={`/invoices/${i.id}`} className="small">review →</Link></td>
                    </tr>
                  );
                })}
                {queue.length === 0 && (
                  <tr><td colSpan={5} className="muted small" style={{ padding: 16 }}>Nothing needs you right now.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Weighted recoveries */}
          <div className="hcp-card">
            <h3 className="hcp-card__title">Recent wins — weighted toward hard collections</h3>
            <table className="hcp-table">
              <thead>
                <tr><th>Customer</th><th>Segment</th><th className="num">Collected</th><th className="num">Weighted credit</th><th></th></tr>
              </thead>
              <tbody>
                {RECOVERIES.map((r) => (
                  <tr key={r.id}>
                    <td>{r.customer}</td>
                    <td><SegmentChip segment={r.segment} /></td>
                    <td className="num mono">{fmtMoney(r.amount)}</td>
                    <td className="num mono">{fmtMoney(r.weighted)}</td>
                    <td>{r.zeroTouch ? <span className="chip" style={{ background: "var(--hcp-success-bg)", color: "var(--hcp-success)" }}>zero-touch</span> : null}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 10 }}>
              A $610 recovery from a chronically-late customer is credited more than a
              larger sum from a sure-payer — the agent can&apos;t game the metric by
              chasing easy dollars.
            </p>
          </div>
        </div>

        {/* RIGHT: trust / autonomy track record */}
        <div className="col" style={{ gap: 16 }}>
          <div className="hcp-card">
            <h3 className="hcp-card__title">Earned autonomy</h3>
            <p className="muted small" style={{ marginTop: -6 }}>
              Autonomy is earned per segment, with evidence. You&apos;re always in control.
            </p>
            <div className="stack" style={{ marginTop: 12 }}>
              {SEGMENT_TRACK.map((t) => (
                <div key={t.segment} className="ctx__bucket">
                  <div className="row row--between">
                    <SegmentChip segment={t.segment} />
                    <span className="hcp-badge hcp-badge--sent">{t.level}</span>
                  </div>
                  <div className="small muted" style={{ marginTop: 6 }}>
                    You approved {t.approvedUnedited}/{t.proposed} unedited.
                  </div>
                  {t.offerL2 && (
                    <div className="alert alert--info small" style={{ marginTop: 8 }}>
                      Ready to auto-send this segment? <Link href="/settings">Bump the leash to L2 →</Link>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="hcp-card">
            <h3 className="hcp-card__title">Most at risk</h3>
            <div className="stack" style={{ marginTop: 10 }}>
              {atRisk.map(({ i, c }) => (
                <div key={i.id} className="row row--between">
                  <Link href={`/invoices/${i.id}`}>{c.name}</Link>
                  <span className="mono small">{fmtMoney(i.amount)} · {i.daysOverdue}d</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {recentSends.length > 0 && (
        <div className="hcp-card">
          <h3 className="hcp-card__title">Recent sends</h3>
          <div className="stack" style={{ marginTop: 8 }}>
            {recentSends.map((i) => {
              const c = getCustomer(i.customerId)!;
              return (
                <div key={i.id} className="row row--between">
                  <span><Link href={`/invoices/${i.id}`}>{c.name}</Link> · {i.jobTitle}</span>
                  <StatusBadge status="sent" />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
