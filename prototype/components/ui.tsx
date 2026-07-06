// Pure presentational helpers — no hooks, safe in server or client components.
import type { GateDecision, Segment } from "../lib/types";

const SEGMENT_LABEL: Record<Segment, string> = {
  forgot: "Forgot",
  cant_pay: "Can't pay",
  disputes: "Disputes",
  wont_pay: "Won't pay",
  unknown: "Unclear",
};

export function SegmentChip({ segment }: { segment: Segment }) {
  return (
    <span className={`chip chip--${segment}`}>{SEGMENT_LABEL[segment]}</span>
  );
}

export function ConfidenceMeter({ value }: { value: number }) {
  const pct = Math.round(value * 100);
  const level = value >= 0.75 ? "high" : value >= 0.6 ? "med" : "low";
  return (
    <div className="conf">
      <div className="conf__bar">
        <div className={`conf__fill conf__fill--${level}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="mono small muted">{pct}% confidence</span>
    </div>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    overdue: "hcp-badge--overdue",
    sent: "hcp-badge--sent",
    paid: "hcp-badge--paid",
    halted: "hcp-badge--draft",
  };
  const label: Record<string, string> = {
    overdue: "Overdue",
    sent: "Reminder sent",
    paid: "Paid",
    halted: "Paused",
  };
  return <span className={`hcp-badge ${map[status] ?? "hcp-badge--draft"}`}>{label[status] ?? status}</span>;
}

const DECISION_META: Record<GateDecision, { label: string; cls: string }> = {
  auto_send: { label: "Auto-sent", cls: "hcp-badge--paid" },
  queue_for_review: { label: "Queued for review", cls: "hcp-badge--due" },
  escalate: { label: "Escalated to you", cls: "hcp-badge--overdue" },
  defer_quiet_hours: { label: "Held — quiet hours", cls: "hcp-badge--draft" },
  halt: { label: "Halted", cls: "hcp-badge--overdue" },
};

export function DecisionBadge({ decision }: { decision: GateDecision }) {
  const m = DECISION_META[decision];
  return <span className={`hcp-badge ${m.cls}`}>{m.label}</span>;
}

export function decisionLabel(decision: GateDecision): string {
  return DECISION_META[decision].label;
}
