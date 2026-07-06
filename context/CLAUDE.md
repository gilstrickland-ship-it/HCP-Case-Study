# CLAUDE.md — HCP Case Study

Orientation for any Claude session working in this repository. Read this first.

## What this repo is

A product case study for a **Housecall Pro (HCP)** — the field-service SaaS platform
for home-service Pros — **PM (product manager) role on the FinTech Mobile Team**. The
work selects one high-leverage bet for *getting Pros paid on time*, frames it, specs
it, and ships a **working prototype**: an **AI Collections Teammate** that owns
**AR (accounts receivable)** follow-up for overdue invoices — reads customer context,
infers *why* an invoice is unpaid, drafts the follow-up in the Pro's voice, triages
replies, and escalates to the Pro when judgment is needed. It is a **teammate, never
an autopilot**.

## Repo map

| Path | What it is | Graded? |
|---|---|---|
| `Case Study Artifacts/` | The deliverables `00`–`06` (brief, problem framing, idea shortlist, PRD, AI iteration log, eval spec, AI usage log) + `02-research/`. | **Yes** — these are graded. |
| `prototype/` | Working Next.js app (the AI Collections Teammate). See `prototype/README.md`. | Yes (the build). |
| `specs/001-collections-teammate/` | Spec Kit artifacts (spec, plan, tasks, data-model, contracts, quickstart) driving the prototype. | Supporting. |
| `context/` | Supporting material that *informed* the case study but is not itself graded: `hcp-research/` (company/fintech deep dive) and `design-system/` (HCP-native CSS tokens + components). | No. |

## Conventions — follow these

- **Define every acronym at first use.** DSO (days sales outstanding), AR (accounts
  receivable), dunning, etc. — spell it out the first time in each document. This is a
  hard rule across all case-study docs.
- **Every factual claim needs a verified, cited link.** No unsourced numbers about HCP,
  the market, or competitors. Research in `context/hcp-research/` and
  `Case Study Artifacts/02-research/` uses cited, confidence-labeled claims.
- **Spec-driven.** Non-trivial prototype changes flow through the Spec Kit workflow
  (`/speckit.specify` → `plan` → `tasks` → `implement`) and land in
  `specs/001-collections-teammate/`.

## Prototype architecture (the load-bearing idea)

**Guardrails live in code, not in the prompt.** The model only *classifies* (why is
this unpaid?) and *composes* (draft the message). A deterministic gate
(`prototype/lib/guardrails.ts`) decides whether anything may actually send —
quiet-hours (customer-local time), a "loop-me-in" confidence threshold, the earned
autonomy level, a VIP legal-language block, and the already-paid / dispute **hard
halt** (freeze every open invoice for that customer until the Pro reviews). That is
what makes the eval's **P0 = 0** ship gate real, not aspirational.

- Runs with a live `ANTHROPIC_API_KEY` (Haiku for classification, Sonnet for writing)
  **or** deterministic scripted fallbacks with no key, so the demo and the eval never
  dead-end.
- Deploy on Vercel with **root directory = `prototype/`** and `ANTHROPIC_API_KEY` set
  (Production + Preview). See `prototype/README.md` for the full run/deploy/demo path.

## Design system

`context/design-system/` holds CSS tokens + component classes extracted from the live
logged-in HCP app so the prototype looks native. Import `tokens.css` then `hcp.css`;
reference `var(--hcp-*)` and `.hcp-*` classes. `preview.html` is a working shell.

## Git workflow

`main` is the default branch. Feature work goes through PRs (see history: PRs #2–#6).
The prototype merged via PR #6. Commit only when asked; branch off `main` first.
