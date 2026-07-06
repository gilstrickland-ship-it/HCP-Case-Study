// ============================================================================
// Mock data for the prototype — a realistic book of business for one Pro.
// Honest demo data (constitution V): not a live integration. Module-level store
// mutates within a server session; state resets on restart, which is fine for a
// demo. See specs/001-collections-teammate/data-model.md
// ============================================================================

import type { AutonomyLevel, Customer, Invoice, ProSettings, Segment } from "./types";

// The Pro: Dana's Plumbing & HVAC, a ~4-person shop.
export const PRO = { name: "Dana's Plumbing & HVAC", owner: "Dana R." };

const customers: Customer[] = [
  {
    id: "c_meadows",
    name: "Karen Meadows",
    relationship: "repeat",
    lifetimeRevenue: 8400,
    isVip: false,
    tenureMonths: 26,
    timezone: "America/Denver",
    customerDso: 16,
    onTimeRate: 0.92,
    priorLateCount: 1,
    brokenPromiseCount: 0,
    priorDisputes: 0,
    cardOnFile: true,
  },
  {
    id: "c_alvarez",
    name: "Miguel Alvarez",
    relationship: "repeat",
    lifetimeRevenue: 5200,
    isVip: false,
    tenureMonths: 14,
    timezone: "America/Chicago",
    customerDso: 24,
    onTimeRate: 0.7,
    priorLateCount: 2,
    brokenPromiseCount: 0,
    priorDisputes: 0,
    cardOnFile: false,
  },
  {
    id: "c_whitfield",
    name: "Whitfield Property Group",
    relationship: "member",
    lifetimeRevenue: 41200,
    isVip: true, // high lifetime revenue -> auto VIP
    tenureMonths: 40,
    timezone: "America/New_York",
    customerDso: 30,
    onTimeRate: 0.8,
    priorLateCount: 3,
    brokenPromiseCount: 0,
    priorDisputes: 1,
    cardOnFile: false,
  },
  {
    id: "c_tran",
    name: "Lily Tran",
    relationship: "repeat",
    lifetimeRevenue: 3100,
    isVip: false,
    tenureMonths: 18,
    timezone: "America/Los_Angeles",
    customerDso: 12,
    onTimeRate: 0.95,
    priorLateCount: 0,
    brokenPromiseCount: 0,
    priorDisputes: 0,
    cardOnFile: true,
  },
  {
    id: "c_boyd",
    name: "Randall Boyd",
    relationship: "new",
    lifetimeRevenue: 950,
    isVip: false,
    tenureMonths: 2,
    timezone: "America/Chicago",
    customerDso: 52,
    onTimeRate: 0.3,
    priorLateCount: 3,
    brokenPromiseCount: 2,
    priorDisputes: 0,
    cardOnFile: false,
  },
  {
    id: "c_okafor",
    name: "Grace Okafor",
    relationship: "new",
    lifetimeRevenue: 480,
    isVip: false,
    tenureMonths: 1,
    timezone: "America/New_York",
    customerDso: 20,
    onTimeRate: 0.5,
    priorLateCount: 1,
    brokenPromiseCount: 0,
    priorDisputes: 0,
    cardOnFile: false,
  },
  {
    id: "c_delgado",
    name: "Sofia Delgado",
    relationship: "repeat",
    lifetimeRevenue: 6700,
    isVip: false,
    tenureMonths: 22,
    timezone: "America/Denver",
    customerDso: 15,
    onTimeRate: 0.9,
    priorLateCount: 1,
    brokenPromiseCount: 0,
    priorDisputes: 0,
    cardOnFile: true,
  },
];

const now = "2026-07-06T09:00:00Z";

