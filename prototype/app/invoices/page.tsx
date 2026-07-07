import Link from "next/link";
import { getInvoices, getCustomer, getSettings, PRO } from "../../lib/data";
import { effectiveSegmentOf } from "../../lib/agent";
import { priorityScore, fmtMoney, relativeDso } from "../../lib/weighting";
import { StatusBadge, SegmentChip } from "../../components/ui";

export const dynamic = "force-dynamic";

export default function InvoicesPage() {
  const settings = getSettings();
  const rows = getInvoices()
    .map((inv) => {
      const customer = getCustomer(inv.customerId)!;
      return {
        inv,
        customer,
        // Same derivation the detail page uses, off the same stored read — so the
        // chip here can never disagree with the chip there.
        effectiveSegment: effectiveSegmentOf(inv.segment, inv.confidence),
        score: priorityScore(inv, customer, settings),
        rel: relativeDso(customer, settings),
      };
    })
    .sort((a, b) => b.score - a.score);

  const totalOpen = rows
    .filter((r) => r.inv.status !== "paid")
    .reduce((s, r) => s + r.inv.amount, 0);

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <h2>Collections</h2>
          <p className="muted">
            {PRO.name} · {fmtMoney(totalOpen)} open across {rows.length} invoices ·
            ranked by who to chase today
          </p>
        </div>
        <span className="hcp-badge hcp-badge--sent">AI Team · AR</span>
      </div>

      <div className="hcp-card hcp-card--flush">
        <table className="hcp-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Customer</th>
              <th>Invoice</th>
              <th className="num">Amount</th>
              <th className="num">Days over</th>
              <th>Risk (rel. DSO)</th>
              <th>Reason</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, idx) => (
              <tr key={r.inv.id}>
                <td className="mono muted">#{idx + 1}</td>
                <td>
                  <Link href={`/invoices/${r.inv.id}`}>{r.customer.name}</Link>
                  {r.customer.isVip || settings.vipIds.includes(r.customer.id) ? (
                    <span className="chip" style={{ marginLeft: 8 }}>★ VIP</span>
                  ) : null}
                </td>
                <td className="muted small">{r.inv.jobTitle}</td>
                <td className="num mono">{fmtMoney(r.inv.amount)}</td>
                <td className="num mono">{r.inv.daysOverdue}</td>
                <td className="mono">
                  {r.rel >= 1.5 ? "🔴 " : r.rel >= 1.1 ? "🟠 " : "🟢 "}
                  {r.rel.toFixed(2)}×
                </td>
                <td>
                  {r.inv.rationale ? (
                    <div className="reason-cell">
                      <SegmentChip segment={r.effectiveSegment} />
                      <span className="reason-cell__why muted small">
                        {r.inv.rationale}
                      </span>
                    </div>
                  ) : (
                    <span className="muted small">not yet read</span>
                  )}
                </td>
                <td>
                  <StatusBadge status={r.inv.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="small muted" style={{ marginTop: 12 }}>
        Priority blends dollars at risk, recovery uplift over baseline, days overdue,
        and customer risk (this customer&apos;s DSO vs. your {settings.baselineDso}-day
        average) — so hard collections outrank easy dollars.
      </p>
    </div>
  );
}
