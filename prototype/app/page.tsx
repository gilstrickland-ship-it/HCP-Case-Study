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
import type { Segment } from "../lib/types";

export const dynamic = "force-dynamic";

// Plain-language, Pro-facing phrasing for each segment — reads like a story,
// not a database label. Used in the "Recent wins" table.
const SITUATION_LABEL: Record<Segment, string> = {
  forgot: "Just forgot",
  cant_pay: "Couldn't afford it",
  wont_pay: "Refused to pay",
  disputes: "Disputed the bill",
  unknown: "Unclear",
};

// "Tough" = customers who don't usually pay. These are the wins the Pro would
// most likely have written off, so we surface them instead of the internal
// weighted-credit score.
function isToughWin(segment: Segment): boolean {
  return segment === "wont_pay" || segment === "cant_pay";
}

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

  const recoveredDollars = RECOVERIES.reduce((s, r) => s + r.amount, 0);
  const toughDollars = RECOVERIES.filter((r) => isToughWin(r.segment)).reduce((s, r) => s + r.amount, 0);
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
          <div className="tile__label">Recovered</div>
          <div className="tile__value">{fmtMoney(recoveredDollars)}</div>
          <div className="tile__delta tile__delta--good">{fmtMoney(toughDollars)} from customers who don&apos;t usually pay</div>
        </div>
        <div className="tile">
          <div className="tile__label">Days Sales Outstanding</div>
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

          {/* Recent wins */}
          <div className="hcp-card">
            <h3 className="hcp-card__title">Recent wins</h3>
            <p style={{ margin: "2px 0 14px", fontSize: "var(--hcp-fs-md)" }}>
              <strong>{fmtMoney(recoveredDollars)}</strong> recovered —{" "}
              <strong>{fmtMoney(toughDollars)}</strong> of it from customers who usually
              don&apos;t pay.
            </p>
            <table className="hcp-table">
              <thead>
                <tr><th>Customer</th><th>Situation</th><th className="num">Recovered</th><th></th></tr>
              </thead>
              <tbody>
                {RECOVERIES.map((r) => (
                  <tr key={r.id}>
                    <td>{r.customer}</td>
                    <td>{SITUATION_LABEL[r.segment]}</td>
                    <td className="num mono">{fmtMoney(r.amount)}</td>
                    <td>
                      {isToughWin(r.segment) ? (
                        <span className="chip" style={{ background: "var(--hcp-blue-tint)", color: "var(--hcp-blue)" }}>Tough win</span>
                      ) : r.zeroTouch ? (
                        <span className="chip" style={{ background: "var(--hcp-success-bg)", color: "var(--hcp-success)" }}>Handled for you</span>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="small muted" style={{ marginTop: 10 }}>
              Tough wins are money you&apos;d likely have written off — your teammate goes
              after the hard cases, not just the easy ones.
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
                      Ready to auto-send this segment? <Link href="/settings">Bump the automation level to L2 →</Link>
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
