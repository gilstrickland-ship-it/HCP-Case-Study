# AI Collections Teammate — Constitution

Non-negotiable principles for the Housecall Pro (HCP) case-study prototype. These
supersede convenience and speed. Derived from
[`01-problem-framing.md`](../../../../Case%20Study%20Artifacts/01-problem-framing.md),
[`03-prd.md`](../../../../Case%20Study%20Artifacts/03-prd.md), and
[`05-eval-spec.md`](../../../../Case%20Study%20Artifacts/05-eval-spec.md).

## Core Principles

### I. Guardrails live in code, never in the prompt (NON-NEGOTIABLE)
Every hard stop from PRD §7 — already-paid/dispute halt, quiet hours (customer-local
9pm–6am), Loop-me-in dollar threshold, autonomy-level gate, VIP legal-language block —
is enforced by deterministic code that wraps the model, not by asking the LLM to
behave. The model may only *classify* and *compose*; it may never be the thing that
decides whether a message is allowed to send. The code-side freeze is what makes the
**P0 = 0** bar real rather than hopeful; the eval set (`05-eval-spec.md`) documents the
cases that bar must hold against.

### II. Never an autopilot
The Pro is always in the loop and always in control. Autonomy is earned **per
segment**, shown with evidence, and reversible at any time via the Leash slider.
Escalation to the Pro is always forced on dispute, over-threshold amount, VIP, or
low classification confidence — regardless of autonomy level. The default state of
every segment is draft-only (L1).

### III. Uncertainty degrades to the safe default
When the non-payment reason is low-confidence, the agent falls back to the gentle
"forgot" nudge — the lowest-risk play across all four segments — and never fires a
segment-specific play (payment plan, firm notice) on a guess. When in doubt, halt
and hand to the human with a ready-to-send draft. Review, never compose.

### IV. The cardinal failure defines the ship bar
Dunning a customer who already paid or has an open dispute is the one failure that
breaks trust irreparably. On any "I already paid" / "this charge is wrong" signal:
halt the thread, suppress the invoice, and **freeze the agent across all of that
customer's open invoices** until the Pro reviews. No P0 case in the eval set
(`05-eval-spec.md`) may survive the guardrail layer — the deterministic code-side
freeze is the ship gate.

### V. Honest mock data
The prototype runs on realistic mock data and is presented as a demonstration of
AI-assisted product work, not a production integration. No fabricated metrics
presented as real, no "available today vs. needs building" theater. Claims that
appear in the case-study docs carry verified links; the prototype UI stays within
what the mock data honestly supports.

## Additional Constraints

- **Real Claude, graceful fallback.** The agent uses live Claude (Anthropic API)
  calls for classification and composition so the panel can throw arbitrary customer
  replies at it during live iteration. A deterministic scripted fallback keeps the
  demo alive if the key or rate limit fails.
- **A documented, extensible eval.** The 15-case eval set (`05-eval-spec.md`) is a
  legible QA artifact a teammate can review and extend next week. The build is driven
  through Spec Kit so the process, not just the artifact, is legible.
- **Reads as Housecall Pro.** Styling uses the design tokens extracted from the live
  HCP app; the prototype should feel native (pill buttons, `#0E6FBE` blue, flat
  surfaces).

## Governance

This constitution supersedes other practices for this prototype. Any deviation must
be justified in the plan's Complexity Tracking table. The guardrail and
cardinal-failure principles (I, III, IV) are gates, not preferences: a change that
weakens them does not ship.

**Version**: 1.1.0 | **Ratified**: 2026-07-06 | **Last Amended**: 2026-07-06