const invoices: Invoice[] = [
  // 1. FORGOT — small, good history, few days overdue. Safe nudge. (eval #1)
  {
    id: "INV-2041",
    customerId: "c_meadows",
    jobTitle: "Water heater flush",
    amount: 180,
    daysOverdue: 6,
    jobType: "scheduled",
    depositTaken: false,
    disputed: false,
    status: "overdue",
    segment: "forgot",
    confidence: 0.88,
    rationale: "Good payer, only lightly overdue — reads like an oversight.",
    thread: [],
    scenarioReason: "forgot",
    remindersSent: 0,
  },
  // 2. CAN'T PAY — reply says money is tight. (eval #2)
  {
    id: "INV-2044",
    customerId: "c_alvarez",
    jobTitle: "Sewer line repair",
    amount: 1450,
    daysOverdue: 18,
    jobType: "emergency",
    depositTaken: false,
    disputed: false,
    status: "overdue",
    segment: "cant_pay",
    confidence: 0.82,
    rationale: "Signals point to cash-flow pressure rather than unwillingness.",
    thread: [],
    scenarioReason: "cant_pay",
    suggestedReply: "Hey, money's really tight this month — can I pay in 2 weeks?",
    remindersSent: 1,
  },
  // 3. DISPUTES — reply challenges the price. (eval #3)
  {
    id: "INV-2049",
    customerId: "c_delgado",
    jobTitle: "AC condenser replacement",
    amount: 2380,
    daysOverdue: 12,
    jobType: "scheduled",
    depositTaken: true,
    disputed: false,
    status: "overdue",
    segment: "disputes",
    confidence: 0.82,
    rationale: "Customer is questioning the charge itself.",
    thread: [],
    scenarioReason: "disputes",
    suggestedReply: "This isn't the price we agreed on — you quoted me way less.",
    remindersSent: 1,
  },
  // 4. ALREADY PAID — the cardinal failure. (eval #4)
  {
    id: "INV-2033",
    customerId: "c_tran",
    jobTitle: "Faucet + disposal install",
    amount: 640,
    daysOverdue: 9,
    jobType: "scheduled",
    depositTaken: false,
    disputed: false,
    status: "overdue",
    segment: "forgot",
    confidence: 0.82,
    rationale: "Good payer, only lightly overdue — reads like an oversight.",
    thread: [],
    scenarioReason: "forgot",
    suggestedReply: "I already paid this last week — check your records.",
    remindersSent: 2,
  },
  // 4b. Second open invoice for the same customer as #4, so the "already paid"
  // halt visibly freezes MORE THAN ONE invoice (constitution IV).
  {
    id: "INV-2039",
    customerId: "c_tran",
    jobTitle: "Kitchen shutoff valve",
    amount: 210,
    daysOverdue: 4,
    jobType: "scheduled",
    depositTaken: false,
    disputed: false,
    status: "overdue",
    segment: "forgot",
    confidence: 0.88,
    rationale: "Good payer, only lightly overdue — reads like an oversight.",
    thread: [],
    scenarioReason: "forgot",
    remindersSent: 0,
  },
  // 5. WON'T PAY — 45 days, reminders ignored, high relative DSO. (eval #5)
  {
    id: "INV-2018",
    customerId: "c_boyd",
    jobTitle: "Drain cleaning",
    amount: 320,
    daysOverdue: 45,
    jobType: "emergency",
    depositTaken: false,
    disputed: false,
    status: "overdue",
    segment: "wont_pay",
    confidence: 0.9,
    rationale: "Repeated contact ignored and poor history — able but unwilling.",
    thread: [],
    scenarioReason: "wont_pay",
    remindersSent: 3,
  },
  // 6. AMBIGUOUS — 20 days, thin history, no reply. Low confidence. (eval #6)
  {
    id: "INV-2052",
    customerId: "c_okafor",
    jobTitle: "Toilet replacement",
    amount: 410,
    daysOverdue: 20,
    jobType: "scheduled",
    depositTaken: false,
    disputed: false,
    status: "overdue",
    segment: "unknown",
    confidence: 0.42,
    rationale: "Thin history and no reply — not enough signal to name a specific reason.",
    thread: [],
    scenarioReason: "unknown",
    remindersSent: 1,
  },
  // 7. OVER THRESHOLD + VIP — big commercial balance for a VIP. (eval #8, #9)
  {
    id: "INV-2007",
    customerId: "c_whitfield",
    jobTitle: "Rooftop HVAC unit — Building C",
    amount: 6200,
    daysOverdue: 28,
    jobType: "commercial",
    depositTaken: true,
    disputed: false,
    status: "overdue",
    segment: "cant_pay",
    confidence: 0.82,
    rationale: "Signals point to cash-flow pressure rather than unwillingness.",
    thread: [],
    scenarioReason: "cant_pay",
    remindersSent: 2,
  },
  // 8. PROMISE case — a customer who will say "I'll pay Friday". (eval #11/#12)
  {
    id: "INV-2046",
    customerId: "c_alvarez",
    jobTitle: "Garbage disposal replacement",
    amount: 280,
    daysOverdue: 10,
    jobType: "scheduled",
    depositTaken: false,
    disputed: false,
    status: "overdue",
    segment: "forgot",
    confidence: 0.82,
    rationale: "Good payer, only lightly overdue — reads like an oversight.",
    thread: [],
    scenarioReason: "forgot",
    suggestedReply: "I'll pay Friday, promise.",
    remindersSent: 1,
  },
];

