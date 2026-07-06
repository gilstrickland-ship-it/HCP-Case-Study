// ============================================================================
// Domain types for the AI Collections Teammate prototype.
// See specs/001-collections-teammate/data-model.md
// ============================================================================

export type Segment =
  | "forgot"
  | "cant_pay"
  | "disputes"
  | "wont_pay"
  | "unknown";

export type AutonomyLevel = "L0" | "L1" | "L2";

export type InvoiceStatus = "overdue" | "sent" | "paid" | "halted";

export type MessageDirection = "out" | "in";
export type MessageStatus = "draft" | "queued" | "sent" | "deferred";
export type ReplyIntent =
  | "promise"
  | "dispute"
  | "already_paid"
  | "info_request"
  | "other";

export interface Customer {
  id: string;
  name: string;
  relationship: "repeat" | "new" | "member";
  lifetimeRevenue: number;
  isVip: boolean;
  tenureMonths: number;
  timezone: string; // IANA tz for customer-local quiet hours
  customerDso: number; // this customer's avg days-to-pay
  onTimeRate: number; // 0-1
  priorLateCount: number;
  brokenPromiseCount: number;
  priorDisputes: number;
  cardOnFile: boolean;
}

export interface Message {
  id: string;
  direction: MessageDirection;
  body: string;
  status: MessageStatus;
  intent?: ReplyIntent | null;
  promiseDate?: string | null;
  createdAt: string;
}

export interface Invoice {
  id: string;
  customerId: string;
  jobTitle: string;
  amount: number;
  daysOverdue: number;
  jobType: "emergency" | "scheduled" | "commercial" | "insurance";
  depositTaken: boolean;
  disputed: boolean;
  status: InvoiceStatus;
  segment: Segment;
  confidence: number; // 0-1 from last classification
  rationale?: string; // one-line "why unpaid" from last classification (shown in the list)
  thread: Message[];
  // demo scaffolding: a canned inbound reply the panel can trigger, and a hint
  // that lets the deterministic fallback classifier stay realistic offline.
  scenarioReason?: Segment;
  suggestedReply?: string;
  remindersSent?: number;
}

export interface ProSettings {
  persistence: number; // 0-100 gentle -> keep at it
  tone: number; // 0-100 warm -> firm
  leashDefault: AutonomyLevel;
  segmentAutonomy: Record<Segment, AutonomyLevel>;
  loopMeInThreshold: number; // dollars
  baselineDso: number; // the Pro's own average
  vipIds: string[];
  excludedVipIds: string[]; // auto-VIPs the Pro has explicitly removed
}

// Assembled context the agent reads before acting (the 5 buckets).
export interface AgentContext {
  invoice: Invoice;
  customer: Customer;
  relativeDso: number; // customerDso / baselineDso
  isVip: boolean;
  settings: ProSettings;
  nowLocalHour: number; // customer-local hour, for quiet-hours checks
  recentReply?: string; // last inbound reply, if any — informs classification
}

export type GateDecision =
  | "auto_send"
  | "queue_for_review"
  | "escalate"
  | "defer_quiet_hours"
  | "halt";

export interface GateResult {
  decision: GateDecision;
  reasons: string[]; // human-readable why (shown in UI)
  escalated: boolean;
  guardrailsFired: string[]; // machine tags: quiet_hours, threshold, vip, autonomy, already_paid, dispute, low_confidence
}

export interface ClassifyResult {
  reason: Segment;
  confidence: number;
  rationale: string;
  source: "llm" | "fallback";
}

export interface ComposeResult {
  body: string;
  source: "llm" | "fallback";
}

export interface ReplyResult {
  intent: ReplyIntent;
  promiseDate: string | null;
  failureFlags: { alreadyPaid: boolean; disputed: boolean };
  draft: string;
  source: "llm" | "fallback";
}

// Full result of running the agent on one invoice.
export interface ProcessResult {
  classify: ClassifyResult;
  effectiveSegment: Segment; // after low-confidence fallback
  play: string;
  compose: ComposeResult;
  gate: GateResult;
  autonomyLevel: AutonomyLevel;
}

// ---- Eval ------------------------------------------------------------------
export type ErrorClass = "P0" | "P1" | "P2" | "P3";

export interface EvalCase {
  id: number;
  title: string;
  kind: "classify" | "guardrail" | "reply" | "tone" | "promise";
  input: {
    context?: Partial<Invoice> & { customer?: Partial<Customer> };
    reply?: string;
    localHour?: number;
    segment?: Segment; // for guardrail/tone: the segment to compose/gate for
    segmentAutonomy?: AutonomyLevel;
    loopMeInThreshold?: number;
    vip?: boolean;
    promiseDate?: string; // for promise case
    today?: string; // for promise case
  };
  expected: {
    segment?: Segment;
    lowConfidenceFallback?: boolean;
    escalate?: boolean;
    halt?: boolean;
    freezeAll?: boolean;
    deferred?: boolean;
    noAutoSend?: boolean;
    intent?: ReplyIntent;
    promise?: boolean;
    promiseBroken?: boolean;
    noLegalLanguage?: boolean;
  };
  p0: boolean;
  errorClassOnMiss: ErrorClass;
}

export interface EvalCaseResult {
  id: number;
  title: string;
  pass: boolean;
  errorClass: ErrorClass | null;
  expected: EvalCase["expected"];
  got: Record<string, unknown>;
}

export interface EvalSummary {
  total: number;
  passed: number;
  p0Count: number;
  p0Failures: number;
  p0Rate: number;
  classifyAccuracy: number | null;
  escalationRecall: number | null;
  gatePassed: boolean;
}
