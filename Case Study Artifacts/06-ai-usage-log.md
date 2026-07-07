# AI Usage Log

Required disclosure of AI tool usage in creating this case study. Acronyms at first
use: LLM = large language model; AR = accounts receivable; DSO = days sales
outstanding; VIP = a customer flagged for extra care; P0 = most-severe error class;
PRD = product requirements document.

## Tools used and for what

| Tool | Used for |
|---|---|
| **Claude (Anthropic), via Claude Code** | Research synthesis, problem framing, PRD and eval-spec authoring, and building the prototype (spec → code) through the Spec Kit workflow. |
| **Spec Kit (`specify`)** | Process spine: constitution, spec, plan, tasks, and design docs in [`specs/001-collections-teammate/`](../prototype/speckit/specs/001-collections-teammate/) — so the build is reproducible/extensible, not ad hoc. |
| **Claude API (`@anthropic-ai/sdk`)** | *Inside the prototype at runtime*: reason-classification (Haiku) and message composition + reply triage (Sonnet). |
| **HCP design-system extraction** | Tokens/colors/type measured from the live logged-in HCP app to make the prototype read as native ([`context/design-system/`](../context/design-system/)). |

## Top workflows / prompts

1. **Divergent idea generation, then scored convergence.** Prompted for five
   *structurally different* bets across the payment lifecycle, then scored each on
   root-cause coverage, AI centrality, time-to-demo, and whitespace — instead of
   accepting the first plausible idea ([shortlist](01a-idea-shortlist.md)).
2. **Failure-first design.** Prompted from the cardinal failure backward ("what breaks
   trust irreparably, and what control prevents it?"), which produced the
   guardrails-in-code architecture and the halt-and-freeze behavior.
3. **Spec-to-eval loop.** Turned the failure taxonomy into 15 concrete test cases,
   each mapped to a seeded invoice in the running prototype (the eval spec's
   ["In prototype" column](05-eval-spec.md) ↔ [`prototype/lib/data.ts`](../prototype/lib/data.ts)),
   so a reviewer can open the exact invoice a case exercises and see the agent's
   decision live.

## Where AI was wrong — and what I did

**The offline classifier missed a dispute.** The deterministic fallback that runs when
no API key is present classified the reply *"this isn't the price we agreed on"* as
`other` instead of `disputes` — its keyword pattern didn't cover that phrasing. This
is a P0-adjacent miss (a missed dispute risks dunning a disputed charge). It was
caught **because the eval harness runs the real pipeline** — case 3 went red. Fix:
broadened the dispute detection (added "price we agreed", "quoted", "agreed on", etc.)
and re-ran; the suite returned to 15/15 with P0 = 0 and escalation recall 100%.
Takeaway: the eval earned its keep on the first run. *(The in-app runnable harness
that caught this was later cut from the prototype to keep the demo focused; the 15
cases live on as the eval spec's seeded-invoice mapping, runnable by hand.)*

*(Secondary: some invoice status-badge colors in the design system could not be
sampled from the live app — the trial account had only one paid invoice — so they are
**derived** and labeled as such in [`tokens.css`](../context/design-system/tokens.css),
not passed off as extracted.)*

## Where the judgment was human — and why

**The guardrails were specified by hand, and every hard stop runs as deterministic
code rather than an LLM call — a design decision I made deliberately, then had AI
implement.** I decided *which* guardrails had to exist and where their lines fell: the
already-paid/dispute halt, quiet hours (customer-local), the Loop-me-in threshold, the
per-segment autonomy gate, and the VIP legal-language block. I also decided the
architecture — that these must live in [`lib/guardrails.ts`](../prototype/lib/guardrails.ts)
as pure functions the model cannot override, not as instructions in a prompt. AI wrote
the code to that spec. This was a deliberate refusal to delegate the *judgment*: the
cardinal-failure P0 gate must be *guaranteed*, and "we asked the model nicely" is not a
guarantee. For the same reason, I scoped the LLM to the two things only it can do well —
inferring *why* an invoice is unpaid from unstructured context, and composing in the
Pro's voice. Deciding *what to trust the model with, and what to lock down in code* was
the human call.