// ---- Pro settings (defaults) ----------------------------------------------
const settings: ProSettings = {
  persistence: 45,
  tone: 35, // leans warm/neighborly
  leashDefault: "L1",
  segmentAutonomy: {
    forgot: "L2", // earned auto-send on the safe segment
    cant_pay: "L1",
    disputes: "L0",
    wont_pay: "L1",
    unknown: "L1",
  },
  loopMeInThreshold: 2000,
  baselineDso: 18,
  vipIds: ["c_whitfield"],
  excludedVipIds: [],
};

// ---- Demo seed: recent wins + per-segment track record --------------------
// Clearly demonstration data (constitution V) — powers the wins dashboard.
export interface Recovery {
  id: string;
  customer: string;
  amount: number;
  weighted: number;
  zeroTouch: boolean;
  segment: Segment;
  daysToRecover: number;
}

export const RECOVERIES: Recovery[] = [
  { id: "INV-1990", customer: "Priya Nair", amount: 240, weighted: 190, zeroTouch: true, segment: "forgot", daysToRecover: 2 },
  { id: "INV-1985", customer: "Randall Boyd", amount: 610, weighted: 1160, zeroTouch: false, segment: "wont_pay", daysToRecover: 9 },
  { id: "INV-1979", customer: "Sofia Delgado", amount: 380, weighted: 300, zeroTouch: true, segment: "forgot", daysToRecover: 3 },
  { id: "INV-1972", customer: "Cole Barrera", amount: 1520, weighted: 2140, zeroTouch: false, segment: "cant_pay", daysToRecover: 12 },
  { id: "INV-1965", customer: "Priya Nair", amount: 150, weighted: 120, zeroTouch: true, segment: "forgot", daysToRecover: 1 },
];

export interface SegmentTrack {
  segment: Segment;
  proposed: number;
  approvedUnedited: number;
  level: AutonomyLevel;
  offerL2: boolean; // is the agent ready to offer an auto-send bump?
}

export const SEGMENT_TRACK: SegmentTrack[] = [
  { segment: "forgot", proposed: 41, approvedUnedited: 39, level: "L2", offerL2: false },
  { segment: "cant_pay", proposed: 14, approvedUnedited: 12, level: "L1", offerL2: true },
  { segment: "wont_pay", proposed: 9, approvedUnedited: 6, level: "L1", offerL2: false },
  { segment: "disputes", proposed: 5, approvedUnedited: 5, level: "L0", offerL2: false },
];

// Demo DSO trend (constitution V: labeled demo, vs. the Pro's own baseline).
export const DSO_SNAPSHOT = { baseline: 24, current: 18 };

// ---- In-memory store + accessors ------------------------------------------
const store = { customers, invoices, settings, now };

export function getCustomers(): Customer[] {
  return store.customers;
}
export function getCustomer(id: string): Customer | undefined {
  return store.customers.find((c) => c.id === id);
}
export function getInvoices(): Invoice[] {
  return store.invoices;
}
export function getInvoice(id: string): Invoice | undefined {
  return store.invoices.find((i) => i.id === id);
}
export function getOpenInvoicesForCustomer(customerId: string): Invoice[] {
  return store.invoices.filter(
    (i) => i.customerId === customerId && i.status !== "paid",
  );
}
export function getSettings(): ProSettings {
  return store.settings;
}
export function updateSettings(patch: Partial<ProSettings>): ProSettings {
  store.settings = { ...store.settings, ...patch };
  return store.settings;
}
export function isVip(customerId: string): boolean {
  const c = getCustomer(customerId);
  if (!c) return false;
  if (store.settings.vipIds.includes(customerId)) return true;
  return c.isVip && !store.settings.excludedVipIds.includes(customerId);
}
