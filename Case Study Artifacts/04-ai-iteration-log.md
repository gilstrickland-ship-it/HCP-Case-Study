# AI Iteration Log

Record of how the approach was refined with a large language model (LLM) before and
during building. Acronyms at first use: AR = accounts receivable; DSO = days sales
outstanding; VIP = a customer flagged for extra care; P0 = most-severe error class.

This log covers the *reasoning* iterations. The build itself is in
[`prototype/`](../prototype/); the process spine is the Spec Kit workflow in
[`specs/001-collections-teammate/`](../specs/001-collections-teammate/).

## 1. Idea divergence → convergence

Started by forcing breadth: five genuinely different bets across the payment
lifecycle rather than five flavors of "smarter reminder"
([idea shortlist](01a-idea-shortlist.md)). The LLM was used to pressure-test each on
four axes — root cause targeted, AI centrality, time-to-demo, competitive whitespace.
Converged on **Idea 1 (Collections Teammate)** with Idea 2 (reply triage) as its
demoable heart, because it sits on the one part of the stack no competitor and no HCP
AI Team member owns.

## 2. Sharpening the problem

The anchor insight that survived every iteration: **late payment is not one behavior**
— it splits into forgot / can't-pay / disputes / won't-pay, each needing a different
remedy and tone. This reframed the product from "send better messages" to "classify
*why*, then act" — which is what makes an LLM genuinely central rather than decorative.

## 3. The move that changed the architecture

Early framing treated the agent as a smart message generator. Iterating on the
failure modes flipped the design: the scariest outcome ("5 requests after they paid")
is not a *writing* problem, it's a *control* problem. That produced the load-bearing
decision recorded in the [constitution](../.specify/memory/constitution.md):
**guardrails live in code, not the prompt.** The model classifies and composes; a
deterministic gate decides whether anything may send. Without this, the eval's P0 = 0
gate would be a wish.

## 4. Success weighting

Iterated away from "dollars recovered" as a naive headline — it rewards the agent for
nudging sure-payers who'd have paid anyway. Landed on **weighted recovery** (uplift
over baseline × dollars at risk, weighted by amount, age, and relative DSO) so hard
collections outrank easy dollars and the metric can't be gamed
([PRD §7](03-prd.md), [`lib/weighting.ts`](../prototype/lib/weighting.ts)).

## 5. Trust as a graduated dial, not a toggle

Rejected a binary "autopilot on/off." Iterated to **per-segment earned autonomy
(L0–L2)** shown with evidence, always reversible with a slider — because the target
user is non-technical and time-poor and will not hand-hold a system
([PRD §6](03-prd.md)).

## 6. Turning the framing into a runnable bar

The eval spec's 15 cases were derived from the failure taxonomy, then encoded as
[`cases.json`](../prototype/lib/cases.json) and run through the *real* pipeline — so
the spec is executable, not aspirational. This immediately surfaced a real bug (see
[AI usage log §"where AI was wrong"](06-ai-usage-log.md)).
