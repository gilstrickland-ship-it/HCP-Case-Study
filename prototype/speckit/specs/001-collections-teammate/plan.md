# Implementation Plan: AI Collections Teammate

**Branch**: `feat/prototype` | **Date**: 2026-07-06 | **Spec**: [spec.md](spec.md)
**Input**: [spec.md](spec.md), [PRD](../../../../Case%20Study%20Artifacts/03-prd.md),
[eval spec](../../../../Case%20Study%20Artifacts/05-eval-spec.md),
[constitution](../../.specify/memory/constitution.md)

## Summary

A Next.js (App Router) web app, deployed to Vercel, that demonstrates the AI
Collections Teammate. Real Claude (Anthropic API) calls do the two genuinely-LLM jobs
— classify *why* an invoice is unpaid, and compose the follow-up in the Pro's voice —
while a deterministic guardrail layer wraps the model to enforce every hard stop. The
app runs on realistic mock data and ships a runnable 15-case eval.

## Technical Context

**Language/Version**: TypeScript 5, Node 22, React 19
**Primary Dependencies**: Next.js 15 (App Router), `@anthropic-ai/sdk`
**Storage**: In-memory mock data module (`lib/data.ts`); ephemeral per-session
mutation of thread/queue state. No database.
**Testing**: Demo-walkthrough acceptance + light unit checks on guardrails/weighting.
The 15-case eval set (`05-eval-spec.md`) is a documented QA artifact, not an in-app runner.
**Target Platform**: Vercel (Node serverless runtime for `app/api/*`).
**Project Type**: Web application (single Next.js app).
**Performance Goals**: Classification/draft round-trips fast enough for live demo
(~1–3s); Haiku for classification, Sonnet for composition.
**Constraints**: Guardrails deterministic and code-side; graceful degradation when the
API key is absent; must read as native HCP.
**Scale/Scope**: ~5 screens, ~10–14 mock invoices, 4 API routes, 15 eval cases.

## Constitution Check

*GATE: must pass before implementation; re-check after build.*

| Principle | How this plan satisfies it |
|---|---|
| I. Guardrails in code | `lib/guardrails.ts` runs deterministic checks in `lib/agent.ts`'s gate step and in every send path; the LLM never gates. |
| II. Never an autopilot | Per-segment autonomy L0–L2 in `lib/data.ts` + settings; forced escalation in the gate; default L1. |
| III. Uncertainty → safe default | `classify` returns confidence; `agent.ts` swaps to gentle nudge below the bar. |
| IV. Cardinal failure | `reply` route sets failure flags; `agent.ts` freezes all of a customer's invoices; UI shows halt + apology draft. |
| V. Honest mock data | All data in `lib/data.ts`, labeled as demo; no fabricated live metrics. |

**Result**: PASS — no violations; Complexity Tracking not required.

## Project Structure

### Documentation (this feature)

```text
specs/001-collections-teammate/
├── spec.md
├── plan.md          # this file
├── tasks.md
├── data-model.md
├── quickstart.md
└── contracts/
    └── api.md       # the four API route contracts
```

### Source Code (repository root)

```text
prototype/
├── app/
│   ├── layout.tsx                # design-system CSS + fonts + Shell
│   ├── page.tsx                  # US4 Dashboard
│   ├── invoices/page.tsx         # AR list (weighted priority)
│   ├── invoices/[id]/page.tsx    # US1+US2 core loop + reply thread
│   ├── settings/page.tsx         # US3 sliders + VIP + autonomy
│   └── api/
│       ├── process/route.ts      # invoice -> full agent loop {decision, draft, ...}
│       ├── reply/route.ts        # thread reply -> {triage, decision, frozenInvoices}
│       ├── send/route.ts         # record an approved/auto send onto the thread
│       └── settings/route.ts     # GET/POST Pro settings (sliders, VIP, autonomy)
├── lib/
│   ├── types.ts
│   ├── data.ts                   # mock customers, invoices, settings, DSO baseline
│   ├── guardrails.ts             # deterministic hard stops (PRD §7 / P0)
│   ├── weighting.ts              # weighted-recovery score
│   ├── anthropic.ts              # Claude client + graceful fallback
│   └── agent.ts                  # buildContext -> classify -> gate -> selectPlay -> compose
├── components/                   # Shell, InvoiceDetail, SettingsForm, ui (Badge/StatCard/Slider/etc.)
├── styles/                       # tokens.css + hcp.css (copied from context/design-system) + app.css
├── public/
├── .env.example                  # ANTHROPIC_API_KEY, AI_MODEL_*
├── next.config.ts / tsconfig.json / package.json
```

**Structure Decision**: Single Next.js web app under `prototype/`, keeping the
case-study docs and design-system source untouched at repo root. API routes hold all
Claude calls server-side so the key is never shipped to the browser.

## Key design decisions

1. **Guardrails wrap the model.** `agent.processInvoice()` = buildContext → classify
   (LLM) → confidence fallback → selectPlay → compose (LLM) → `guardrails.gate()` →
   {auto-send | queue | escalate | defer | halt}. The gate is pure functions over the
   mock state; it is the enforcement point for SC-001/002/003.
2. **Two models.** `claude-haiku-4-5` for classification (fast, cheap, high-volume in a
   live demo), `claude-sonnet-5` for composition/reply quality. Both env-overridable.
3. **Fallback.** `anthropic.ts` exports `classify()`, `compose()`, `triageReply()`;
   each tries the API and, on missing key / error, returns a deterministic
   scenario-keyed response so a live demo never dead-ends.
4. **State.** Mock data is module-level; the invoice detail and dashboard mutate a
   shared in-memory store within the server session — enough for a demo, no DB.

## Complexity Tracking

No constitution violations — table intentionally empty.
