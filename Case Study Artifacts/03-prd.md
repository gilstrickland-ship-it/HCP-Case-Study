# PRD — AI Collections Teammate

Product requirements for the selected bet. Turns the
[problem framing](01-problem-framing.md) into buildable requirements, an autonomy
ladder, guardrails, and an explicit MVP scope line.

Acronyms at first use: AR = accounts receivable (money owed on issued invoices).
DSO = days sales outstanding (avg days from invoicing to payment; lower is better).
LLM = large language model. VIP = a customer the Pro flags for extra care.
HCP = Housecall Pro. CTA = call to action.

---

## 1. Overview

An AR-owning member of HCP's AI Team. For each overdue invoice it reads the
customer context, infers *why* the invoice is unpaid, runs the right follow-up play
(adapting message, tone, timing, channel), handles the customer's replies, tracks
payment promises, and escalates to the Pro when judgment is needed — all under
Pro-controlled limits and hard guardrails. It is **never an autopilot**.

Full rationale, context model, and success weighting live in the
[problem framing](01-problem-framing.md); this doc assumes them.

## 2. Goals & non-goals

**Goals**
- Recover more overdue dollars, weighted toward the hard cases (high relative DSO),
  without damaging the Pro–customer relationship.
- Cut the Pro's time chasing payment; replace *composing* with *reviewing*.
- Earn autonomy visibly over time so the Pro trusts the agent more each week.

**Non-goals (this release)**
- Point-of-sale prevention (deposits, financing at checkout) — separate surface.
- Debt collection, liens, or any legal-process automation.
- Replacing the Pro's judgment on disputes or VIP relationships.
- A configurable rules/workflow builder — control is via sliders, not authoring.

## 3. Target user

The **solo-to-small Pro** (1–10 person shop). The owner chases payment personally,
at night, with no back office, and is **not technical and time-poor** — the product
must work with near-zero setup and never require "managing a system"
([pro-quotes.md](02-research/pro-quotes.md)).

## 4. User stories

**Pro (owner)**
1. As a Pro, I want overdue invoices followed up automatically in my voice, so I
   stop writing the same messages every night.
2. As a Pro, I want to see what the agent is about to send and what's waiting for my
   review, so I'm never surprised by a message that went to my customer.
3. As a Pro, I want to adjust how the agent behaves with a couple of simple dials
   (not settings menus), so I can make it gentler or firmer without technical work.
4. As a Pro, I want the agent to flag disputes, big balances, and my important
   customers for me to handle, so the high-stakes cases always get a human.
5. As a Pro, I want a dashboard of what the agent recovered — especially the hard
   collections — so I can see it's earning its keep.
6. As a Pro, I want the agent to leave certain customers alone entirely, so my VIPs
   and anyone who already paid never get nagged.

**Agent (system, expressed as behavioral requirements)**
7. The agent shall classify each overdue invoice's non-payment reason (forgot /
   can't pay / disputes / won't pay) with a confidence score before choosing a play.
8. The agent shall triage every inbound reply, draft a response, and track any
   payment promise made, following up when a promise is broken.
9. The agent shall escalate to the Pro on low confidence, dispute, over-threshold
   amount, or VIP — always with a ready-to-send draft.

## 5. Core loop (functional requirements)

For each overdue invoice, on each cycle:

1. **Read context** — assemble the five signal buckets (relationship & value;
   payment/DSO history *relative to this Pro's average*; invoice/job specifics;
   inferred non-payment reason; Pro guardrails). See framing §6.
2. **Classify reason** with a confidence score. If confidence is below the bar,
   fall back to the **"forgot" gentle nudge** — the lowest-risk play across all
   segments.
3. **Select play & compose** — pick cadence, tone, channel, and CTA for the segment;
   generate the message in the Pro's voice.
4. **Gate** — check guardrails (§7) and the autonomy level (§6/ladder). Either
   auto-send (if earned for this segment) or queue for Pro review with the draft.
5. **Handle replies** — classify intent, draft the response, record promises, detect
   "already paid" / "disputed" and trigger the failure path (§8).
6. **Log outcome** — feed result into the wins dashboard and the per-segment track
   record that governs autonomy graduation.

## 6. Autonomy ladder

Autonomy is **earned per segment**, shown with evidence, and always reversible by
the Pro via the Leash slider. No blanket "trust me now."

