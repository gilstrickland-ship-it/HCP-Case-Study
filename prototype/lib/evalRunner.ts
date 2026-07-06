// ============================================================================
// Eval runner — runs each case in cases.json through the REAL agent pipeline
// (classify / gate / compose / triageReply), scores vs. expected, tags an error
// class, and enforces the P0 = 0 ship gate. See 05-eval-spec.md.
// ============================================================================

import type {
  AgentContext,
  AutonomyLevel,
  Customer,
  EvalCase,
  EvalCaseResult,
  EvalSummary,
  Invoice,
  Segment,
} from "./types";
import casesData from "./cases.json";
import { classify, compose, triageReply } from "./anthropic";
import { gate, hasLegalLanguage, stripLegalLanguage } from "./guardrails";
import { CONFIDENCE_BAR } from "./agent";

export const CASES = casesData as unknown as EvalCase[];

const DEFAULT_BASELINE_DSO = 18;
const PRO_NAME = "Dana's Plumbing & HVAC";

function buildCustomer(p: Partial<Customer> = {}): Customer {
  return {
    id: "c_eval",
    name: p.name ?? "Test Customer",
    relationship: p.relationship ?? "repeat",
    lifetimeRevenue: p.lifetimeRevenue ?? 2000,
    isVip: p.isVip ?? false,
    tenureMonths: p.tenureMonths ?? 12,
    timezone: p.timezone ?? "America/Chicago",
    customerDso: p.customerDso ?? 18,
    onTimeRate: p.onTimeRate ?? 0.8,
    priorLateCount: p.priorLateCount ?? 0,
    brokenPromiseCount: p.brokenPromiseCount ?? 0,
    priorDisputes: p.priorDisputes ?? 0,
    cardOnFile: p.cardOnFile ?? false,
  };
}

function buildInvoice(p: Partial<Invoice> = {}): Invoice {
  return {
    id: p.id ?? "INV-EVAL",
    customerId: "c_eval",
    jobTitle: p.jobTitle ?? "Service call",
    amount: p.amount ?? 300,
    daysOverdue: p.daysOverdue ?? 10,
    jobType: p.jobType ?? "scheduled",
    depositTaken: p.depositTaken ?? false,
    disputed: p.disputed ?? false,
    status: p.status ?? "overdue",
    segment: "unknown",
    confidence: 0,
    thread: [],
    scenarioReason: p.scenarioReason,
    remindersSent: p.remindersSent ?? 0,
  };
}

function buildContext(c: EvalCase): AgentContext {
  const ctxInput = c.input.context ?? {};
  const customer = buildCustomer(ctxInput.customer);
  const invoice = buildInvoice(ctxInput);
  const recentReply =
    (ctxInput as { recentReply?: string }).recentReply ?? c.input.reply;
  return {
    invoice,
    customer,
    relativeDso: customer.customerDso / DEFAULT_BASELINE_DSO,
    isVip: c.input.vip ?? customer.isVip,
    settings: {
      persistence: 45,
      tone: (c.input as { tone?: number }).tone ?? 40,
      leashDefault: "L1",
      segmentAutonomy: {
        forgot: "L1",
        cant_pay: "L1",
        disputes: "L0",
        wont_pay: "L1",
        unknown: "L1",
      },
      loopMeInThreshold: c.input.loopMeInThreshold ?? 2000,
      baselineDso: DEFAULT_BASELINE_DSO,
      vipIds: [],
      excludedVipIds: [],
    },
    nowLocalHour: c.input.localHour ?? 11,
    recentReply,
  };
}

function isPromiseBroken(promiseDate: string, today: string): boolean {
  return new Date(today).getTime() > new Date(promiseDate).getTime();
}

