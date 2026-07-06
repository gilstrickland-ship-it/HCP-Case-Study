// ============================================================================
// Claude client + graceful fallback (constitution: real Claude, never dead-ends).
// classify() and triageReply() infer; compose() writes. Each tries the live API
// and, on missing key / error, returns a deterministic scenario-keyed response so
// a live demo survives a bad key or a rate limit.
// ============================================================================

import Anthropic from "@anthropic-ai/sdk";
import type {
  AgentContext,
  ClassifyResult,
  ComposeResult,
  ReplyResult,
  Segment,
} from "./types";

const MODEL_CLASSIFY = process.env.AI_MODEL_CLASSIFY || "claude-haiku-4-5";
const MODEL_COMPOSE = process.env.AI_MODEL_COMPOSE || "claude-sonnet-5";

function client(): Anthropic | null {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  return new Anthropic({ apiKey });
}

export function hasLiveKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Extract the first JSON object from a model response (handles code fences/prose).
function parseJson<T>(text: string): T {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fenced ? fenced[1] : text;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json in model output");
  return JSON.parse(body.slice(start, end + 1)) as T;
}

async function callJson<T>(model: string, system: string, user: string): Promise<T> {
  const c = client();
  if (!c) throw new Error("no-key");
  const resp = await c.messages.create({
    model,
    max_tokens: 700,
    system,
    messages: [{ role: "user", content: user }],
  });
  const text = resp.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");
  return parseJson<T>(text);
}

// ---------------------------------------------------------------------------
// Context summary shared by classify + compose prompts.
// ---------------------------------------------------------------------------
function contextBlurb(ctx: AgentContext): string {
  const { invoice: i, customer: c, relativeDso } = ctx;
  const lines = [
    `Customer: ${c.name} (${c.relationship}, ${c.tenureMonths}mo, lifetime $${c.lifetimeRevenue}).`,
    `On-time rate ${(c.onTimeRate * 100).toFixed(0)}%, prior late ${c.priorLateCount}, broken promises ${c.brokenPromiseCount}, prior disputes ${c.priorDisputes}, card on file: ${c.cardOnFile}.`,
    `This customer's DSO ${c.customerDso}d vs the Pro's baseline ${ctx.settings.baselineDso}d (relative ${relativeDso.toFixed(2)}x).`,
    `Invoice ${i.id}: "${i.jobTitle}", $${i.amount}, ${i.daysOverdue} days overdue, ${i.jobType} job, deposit taken: ${i.depositTaken}, reminders already sent: ${i.remindersSent ?? 0}.`,
  ];
  if (ctx.recentReply) {
    lines.push(`Most recent customer reply: "${ctx.recentReply}"`);
  }
  return lines.join("\n");
}

// ===========================================================================
// classify — why is this invoice unpaid?
// ===========================================================================
const CLASSIFY_SYSTEM = `You are the classification brain of an accounts-receivable assistant for home-service pros.
Classify WHY an overdue invoice is unpaid into exactly one of:
- "forgot": likely an oversight; good payer, not long overdue, no signal of trouble.
- "cant_pay": affordability/cash-flow pressure.
- "disputes": disagrees with the charge / believes it's wrong.
- "wont_pay": able but unwilling; ignored repeated contact, poor history.
When signals are thin or contradictory, return LOW confidence (below 0.6) rather than guessing a specific reason.
Respond ONLY with JSON: {"reason": <one of the four>, "confidence": <0..1>, "rationale": "<one sentence>"}`;

export async function classify(ctx: AgentContext): Promise<ClassifyResult> {
  try {
    const out = await callJson<{ reason: Segment; confidence: number; rationale: string }>(
      MODEL_CLASSIFY,
      CLASSIFY_SYSTEM,
      `Context:\n${contextBlurb(ctx)}\n\nClassify the non-payment reason.`,
    );
    const reason = (["forgot", "cant_pay", "disputes", "wont_pay"] as Segment[]).includes(out.reason)
      ? out.reason
      : "unknown";
    return {
      reason,
      confidence: Math.max(0, Math.min(1, out.confidence)),
      rationale: out.rationale || "",
      source: "llm",
    };
  } catch {
    return fallbackClassify(ctx);
  }
}

