// ============================================================================
// Deterministic guardrails (PRD §7 / constitution I).
// The LLM never decides whether a message may send — this code does. Every hard
// stop is a pure function so the P0 = 0 gate is real, not hopeful — and testable
// case by case against the eval spec (05-eval-spec.md).
// ============================================================================

import type {
  AutonomyLevel,
  GateResult,
  Invoice,
  Segment,
} from "./types";

// Quiet hours: 9pm–6am in the CUSTOMER's local time (they are the one messaged).
export function isQuietHours(localHour: number): boolean {
  return localHour >= 21 || localHour < 6;
}

// Compute the customer-local hour from an IANA timezone. Falls back to the given
// hour if the timezone is unknown.
export function localHourFor(timezone: string, at: Date = new Date()): number {
  try {
    const s = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      hour: "numeric",
      hour12: false,
    }).format(at);
    const h = parseInt(s, 10);
    return Number.isFinite(h) ? h % 24 : at.getHours();
  } catch {
    return at.getHours();
  }
}

// Legal/collections language that must never reach a VIP (and is out of scope for
// this product entirely). Detection is conservative and case-insensitive.
const LEGAL_TERMS = [
  "legal action",
  "lawsuit",
  "sue",
  "attorney",
  "lawyer",
  "collections agency",
  "debt collector",
  "lien",
  "small claims",
  "court",
  "credit bureau",
  "garnish",
];

export function hasLegalLanguage(text: string): boolean {
  const t = text.toLowerCase();
  return LEGAL_TERMS.some((term) => t.includes(term));
}

// Remove sentences containing legal/collections language (belt-and-suspenders:
// composition is prompted to avoid it, but we never trust the model on a hard stop).
export function stripLegalLanguage(text: string): string {
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => !hasLegalLanguage(s));
  const out = kept.join(" ").trim();
  return out.length > 0 ? out : text; // never return empty
}

export interface GateInput {
  invoice: Invoice;
  effectiveSegment: Segment;
  confidence: number;
  confidenceBar: number; // e.g. 0.6
  autonomyLevel: AutonomyLevel;
  amount: number;
  loopMeInThreshold: number;
  isVip: boolean;
  localHour: number;
  composedBody: string;
  // reply-driven failure flags (from triage), if any
  alreadyPaid?: boolean;
  disputedReply?: boolean;
}

// The single gate every outbound message passes through before it can send.
export function gate(input: GateInput): GateResult {
  const reasons: string[] = [];
  const fired: string[] = [];

  // 1. CARDINAL FAILURE — already paid or disputed. Halt above all else.
  if (input.alreadyPaid) {
    fired.push("already_paid");
    reasons.push(
      "Customer says they already paid — halting and pausing every open invoice for this customer until you review.",
    );
    return { decision: "halt", reasons, escalated: true, guardrailsFired: fired };
  }
  if (input.disputedReply || input.invoice.disputed) {
    fired.push("dispute");
    reasons.push(
      "Open dispute on this invoice — halting reminders and routing to you with a draft. Never dun a disputed charge.",
    );
    return { decision: "halt", reasons, escalated: true, guardrailsFired: fired };
  }

  // 2. Forced escalations (always, regardless of autonomy level).
  let mustEscalate = false;
  if (input.isVip) {
    mustEscalate = true;
    fired.push("vip");
    reasons.push("VIP customer — kid gloves; you review before anything sends.");
  }
  if (input.amount > input.loopMeInThreshold) {
    mustEscalate = true;
    fired.push("threshold");
    reasons.push(
      `Amount is over your Loop-me-in threshold ($${input.loopMeInThreshold.toLocaleString()}) — escalating to you.`,
    );
  }

  // 3. Low confidence — degrade to safe default and keep a human in the loop.
  const lowConfidence = input.confidence < input.confidenceBar;
  if (lowConfidence) {
    fired.push("low_confidence");
    reasons.push(
      "Low confidence on why this is unpaid — using the gentle 'forgot' nudge and queuing for your review, not guessing a play.",
    );
  }

  if (mustEscalate) {
    return { decision: "escalate", reasons, escalated: true, guardrailsFired: fired };
  }

  // 4. Autonomy gate (only reached if nothing above forced review).
  if (input.autonomyLevel === "L0") {
    fired.push("autonomy_off");
    reasons.push("This segment's automation level is set to Off — drafting for you, not sending.");
    return { decision: "queue_for_review", reasons, escalated: false, guardrailsFired: fired };
  }

  if (input.autonomyLevel === "L1" || lowConfidence) {
    if (input.autonomyLevel === "L1") {
      fired.push("autonomy_draft_only");
      reasons.push("Automation level is Draft-only for this segment — queued for your approval.");
    }
    return { decision: "queue_for_review", reasons, escalated: false, guardrailsFired: fired };
  }

  // 5. L2 auto-send path — last check is quiet hours.
  if (isQuietHours(input.localHour)) {
    fired.push("quiet_hours");
    reasons.push(
      `It's ${input.localHour}:00 for the customer — inside quiet hours (9pm–6am). Holding until after 6am.`,
    );
    return { decision: "defer_quiet_hours", reasons, escalated: false, guardrailsFired: fired };
  }

  fired.push("auto_send_l2");
  reasons.push("Safe segment at auto-send (L2), on-brand and within quiet hours — sending automatically.");
  return { decision: "auto_send", reasons, escalated: false, guardrailsFired: fired };
}