async function runCase(c: EvalCase): Promise<{
  got: Record<string, unknown>;
  escalatedOrHalted: boolean;
}> {
  const ctx = buildContext(c);

  if (c.kind === "reply") {
    const t = await triageReply(c.input.reply ?? "", ctx.customer.name);
    const halt = t.failureFlags.alreadyPaid || t.failureFlags.disputed;
    return {
      got: {
        intent: t.intent,
        halt,
        escalate: halt,
        freezeAll: t.failureFlags.alreadyPaid,
        promise: !!t.promiseDate || t.intent === "promise",
      },
      escalatedOrHalted: halt,
    };
  }

  if (c.kind === "promise") {
    return {
      got: {
        promiseBroken: isPromiseBroken(c.input.promiseDate!, c.input.today!),
      },
      escalatedOrHalted: false,
    };
  }

  if (c.kind === "tone") {
    const segment = (c.input.segment ?? "forgot") as Segment;
    const composed = await compose(ctx, segment, PRO_NAME);
    const body = ctx.isVip ? stripLegalLanguage(composed.body) : composed.body;
    return {
      got: { noLegalLanguage: !hasLegalLanguage(body), body },
      escalatedOrHalted: false,
    };
  }

  if (c.kind === "guardrail") {
    const segment = (c.input.segment ?? "forgot") as Segment;
    const autonomy: AutonomyLevel = c.input.segmentAutonomy ?? "L1";
    // Compose so we can enforce the VIP legal-language strip on the real body.
    const composed = await compose(ctx, segment, PRO_NAME);
    const body = ctx.isVip ? stripLegalLanguage(composed.body) : composed.body;
    const g = gate({
      invoice: ctx.invoice,
      effectiveSegment: segment,
      confidence: 0.9,
      confidenceBar: CONFIDENCE_BAR,
      autonomyLevel: autonomy,
      amount: ctx.invoice.amount,
      loopMeInThreshold: ctx.settings.loopMeInThreshold,
      isVip: ctx.isVip,
      localHour: ctx.nowLocalHour,
      composedBody: body,
    });
    return {
      got: {
        escalate: g.escalated,
        deferred: g.decision === "defer_quiet_hours",
        noAutoSend: g.decision !== "auto_send",
        noLegalLanguage: !hasLegalLanguage(body),
      },
      escalatedOrHalted: g.escalated || g.decision === "halt",
    };
  }

  // classify
  const r = await classify(ctx);
  const lowConf = r.confidence < CONFIDENCE_BAR;
  const effectiveSegment: Segment = lowConf ? "forgot" : r.reason;
  return {
    got: {
      segment: effectiveSegment,
      lowConfidenceFallback: lowConf,
      confidence: r.confidence,
      rawReason: r.reason,
    },
    escalatedOrHalted: false,
  };
}

function matches(expected: Record<string, unknown>, got: Record<string, unknown>): boolean {
  return Object.entries(expected).every(([k, v]) => got[k] === v);
}

export async function runEval(caseId?: number): Promise<{
  results: EvalCaseResult[];
  summary: EvalSummary;
}> {
  const toRun = caseId ? CASES.filter((c) => c.id === caseId) : CASES;
  const results: EvalCaseResult[] = [];

  for (const c of toRun) {
    const { got, escalatedOrHalted } = await runCase(c);
    const pass = matches(c.expected as Record<string, unknown>, got);
    results.push({
      id: c.id,
      title: c.title,
      pass,
      errorClass: pass ? null : c.errorClassOnMiss,
      expected: c.expected,
      got: { ...got, _escalatedOrHalted: escalatedOrHalted },
    });
  }

  // Summary
  const classifyCases = toRun.filter((c) => c.kind === "classify");
  const classifyPassed = results.filter(
    (r) => classifyCases.some((c) => c.id === r.id) && r.pass,
  ).length;

  const escalationCases = toRun.filter(
    (c) => c.expected.escalate === true || c.expected.halt === true,
  );
  const escalationHit = escalationCases.filter((c) => {
    const res = results.find((r) => r.id === c.id)!;
    return (res.got as { _escalatedOrHalted?: boolean })._escalatedOrHalted === true;
  }).length;

  const p0Cases = toRun.filter((c) => c.p0);
  const p0Failures = results.filter(
    (r) => !r.pass && p0Cases.some((c) => c.id === r.id),
  ).length;

  const summary: EvalSummary = {
    total: toRun.length,
    passed: results.filter((r) => r.pass).length,
    p0Count: p0Cases.length,
    p0Failures,
    p0Rate: p0Cases.length ? p0Failures / p0Cases.length : 0,
    classifyAccuracy: classifyCases.length ? classifyPassed / classifyCases.length : null,
    escalationRecall: escalationCases.length ? escalationHit / escalationCases.length : null,
    gatePassed: p0Failures === 0,
  };

  return { results, summary };
}