function fallbackClassify(ctx: AgentContext): ClassifyResult {
  const { invoice: i, customer: c, relativeDso } = ctx;

  // A recent reply is the strongest signal — read it first.
  if (ctx.recentReply) {
    const t = ctx.recentReply.toLowerCase();
    if (/(tight|can'?t afford|short on cash|money'?s|cash ?flow|pay in|a couple weeks|two weeks|next paycheck)/.test(t))
      return { reason: "cant_pay", confidence: 0.86, rationale: "Reply signals cash-flow pressure.", source: "fallback" };
    if (/(not the price|didn'?t agree|too (high|much)|overcharg|wrong (amount|price|charge)|isn'?t right|dispute)/.test(t))
      return { reason: "disputes", confidence: 0.88, rationale: "Reply challenges the charge itself.", source: "fallback" };
  }

  const hint = i.scenarioReason;
  // The mock carries a ground-truth hint; use it, but derive an honest confidence.
  if (hint && hint !== "unknown") {
    let conf = 0.82;
    if (hint === "wont_pay" && (i.remindersSent ?? 0) >= 3 && relativeDso > 1.5) conf = 0.9;
    if (hint === "forgot" && i.daysOverdue <= 8 && c.onTimeRate >= 0.85) conf = 0.88;
    return { reason: hint, confidence: conf, rationale: fallbackRationale(hint), source: "fallback" };
  }
  // Ambiguous: thin history, mid-age, no strong signal -> low confidence.
  return {
    reason: "forgot",
    confidence: 0.42,
    rationale: "Thin history and no reply — not enough signal to name a specific reason.",
    source: "fallback",
  };
}

function fallbackRationale(seg: Segment): string {
  switch (seg) {
    case "forgot": return "Good payer, only lightly overdue — reads like an oversight.";
    case "cant_pay": return "Signals point to cash-flow pressure rather than unwillingness.";
    case "disputes": return "Customer is questioning the charge itself.";
    case "wont_pay": return "Repeated contact ignored and poor history — able but unwilling.";
    default: return "";
  }
}

// ===========================================================================
// compose — write the follow-up in the Pro's voice.
// ===========================================================================
function toneWord(tone: number): string {
  if (tone < 33) return "warm and neighborly";
  if (tone < 66) return "friendly but clear";
  return "firm and businesslike (never threatening, never legal)";
}
function persistenceWord(p: number): string {
  if (p < 33) return "a gentle single nudge";
  if (p < 66) return "a clear reminder";
  return "a more insistent follow-up (still respectful)";
}

const COMPOSE_SYSTEM = `You write SMS-length payment follow-ups for a home-service pro, in the pro's own friendly voice.
Rules: 1-3 short sentences. Include a clear call to action and mention a pay link ("your pay link"). Never use legal, collections, threat, or debt language. Never mention lawyers, liens, courts, or credit. Sign as the business. Return ONLY JSON: {"body": "<message>"}`;

export async function compose(
  ctx: AgentContext,
  segment: Segment,
  proName: string,
): Promise<ComposeResult> {
  const { customer: c, invoice: i, settings } = ctx;
  const playGuidance: Record<Segment, string> = {
    forgot: "Assume it simply slipped their mind. Light, no pressure.",
    cant_pay: "Acknowledge things can get tight; offer flexibility (a little more time or splitting it up). No pressure, no shame.",
    disputes: "Do NOT ask for payment. Acknowledge they have a question about the charge and offer to talk it through.",
    wont_pay: "Be clear and businesslike about the outstanding balance and next step to resolve it — still respectful, no threats.",
    unknown: "Keep it a gentle, friendly nudge — the safest message.",
  };
  try {
    const out = await callJson<{ body: string }>(
      MODEL_COMPOSE,
      COMPOSE_SYSTEM,
      `Business: ${proName}. Customer first name: ${c.name.split(" ")[0]}.
Invoice: "${i.jobTitle}", $${i.amount}, ${i.daysOverdue} days overdue.
Tone: ${toneWord(settings.tone)}. Persistence: ${persistenceWord(settings.persistence)}.
Segment play (${segment}): ${playGuidance[segment]}
Write the message.`,
    );
    return { body: out.body.trim(), source: "llm" };
  } catch {
    return { body: fallbackCompose(ctx, segment, proName), source: "fallback" };
  }
}

function fallbackCompose(ctx: AgentContext, segment: Segment, proName: string): string {
  const first = ctx.customer.name.split(" ")[0];
  const { invoice: i, settings } = ctx;
  const firm = settings.tone >= 66;
  switch (segment) {
    case "cant_pay":
      return `Hi ${first}, ${proName} here. Totally understand things can get tight — your $${i.amount} balance for the ${i.jobTitle.toLowerCase()} is still open. Happy to split it into a couple of payments if that helps; just use your pay link or reply here. Thanks!`;
    case "disputes":
      return `Hi ${first}, ${proName} here. Sounds like you have a question about the charge for the ${i.jobTitle.toLowerCase()} — I don't want to chase anything that isn't right. Can we hop on a quick call so I can make sure it's correct?`;
    case "wont_pay":
      return firm
        ? `Hi ${first}, this is ${proName} following up on the $${i.amount} balance for the ${i.jobTitle.toLowerCase()}, now ${i.daysOverdue} days past due. Please settle it with your pay link, or reply so we can sort out a path to close it out.`
        : `Hi ${first}, ${proName} again about the $${i.amount} for the ${i.jobTitle.toLowerCase()} — it's ${i.daysOverdue} days overdue now. Can you take care of it this week with your pay link, or let me know what's going on?`;
    default: // forgot / unknown
      return `Hi ${first}! ${proName} here — just a friendly reminder that your $${i.amount} invoice for the ${i.jobTitle.toLowerCase()} is due. No worries if it slipped your mind — you can pay in a tap with your pay link. Thank you!`;
  }
}

