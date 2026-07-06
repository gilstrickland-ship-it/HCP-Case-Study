# Feature Specification: AI Collections Teammate

**Feature Branch**: `feat/prototype` (Spec Kit id `001-collections-teammate`)
**Created**: 2026-07-06
**Status**: Approved
**Input**: Build a working, demoable prototype of the AI Collections Teammate for the
Housecall Pro FinTech case study, per
[`03-prd.md`](../../../../Case%20Study%20Artifacts/03-prd.md) and
[`05-eval-spec.md`](../../../../Case%20Study%20Artifacts/05-eval-spec.md).

Acronyms at first use: AR = accounts receivable; DSO = days sales outstanding; VIP =
a customer flagged for extra care; LLM = large language model; HCP = Housecall Pro;
P0 = most-severe error class.

This spec references — and does not re-derive — the existing
[problem framing](../../../../Case%20Study%20Artifacts/01-problem-framing.md),
[PRD](../../../../Case%20Study%20Artifacts/03-prd.md), and
[eval spec](../../../../Case%20Study%20Artifacts/05-eval-spec.md).

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Review & send the right follow-up on an overdue invoice (Priority: P1) 🎯 MVP

The Pro opens an overdue invoice, sees the assembled customer context and the agent's
inferred non-payment reason with a confidence score, reads a draft written in their
voice for that segment, and either approves/edits/sends it or (for a low-risk segment
already earned) sees that it was auto-sent. This is the core loop and the demo spine.

**Why this priority**: It is the product. Everything else (dashboard, settings, eval)
frames or governs this one interaction. Delivers value alone: the Pro stops composing
and starts reviewing.

**Independent Test**: Open any overdue invoice → confirm 5-bucket context, a
reason+confidence, and a segment-appropriate draft appear; approve/edit/send works;
an L2 low-risk invoice shows as auto-sent while everything else stays draft-only.

**Acceptance Scenarios**:

1. **Given** a 6-day-overdue small invoice with good history, **When** the Pro opens
   it, **Then** the agent classifies "forgot" and shows a gentle-nudge draft.
2. **Given** a low-confidence read on an ambiguous invoice, **When** the agent
   classifies, **Then** it falls back to the gentle "forgot" nudge, not a firm play.
3. **Given** a segment at L1 (draft-only), **When** a safe nudge is ready, **Then** it
   is queued for approval and NOT auto-sent.

### User Story 2 - Handle a customer reply, including the cardinal failure (Priority: P1) 🎯 MVP

