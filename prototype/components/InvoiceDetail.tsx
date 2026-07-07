"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import type {
  Customer,
  Invoice,
  Message,
  ProcessResult,
  ProSettings,
} from "../lib/types";
import { fmtMoney } from "../lib/weighting";
import {
  SegmentChip,
  ConfidenceMeter,
  StatusBadge,
  DecisionBadge,
} from "./ui";

interface Props {
  invoice: Invoice;
  customer: Customer;
  settings: ProSettings;
  vip: boolean;
  relativeDso: number;
  proName: string;
}

interface ReplyResponse {
  triage: {
    intent: string;
    promiseDate: string | null;
    failureFlags: { alreadyPaid: boolean; disputed: boolean };
    draft: string;
    source: "llm" | "fallback";
  };
  decision: "halt" | "queue_for_review";
  frozenInvoices: string[];
  customerName: string;
}

export default function InvoiceDetail({
  invoice,
  customer,
  settings,
  vip,
  relativeDso,
  proName,
}: Props) {
  const [proc, setProc] = useState<ProcessResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState("");
  const [thread, setThread] = useState<Message[]>(invoice.thread);
  const [sent, setSent] = useState(invoice.status === "sent");
  const [replyText, setReplyText] = useState("");
  const [replying, setReplying] = useState(false);
  const [replyResult, setReplyResult] = useState<ReplyResponse | null>(null);
  const [halted, setHalted] = useState(invoice.status === "halted");

  const runAgent = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id }),
      });
      const data: ProcessResult = await res.json();
      setProc(data);
      setDraft(data.compose.body);
    } finally {
      setLoading(false);
    }
  }, [invoice.id]);

  useEffect(() => {
    runAgent();
  }, [runAgent]);

  async function approveSend() {
    await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: invoice.id, body: draft }),
    });
    setThread((t) => [
      ...t,
      {
        id: `local_${t.length}`,
        direction: "out",
        body: draft,
        status: "sent",
        createdAt: new Date().toISOString(),
      },
    ]);
    setSent(true);
  }

  async function sendReply(text: string) {
    if (!text.trim()) return;
    setReplying(true);
    setThread((t) => [
      ...t,
      {
        id: `localin_${t.length}`,
        direction: "in",
        body: text,
        status: "sent",
        createdAt: new Date().toISOString(),
      },
    ]);
    try {
      const res = await fetch("/api/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId: invoice.id, reply: text }),
      });
      const data: ReplyResponse = await res.json();
      setReplyResult(data);
      if (data.decision === "halt") setHalted(true);
    } finally {
      setReplying(false);
      setReplyText("");
    }
  }

  // Which cardinal failure are we halted on? A reply we just triaged wins;
  // otherwise read the standing inbound already in the thread.
  const lastInbound = [...thread].reverse().find((m) => m.direction === "in");
  const alreadyPaidHalt = replyResult
    ? replyResult.triage.failureFlags.alreadyPaid
    : lastInbound?.intent === "already_paid";

  const decision = proc?.gate.decision;
  const canSend =
    !halted &&
    !sent &&
    (decision === "queue_for_review" || decision === "escalate");
  const autoSent = decision === "auto_send";

  return (
    <div>
      <div className="page-head row row--between">
        <div>
          <div className="row" style={{ gap: 8 }}>
            <Link href="/invoices" className="muted small">← Collections</Link>
          </div>
          <h2 style={{ marginTop: 4 }}>
            {customer.name} · {fmtMoney(invoice.amount)}
            {vip ? <span className="chip" style={{ marginLeft: 10 }}>★ VIP</span> : null}
          </h2>
          <p className="muted">
            {invoice.id} · {invoice.jobTitle} · {invoice.daysOverdue} days overdue
          </p>
        </div>
        <StatusBadge status={halted ? "halted" : sent ? "sent" : invoice.status} />
      </div>

      {halted && (
        <div className="alert alert--danger stack" style={{ marginBottom: 16 }}>
          <div className="alert__title">
            Halted — agent paused across all of {customer.name.split(" ")[0]}&apos;s open invoices
          </div>
          <div>
            {alreadyPaidHalt
              ? "Customer says they already paid. One “I already paid” means the records may be out of sync for the whole relationship — every open invoice for this customer is frozen until you review."
              : "Open dispute — never dun a disputed charge. Reminders are suppressed until you review."}
            {replyResult && replyResult.frozenInvoices.length > 0 ? (
              <> Frozen: {replyResult.frozenInvoices.join(", ")}.</>
            ) : null}
          </div>
        </div>
      )}

      <div className="detail-grid">
        {/* LEFT: the agent's read + draft + thread */}
        <div className="col" style={{ gap: 16 }}>
          {/* Classification */}
          <div className="hcp-card">
            <div className="row row--between">
              <h3 className="hcp-card__title" style={{ marginBottom: 0 }}>
                Why it&apos;s unpaid
              </h3>
              {proc && <span className="src-tag">the agent&apos;s read</span>}
            </div>
            {loading || !proc ? (
              <p className="muted"><span className="spinner" /> reading the context…</p>
            ) : (
              <div className="stack">
                <div className="row" style={{ gap: 10, marginTop: 8 }}>
                  <SegmentChip segment={proc.effectiveSegment} />
                  <span className="muted small">play: {proc.play}</span>
                </div>
                <ConfidenceMeter value={proc.classify.confidence} />
                <p className="muted small" style={{ marginTop: 4 }}>
                  {proc.classify.rationale}
                  {proc.effectiveSegment !== proc.classify.reason && (
                    <> · low confidence → fell back to the safe gentle nudge.</>
                  )}
                </p>
              </div>
            )}
          </div>

          {/* Draft + decision */}
          {proc && !halted && (
            <div className="hcp-card">
              <div className="row row--between" style={{ marginBottom: 10 }}>
                <div className="row" style={{ gap: 8 }}>
                  <h3 className="hcp-card__title" style={{ marginBottom: 0 }}>
                    {autoSent ? "Message sent in the Pro's voice" : "Draft for your review"}
                  </h3>
                  <span className="src-tag">
                    {proc.compose.source === "llm" ? "Claude" : "offline fallback"}
                  </span>
                </div>
                <DecisionBadge decision={proc.gate.decision} />
              </div>

              <textarea
                className="draft-edit"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={autoSent || sent}
              />

              <div className="stack" style={{ marginTop: 10 }}>
                {proc.gate.reasons.map((r, i) => (
                  <div key={i} className="small muted">• {r}</div>
                ))}
              </div>

              {canSend && (
                <div className="row" style={{ marginTop: 14, gap: 10 }}>
                  <button className="hcp-btn hcp-btn--primary" onClick={approveSend}>
                    approve &amp; send
                  </button>
                  <button className="hcp-btn hcp-btn--outline" onClick={runAgent}>
                    redraft
                  </button>
                </div>
              )}
              {sent && !autoSent && (
                <p className="small" style={{ color: "var(--hcp-success)", marginTop: 12 }}>
                  ✓ Sent and logged to your wins.
                </p>
              )}
              {autoSent && (
                <p className="small muted" style={{ marginTop: 12 }}>
                  Auto-sent because this safe segment earned the L2 automation level — you can dial it
                  back anytime in Agent settings.
                </p>
              )}
            </div>
          )}

          {/* Conversation */}
          <div className="hcp-card">
            <h3 className="hcp-card__title">Conversation</h3>
            {thread.length === 0 && !sent ? (
              <p className="muted small">No messages yet.</p>
            ) : (
              <div className="thread">
                {thread.map((m) => (
                  <div key={m.id} className={`msg msg--${m.direction === "out" ? "out" : "in"}`}>
                    {m.body}
                    {m.intent ? <div className="msg__meta">intent: {m.intent}{m.promiseDate ? ` · promised ${m.promiseDate}` : ""}</div> : null}
                    {m.direction === "out" && (
                      <div>
                        <button type="button" className="msg__pay-btn">Pay link</button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Reply triage result */}
            {replyResult && (
              <div
                className={`alert stack ${
                  replyResult.decision === "halt" ? "alert--danger" : "alert--info"
                }`}
                style={{ marginTop: 14 }}
              >
                <div className="alert__title">
                  Triaged: {replyResult.triage.intent.replace("_", " ")}
                  {replyResult.triage.promiseDate ? ` · promise ${replyResult.triage.promiseDate}` : ""}
                  <span className="src-tag" style={{ marginLeft: 8 }}>
                    {replyResult.triage.source === "llm" ? "Claude" : "offline fallback"}
                  </span>
                </div>
                <div className="small muted">
                  {replyResult.decision === "halt"
                    ? "Routed to you with a ready-to-send correction — review, don't compose:"
                    : "Suggested reply for your review:"}
                </div>
                <div className="msg msg--draft" style={{ alignSelf: "flex-start", maxWidth: "100%" }}>
                  {replyResult.triage.draft}
                  <div>
                    <button type="button" className="msg__pay-btn">Pay link</button>
                  </div>
                </div>
              </div>
            )}

            {/* Reply simulator (panel acts as the customer) */}
            {!halted && (
              <div style={{ marginTop: 16 }}>
                <div className="divider" />
                <div className="small muted" style={{ marginBottom: 8 }}>
                  Simulate a customer reply (you&apos;re the customer):
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <input
                    className="reply-input"
                    placeholder="Type a reply as the customer…"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && sendReply(replyText)}
                  />
                  <button
                    className="hcp-btn hcp-btn--primary"
                    onClick={() => sendReply(replyText)}
                    disabled={replying}
                  >
                    {replying ? "…" : "send"}
                  </button>
                </div>
                {invoice.suggestedReply && (
                  <button
                    className="link-btn small"
                    style={{ marginTop: 8 }}
                    onClick={() => sendReply(invoice.suggestedReply!)}
                  >
                    ▶ try: “{invoice.suggestedReply}”
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: the 5-bucket context the agent reads */}
        <div className="hcp-card">
          <h3 className="hcp-card__title">What the agent read</h3>

          <div className="ctx__bucket">
            <div className="ctx__bucket-label">A · Relationship &amp; value</div>
            <div className="ctx__row"><span className="k">Relationship</span><span>{customer.relationship}{vip ? " · ★ VIP" : ""}</span></div>
            <div className="ctx__row"><span className="k">Lifetime revenue</span><span className="mono">{fmtMoney(customer.lifetimeRevenue)}</span></div>
            <div className="ctx__row"><span className="k">Tenure</span><span>{customer.tenureMonths} months</span></div>
          </div>

          <div className="ctx__bucket">
            <div className="ctx__bucket-label">B · Payment behavior / DSO</div>
            <div className="ctx__row"><span className="k">This customer&apos;s DSO</span><span className="mono">{customer.customerDso}d vs {settings.baselineDso}d avg</span></div>
            <div className="ctx__row"><span className="k">Relative risk</span><span className="mono">{relativeDso.toFixed(2)}× {relativeDso >= 1.5 ? "🔴" : relativeDso >= 1.1 ? "🟠" : "🟢"}</span></div>
            <div className="ctx__row"><span className="k">On-time rate</span><span className="mono">{Math.round(customer.onTimeRate * 100)}%</span></div>
            <div className="ctx__row"><span className="k">Prior late / broken promises</span><span className="mono">{customer.priorLateCount} / {customer.brokenPromiseCount}</span></div>
            <div className="ctx__row"><span className="k">Card on file</span><span>{customer.cardOnFile ? "yes" : "no"}</span></div>
          </div>

          <div className="ctx__bucket">
            <div className="ctx__bucket-label">C · Invoice / job</div>
            <div className="ctx__row"><span className="k">Amount</span><span className="mono">{fmtMoney(invoice.amount)}</span></div>
            <div className="ctx__row"><span className="k">Days overdue</span><span className="mono">{invoice.daysOverdue}</span></div>
            <div className="ctx__row"><span className="k">Job type</span><span>{invoice.jobType}</span></div>
            <div className="ctx__row"><span className="k">Deposit taken</span><span>{invoice.depositTaken ? "yes" : "no"}</span></div>
          </div>

          <div className="ctx__bucket">
            <div className="ctx__bucket-label">D · Inferred reason</div>
            {proc ? (
              <div className="ctx__row">
                <span className="k">Read</span>
                <span><SegmentChip segment={proc.effectiveSegment} /> {Math.round(proc.classify.confidence * 100)}%</span>
              </div>
            ) : (
              <div className="muted small">reading…</div>
            )}
          </div>

          <div className="ctx__bucket">
            <div className="ctx__bucket-label">E · Your guardrails</div>
            <div className="ctx__row"><span className="k">Level (this segment)</span><span>{proc?.autonomyLevel ?? "—"}</span></div>
            <div className="ctx__row"><span className="k">Loop-me-in over</span><span className="mono">{fmtMoney(settings.loopMeInThreshold)}</span></div>
            <div className="ctx__row"><span className="k">Tone</span><span>{settings.tone < 33 ? "warm" : settings.tone < 66 ? "balanced" : "firm"}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
