// ============================================================================
// Weighted-recovery scoring (PRD §7 / framing §7).
// "Hard wins count more": recovery uplift over baseline × dollars at risk,
// weighted up by amount, days overdue, and customer risk (relative DSO vs. the
// Pro's own average). This ranks the AR list and credits the wins dashboard, so
// the agent cannot game the metric by cherry-picking sure-payers.
// ============================================================================

import type { Customer, Invoice, ProSettings } from "./types";

export function relativeDso(customer: Customer, settings: ProSettings): number {
  if (!settings.baselineDso) return 1;
  return customer.customerDso / settings.baselineDso;
}

// Estimated probability the invoice self-resolves (pays on its own without help).
// Higher = would have come in anyway = LOWER uplift from the agent acting.
function selfResolveProbability(inv: Invoice, customer: Customer): number {
  let p = customer.onTimeRate; // good payers self-resolve more
  p -= Math.min(0.4, inv.daysOverdue / 120); // the longer overdue, the less likely
  p -= customer.brokenPromiseCount * 0.1;
  if (inv.disputed) p -= 0.3;
  return Math.max(0.05, Math.min(0.95, p));
}

// Uplift = the share of recovery genuinely attributable to the agent (1 - p_self).
export function recoveryUplift(inv: Invoice, customer: Customer): number {
  return 1 - selfResolveProbability(inv, customer);
}

// Priority score used to rank "who to chase". Blends dollars at risk, uplift,
// age, and relative-DSO risk. Returned unbounded; used only for ordering.
export function priorityScore(
  inv: Invoice,
  customer: Customer,
  settings: ProSettings,
): number {
  const dollarsAtRisk = inv.amount;
  const uplift = recoveryUplift(inv, customer);
  const ageWeight = 1 + Math.min(2, inv.daysOverdue / 30);
  const riskWeight = 0.5 + Math.min(2, relativeDso(customer, settings));
  return dollarsAtRisk * uplift * ageWeight * riskWeight;
}

// Weighted credit the agent earns for actually recovering this invoice.
// Same shape as priority but expressed in "weighted dollars".
export function weightedRecoveryCredit(
  inv: Invoice,
  customer: Customer,
  settings: ProSettings,
): number {
  const uplift = recoveryUplift(inv, customer);
  const riskWeight = 0.5 + Math.min(2, relativeDso(customer, settings));
  return Math.round(inv.amount * uplift * riskWeight);
}

export function fmtMoney(n: number): string {
  return "$" + n.toLocaleString("en-US");
}