A customer replies to a reminder ("I'll pay Friday" / "what's this for?" / "this
charge is wrong" / "I already paid"). The agent classifies intent, drafts the right
response, records any payment promise, and — on an already-paid or dispute signal —
**halts the thread and freezes the agent across all of that customer's open
invoices**, surfacing the customer's own words plus a ready-to-send correction draft.

**Why this priority**: This is where the sharpest trust/failure story lives and what
the live-iteration panel will probe. The already-paid halt is the cardinal failure the
whole product is judged on.

**Independent Test**: From an invoice thread, submit each reply type → confirm correct
intent, promise capture, and that "I already paid" freezes every open invoice for that
customer and routes an apology draft to the Pro.

**Acceptance Scenarios**:

1. **Given** a reply "I already paid this last week", **When** triaged, **Then** the
   thread halts, all that customer's open invoices pause, and an apology draft routes
   to the Pro (P0 case).
2. **Given** a reply "I'll pay Friday", **When** triaged, **Then** a promise is
   recorded and a follow-up is scheduled for after Friday.
3. **Given** a reply "what's this invoice for?", **When** triaged, **Then** it is
   treated as an info request (job/line-item context), not a dun.

### User Story 3 - Tune behavior with dials and protect VIPs (Priority: P2)

The Pro adjusts ~4 simple sliders (Persistence, Tone, Leash, Loop-me-in threshold) and
maintains a VIP list (auto-populated where signals exist, plus manual adds). These
bound what the agent may do — no settings menus, no prompt-engineering.

**Why this priority**: It is the control surface that makes "never an autopilot" real
and makes the guardrails demonstrable, but the core loop can be shown before it.

**Independent Test**: Move Tone warm↔firm and confirm redrafts change register; set
Loop-me-in below an invoice amount and confirm that invoice escalates; add a VIP and
confirm legal/collections language is blocked and the invoice routes to the Pro.

**Acceptance Scenarios**:

1. **Given** an invoice of $6,200 and a $2,000 threshold, **When** processed, **Then**
   it escalates to the Pro regardless of segment/level.
2. **Given** a VIP customer, **When** a firm notice would draft, **Then** legal/
   collections language is stripped and it routes to the Pro.

### User Story 4 - See wins and grant earned autonomy (Priority: P2)

A dashboard shows weighted recoveries (hard collections credited over easy dollars),
the review queue, recent sends, headline outcome tiles (dollars recovered, DSO vs. the
Pro's baseline, zero-touch resolutions, hours saved), and a per-segment track record
that drives autonomy offers up to L2.

**Why this priority**: It carries the measurement and trust-over-time story the rubric
weights, but depends on the core loop existing first.

**Independent Test**: Open the dashboard → confirm weighted-recovery ordering, the
review queue and recent sends reflect core-loop actions, and a segment with a strong
track record offers an L2 leash bump the Pro can confirm.

### User Story 5 - Run the eval (Priority: P2)

A teammate opens the eval runner, runs the 15 cases from `cases.json`, and gets a
pass/fail report scored against the error taxonomy with the **P0 = 0** ship gate
enforced.

**Why this priority**: Makes the eval spec runnable and extensible next week — a named
deliverable — but is not part of the customer-facing loop.

**Independent Test**: Open `/eval` → Run all → confirm each case is tagged pass/fail by
error class and the report shows the P0 gate and the ≥90% / 100% / ≤10% bars.

### Edge Cases

- Ready-to-send message when it's 10:30pm in the customer's local time → defer to the
  next allowed window (after 6am), never send into quiet hours.
- Broken promise: Friday passed and still unpaid → follow up referencing the promise,
  tone per Persistence.
- Claude API key missing or rate-limited → scripted fallback response, demo continues.
- Ambiguous reply that could be a stall or a dispute → treat conservatively; if it
  reads as a possible dispute, halt and escalate rather than dun.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST assemble the five context buckets (relationship & value;
  payment/DSO history relative to the Pro's own average; invoice/job specifics;
  inferred non-payment reason; Pro guardrails) for each overdue invoice.
- **FR-002**: System MUST classify non-payment reason into forgot / can't pay /
  disputes / won't pay with a confidence score, and MUST fall back to the gentle
  "forgot" nudge when confidence is below the bar.
- **FR-003**: System MUST compose the follow-up message in the Pro's voice, adapting
  to segment, Tone, and Persistence.
- **FR-004**: System MUST gate every outbound message through deterministic guardrails
  (PRD §7) BEFORE sending: already-paid/dispute halt, quiet hours (customer-local
  9pm–6am), Loop-me-in threshold, autonomy-level gate, VIP legal-language block.
- **FR-005**: System MUST triage every inbound reply (intent), record payment
  promises, and fire a follow-up when a promise is broken.
- **FR-006**: System MUST, on an already-paid or dispute signal, halt the thread,
  suppress the invoice, and pause the agent across ALL of that customer's open
  invoices until the Pro reviews — with a ready-to-send correction draft.
- **FR-007**: Users MUST be able to set Persistence, Tone, Leash, and Loop-me-in
  threshold via sliders and manage a VIP list.
- **FR-008**: System MUST enforce per-segment autonomy levels L0–L2, defaulting to L1
  (draft-only), and MUST always escalate on dispute / over-threshold / VIP / low
  confidence regardless of level.
- **FR-009**: System MUST score recoveries with a weighted metric (recovery uplift ×
  dollars at risk, weighted up by amount, days overdue, and relative-DSO risk) and
  surface weighted recoveries, review queue, recent sends, and outcome tiles.
- **FR-010**: System MUST provide a runnable eval over `cases.json` that scores each
  case against expected behavior by error class and enforces the P0 = 0 gate.
- **FR-011**: System MUST use live Claude calls for classification and composition,
  with a deterministic scripted fallback on failure.

### Key Entities

- **Customer**: relationship/value signals, DSO history vs. Pro average, VIP flag,
  local timezone, open invoices.
- **Invoice**: amount, days overdue, job type, deposit/dispute flags, status,
  assigned segment, autonomy level, thread.
- **Message / Thread**: outbound drafts + sends, inbound replies, intents, promises,
  halt/freeze state.
- **Pro Settings**: the four sliders + VIP list + per-segment autonomy + baseline DSO.
- **Eval Case**: input context/reply, expected action, error class on miss.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The 15-case eval reports **P0 = 0** (no false dun, no guardrail breach).
- **SC-002**: Reason classification ≥ 90% on high-confidence cases; low-confidence
  cases abstain to the gentle nudge.
- **SC-003**: Escalation recall = 100% (every dispute / over-threshold / VIP /
  low-confidence case routes to the Pro with a draft).
- **SC-004**: A panelist acting as a customer can send an arbitrary free-text reply and
  get a correctly-triaged response within a few seconds during live iteration.
- **SC-005**: A teammate can run and extend the eval unaided from the prototype.

## Assumptions

- Single channel (text-style messaging) for the MVP; multi-channel is deferred.
- Realistic mock data stands in for HCP production data; no live integration.
- The Pro is the solo/small-shop owner: non-technical, time-poor, near-zero setup.
- Local dev supplies an Anthropic API key via env; Vercel supplies it as a secret.
- Deployment target is Vercel (Node runtime for API routes).
