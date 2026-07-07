// ============================================================================
// Agent orchestration: the core loop from PRD §5.
// buildContext -> classify -> confidence fallback -> selectPlay -> compose ->
// gate. The gate (guardrails.ts) is the ONLY thing that decides send/queue/halt.
// ============================================================================

import type {
  AgentContext,
  AutonomyLevel,
  ClassifyResult,
  Invoice,
  ProcessResult,
  Segment,
} from "./types";
import {
  getCustomer,
  getSettings,
  isVip,
  getOpenInvoicesForCustomer,
  getInvoice,
} from "./data";
import { relativeDso } from "./weighting";
import { compose } from "./anthropic";
import { gate, localHourFor, stripLegalLanguage, hasLegalLanguage } from "./guardrails";
import { PRO } from "./data";

export const CONFIDENCE_BAR = 0.6;

export function buildContext(invoice: Invoice, localHourOverride?: number): AgentContext {
  const customer = getCustomer(invoice.customerId)!;
  const settings = getSettings();
  const localHour =
    localHourOverride ?? localHourFor(customer.timezone, new Date());
  const lastInbound = [...invoice.thread].reverse().find((m) => m.direction === "in");
  return {
    invoice,
    customer,
    relativeDso: relativeDso(customer, settings),
    isVip: isVip(customer.id),
    settings,
    nowLocalHour: localHour,
    recentReply: lastInbound?.body,
  };
}

const PLAY_LABEL: Record<Segment, string> = {
  forgot: "Gentle nudge",
  cant_pay: "Flexible / payment-plan offer",
  disputes: "Pause & route to Pro",
  wont_pay: "Firm (compliant) notice",
  unknown: "Gentle nudge (safe default)",
};

// The ONE derivation both the Collections list and the invoice detail use to pick
// the chip they show. Below the confidence bar we fall back to the safe "forgot"
// nudge — so the two pages can never disagree about the segment label.
export function effectiveSegmentOf(segment: Segment, confidence: number): Segment {
  return confidence < CONFIDENCE_BAR ? "forgot" : segment;
}

// Read a standing failure signal already sitting in the thread (an inbound the
// customer sent earlier), so a seeded "already paid" / dispute halts the moment
// you open it — not only after the reply simulator runs.
function standingFailureFlags(invoice: Invoice): {
  alreadyPaid: boolean;
  disputedReply: boolean;
} {
  const lastInbound = [...invoice.thread].reverse().find((m) => m.direction === "in");
  return {
    alreadyPaid: lastInbound?.intent === "already_paid",
    disputedReply: lastInbound?.intent === "dispute",
  };
}

// The agent's read of WHY an invoice is unpaid is curated demo data (constitution
// V): the invoice record carries the segment/confidence/rationale. Both the
// Collections list and the detail derive their chip from this ONE record via
// effectiveSegmentOf, so they can never disagree. The live model still writes the
// draft (compose) on the detail page — that's the visible generative step.
export function classifyInvoice(invoice: Invoice): {
  classify: ClassifyResult;
  effectiveSegment: Segment;
  autonomyLevel: AutonomyLevel;
} {
  const settings = getSettings();
  const classifyResult: ClassifyResult = {
    reason: invoice.segment,
    confidence: invoice.confidence,
    rationale: invoice.rationale ?? "",
    source: "fallback",
  };
  const effectiveSegment = effectiveSegmentOf(invoice.segment, invoice.confidence);
  const autonomyLevel = settings.segmentAutonomy[effectiveSegment] ?? settings.levelDefault;
  return { classify: classifyResult, effectiveSegment, autonomyLevel };
}

// Run the full loop on one invoice. Pure w.r.t. the store except it reads it.
export async function processInvoice(
  invoice: Invoice,
  opts: { localHour?: number } = {},
): Promise<ProcessResult> {
  const ctx = buildContext(invoice, opts.localHour ?? invoice.demoLocalHour);

  // 1-3. read the curated classification (single source of truth) -> confidence
  // fallback -> select the play + autonomy level for the *effective* segment.
  const { classify: classifyResult, effectiveSegment, autonomyLevel } =
    classifyInvoice(invoice);

  // 4. compose (skip a real ask if the invoice is already disputed — draft a pause)
  const composeResult = await compose(ctx, effectiveSegment, PRO.name);

  // Legal-language hard strip. Legal/collections language is out of scope for this
  // product entirely (eval #8 VIP, #15 non-VIP) — so we scrub it for EVERY customer,
  // never trusting the model on a hard stop.
  let body = composeResult.body;
  if (hasLegalLanguage(body)) {
    body = stripLegalLanguage(body);
  }
  const finalCompose = { ...composeResult, body };

  // 5. gate — the single decision point. A standing "already paid" / dispute
  // already in the thread halts here, so the failure shows on open.
  const standing = standingFailureFlags(invoice);
  const gateResult = gate({
    invoice,
    effectiveSegment,
    confidence: classifyResult.confidence,
    confidenceBar: CONFIDENCE_BAR,
    autonomyLevel,
    amount: invoice.amount,
    loopMeInThreshold: ctx.settings.loopMeInThreshold,
    isVip: ctx.isVip,
    localHour: ctx.nowLocalHour,
    composedBody: body,
    alreadyPaid: standing.alreadyPaid,
    disputedReply: standing.disputedReply,
  });

  return {
    classify: classifyResult,
    effectiveSegment,
    play: PLAY_LABEL[effectiveSegment],
    compose: finalCompose,
    gate: gateResult,
    autonomyLevel,
  };
}

// Apply the cardinal-failure freeze: pause the agent across ALL of a customer's
// open invoices (constitution IV). Mutates the in-memory store.
export function freezeCustomer(customerId: string): string[] {
  const open = getOpenInvoicesForCustomer(customerId);
  const frozen: string[] = [];
  for (const inv of open) {
    if (inv.status !== "halted") {
      inv.status = "halted";
      frozen.push(inv.id);
    }
  }
  return frozen;
}

export function markSent(invoiceId: string, body: string): void {
  const inv = getInvoice(invoiceId);
  if (!inv) return;
  inv.thread.push({
    id: `m_${inv.thread.length + 1}_${invoiceId}`,
    direction: "out",
    body,
    status: "sent",
    createdAt: new Date().toISOString(),
  });
  inv.status = "sent";
}