| Level | Name | Agent behavior | How it's reached |
|---|---|---|---|
| L0 | **Off** | Agent does nothing for this segment | Default for VIP + high-stakes; Pro can set any segment here |
| L1 | **Draft-only** | Agent composes; nothing sends without Pro approval | Default starting state for every segment |
| L2 | **Auto-send, low-risk only** | Agent sends on the safe segment (small amount, "forgot," good history); everything else stays draft-only | Offered after a visible track record (e.g. Pro approves ~N unedited on that segment) |
| L3 | **Auto-send + auto-follow-up** | Agent runs the full cadence and reply-handling on the segment; still escalates disputes/VIP/over-threshold | Offered after sustained L2 success on that segment |

Escalation to the Pro is **always** forced (regardless of level) on: dispute
detected, amount over the Loop-me-in threshold, VIP, or low classification
confidence. Failures dial the segment back down; the Pro can drag the Leash slider
at any time.

**Control surface (MVP): ~4 sliders + one list**
- **Persistence** — gentle nudge ↔ keep at it
- **Tone** — warm/neighborly ↔ firm/businesslike
- **Leash** — draft everything ↔ auto-send the easy ones (maps to the ladder)
- **Loop-me-in threshold** — dollar amount above which everything comes to the Pro
- **VIP list** — auto-populates from relationship signals where available; Pro adds/removes

## 7. Guardrails (hard stops — never violated, even at the cost of a recovery)

1. **Never dun a customer who may have already paid or has an open dispute.**
2. **Never use legal/collections language with a VIP.**
3. **Never contact outside quiet hours — 9pm–6am in the _customer's_ local time.**
4. **Never fire a segment-specific play on a low-confidence reason** — fall back to
   the gentle "forgot" nudge.
5. **Never send above the earned autonomy level** for that segment without Pro review.

## 8. Failure & uncertainty handling

When a customer replies "I already paid" / "this charge is wrong," or the agent is
otherwise uncertain it's in the right:
- **Halt** the thread and **suppress** further reminders on that invoice.
- **Pause the agent across _all_ of that customer's open invoices** until the Pro
  reviews (records may be out of sync for the whole relationship).
- **Surface to the Pro** with the customer's own words + a ready-to-send
  apology/correction draft.
- **Log** it as a signal that adjusts future behavior for that customer.

## 9. Wins dashboard (requirements)

- Show **weighted recoveries** (recovery uplift × dollars at risk, weighted up by
  amount, days overdue, and relative-DSO risk) — so hard collections are visibly
  credited over easy dollars.
- Show the **review queue** (what's waiting on the Pro) and **recent sends** (what
  went out) — the always-in-the-loop visibility requirement.
- Show the **per-segment track record** that drives autonomy offers (the trust
  surface).
- Headline outcome tiles: dollars recovered, DSO vs. the Pro's baseline, invoices
  resolved with zero Pro touches, estimated hours saved.

## 10. Success metrics

- **Primary:** weighted dollars recovered; DSO reduction vs. the **Pro's own
  baseline**.
- **Secondary:** % overdue invoices resolved with zero Pro touches; Pro hours saved;
  autonomy graduation rate (segments reaching L2/L3).
- **Guardrail metric (must stay ~0):** false-dun rate on already-paid/disputed
  invoices — the cardinal failure. Detailed bar in [05-eval-spec.md](05-eval-spec.md).

## 11. Scope cuts (MVP line)

**In for MVP**
- The core loop on a **single channel** (text or email), realistic **mock data**.
- Reason classification (4 buckets + confidence) and segment plays.
- Reply triage + promise tracking + the "already paid/disputed" failure path.
- The ~4 sliders + VIP list; the autonomy ladder through L2.
- Wins dashboard with review queue, recent sends, and weighted-recovery tiles.

**Deferred (post-MVP)**
- L3 full auto-cadence; multi-channel orchestration and channel-switching.
- Payment-plan/financing offers for the "can't pay" segment (Idea 5 territory).
- Deep QuickBooks/accounting sync; multi-user shops with role permissions.
- Learned per-Pro tone modeling beyond the Tone slider.

## 12. Prototype notes

Runs on **realistic mock data** (invoices, customers, payment history, job types,
membership) — framed as a demonstration of AI-assisted product work, not a
production integration. No "available today vs. needs building" labeling.

---

*Derived from [01-problem-framing.md](01-problem-framing.md); research in
[02-research/](02-research/) and
[hcp-company-fintech-deep-dive.md](../context/hcp-research/hcp-company-fintech-deep-dive.md).*
