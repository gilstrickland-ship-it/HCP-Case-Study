// ============================================================================
// Agent orchestration: the core loop from PRD §5.
// buildContext -> classify -> confidence fallback -> selectPlay -> compose ->
// gate. The gate (guardrails.ts) is the ONLY thing that decides send/queue/halt.
// ============================================================================

import type {
  AgentContext,
  AutonomyLevel,
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
import { classify, compose } from "./anthropic";
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

// Run the full loop on one invoice. Pure w.r.t. the store except it reads it.
export async function processInvoice(
  invoice: Invoice,
  opts: { localHour?: number } = {},
): Promise<ProcessResult> {
  const ctx = buildContext(invoice, opts.localHour);
  const settings = ctx.settings;

  // 1. classify
  const classifyResult = await classify(ctx);

  // 2. confidence fallback (constitution III): below the bar -> safe "forgot".
  const lowConfidence = classifyResult.confidence < CONFIDENCE_BAR;
  const effectiveSegment: Segment = lowConfidence ? "forgot" : classifyResult.reason;

  // 3. select play + autonomy level for the *effective* segment
  const autonomyLevel: AutonomyLevel =
    settings.segmentAutonomy[effectiveSegment] ?? settings.leashDefault;

  // 4. compose (skip a real ask if the invoice is already disputed — draft a pause)
  const composeResult = await compose(ctx, effectiveSegment, PRO.name);

  // VIP legal-language hard strip (never trust the model on a hard stop).
  let body = composeResult.body;
  if (ctx.isVip && hasLegalLanguage(body)) {
    body = stripLegalLanguage(body);
  }
  const finalCompose = { ...composeResult, body };

  // 5. gate — the single decision point.
  const gateResult = gate({
    invoice,
    effectiveSegment,
    confidence: classifyResult.confidence,
    confidenceBar: CONFIDENCE_BAR,
    autonomyLevel,
    amount: invoice.amount,
    loopMeInThreshold: settings.loopMeInThreshold,
    isVip: ctx.isVip,
    localHour: ctx.nowLocalHour,
    composedBody: body,
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