// ===========================================================================
// triageReply — classify an inbound reply, capture promise, flag failures.
// ===========================================================================
const REPLY_SYSTEM = `You triage a customer's reply to a payment reminder for a home-service pro.
Classify intent as one of: "promise" (says when they'll pay), "dispute" (questions/challenges the charge), "already_paid" (claims already paid), "info_request" (asks what it's for), "other".
Set alreadyPaid=true ONLY if they claim they already paid. Set disputed=true if they challenge the charge.
If a promise, extract promiseDate as an ISO date (yyyy-mm-dd) if you can infer one, else null.
Draft a short, warm reply — but if alreadyPaid or disputed, the draft must be an apology/pause that does NOT ask for payment.
Return ONLY JSON: {"intent": "...", "promiseDate": "yyyy-mm-dd"|null, "alreadyPaid": bool, "disputed": bool, "draft": "..."}`;

export async function triageReply(reply: string, customerName: string): Promise<ReplyResult> {
  try {
    const out = await callJson<{
      intent: ReplyResult["intent"];
      promiseDate: string | null;
      alreadyPaid: boolean;
      disputed: boolean;
      draft: string;
    }>(MODEL_COMPOSE, REPLY_SYSTEM, `Customer: ${customerName}. Reply: "${reply}"`);
    return {
      intent: out.intent,
      promiseDate: out.promiseDate ?? null,
      failureFlags: { alreadyPaid: !!out.alreadyPaid, disputed: !!out.disputed },
      draft: out.draft.trim(),
      source: "llm",
    };
  } catch {
    return fallbackTriage(reply, customerName);
  }
}

function fallbackTriage(reply: string, customerName: string): ReplyResult {
  const first = customerName.split(" ")[0];
  const t = reply.toLowerCase();
  const alreadyPaid = /(already paid|paid (this|it|that)|paid last|i paid|payment went|paid you)/.test(t);
  const disputed = /(not the price|price we agreed|agreed on|didn'?t agree|did not agree|quoted|too (high|much)|overcharg|wrong (amount|price|charge)|dispute|isn'?t (right|the price|what)|not right|charge is wrong|never (agreed|approved))/.test(t);
  const promise = /(i'?ll pay|pay (you )?(on |next |this |by )?(friday|monday|tuesday|wednesday|thursday|saturday|sunday|week|month|tomorrow)|pay in )/.test(t);
  const info = /(what'?s this|what is this|what for|what'?s it for|remind me what)/.test(t);

  if (alreadyPaid) {
    return {
      intent: "already_paid",
      promiseDate: null,
      failureFlags: { alreadyPaid: true, disputed: false },
      draft: `So sorry ${first} — thank you for flagging that. I'm pausing all reminders while I check our records. I'll confirm and make it right shortly.`,
      source: "fallback",
    };
  }
  if (disputed) {
    return {
      intent: "dispute",
      promiseDate: null,
      failureFlags: { alreadyPaid: false, disputed: true },
      draft: `Thanks for letting me know, ${first} — I don't want to charge anything that isn't right. Let me pull up the job details and give you a call so we can sort it out.`,
      source: "fallback",
    };
  }
  if (promise) {
    const day = (t.match(/friday|monday|tuesday|wednesday|thursday|saturday|sunday|tomorrow|next week|this week/) || [null])[0];
    return {
      intent: "promise",
      promiseDate: day,
      failureFlags: { alreadyPaid: false, disputed: false },
      draft: `Perfect, thanks ${first}! I'll note you're planning to pay ${day ?? "soon"}. Your pay link's in the last message whenever you're ready.`,
      source: "fallback",
    };
  }
  if (info) {
    return {
      intent: "info_request",
      promiseDate: null,
      failureFlags: { alreadyPaid: false, disputed: false },
      draft: `Happy to help, ${first}! This invoice is for the work we completed on your job. I can send the itemized breakdown — want me to text it over?`,
      source: "fallback",
    };
  }
  return {
    intent: "other",
    promiseDate: null,
    failureFlags: { alreadyPaid: false, disputed: false },
    draft: `Thanks ${first} — let me look into that and get right back to you.`,
    source: "fallback",
  };
}
