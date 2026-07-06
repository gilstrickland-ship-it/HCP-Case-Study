# AI Collections Teammate — Prototype

A working prototype of an **AR-owning member of the Housecall Pro AI Team**: for each
overdue invoice it reads the customer context, infers *why* it's unpaid, drafts the
right follow-up in the Pro's voice, triages replies, and escalates to the Pro when
judgment is needed — **never as an autopilot**.

Built for the HCP FinTech case study. Spec-driven (see
[`specs/001-collections-teammate/`](speckit/specs/001-collections-teammate/)), grounded in
the [PRD](../Case%20Study%20Artifacts/03-prd.md) and
[eval spec](../Case%20Study%20Artifacts/05-eval-spec.md).

## Run locally

```bash
cd prototype
npm install
cp .env.example .env.local   # add your ANTHROPIC_API_KEY (optional — see below)
npm run dev                  # http://localhost:3000
```

**Real Claude vs. offline fallback.** With `ANTHROPIC_API_KEY` set, classification,
composition, and reply triage use live Claude calls (Haiku for classification,
Sonnet for writing). **Without a key, the app runs on deterministic scripted
fallbacks** so the demo — and the eval — never dead-ends.

## The demo path (≈2 min)

1. **Dashboard** (`/`) — weighted recoveries (hard cases credited over easy dollars),
   the review queue, earned per-segment autonomy.
2. **Collections** (`/invoices`) — overdue invoices ranked by *who to chase today*.
3. **An invoice** (`/invoices/INV-2044`) — the 5-bucket context the agent read, the
   inferred reason + confidence, and a draft. Approve/edit/send.
4. **Reply triage** — on any invoice, use *"Simulate a customer reply"* (you're the
   customer). Try `INV-2033` → **"I already paid this last week"** to see the cardinal
   failure handled: the thread halts and **every open invoice for that customer
   freezes** until the Pro reviews, with an apology draft ready.
5. **Agent settings** (`/settings`) — the 4 dials + VIP list + per-segment leash.
6. **Eval** (`/eval`) — run the 15-case ship gate. **P0 = 0** or it doesn't ship.

## Architecture

Guardrails live in **code**, not the prompt. The model only *classifies* and
*composes*; a deterministic gate ([`lib/guardrails.ts`](lib/guardrails.ts)) decides
whether anything may send — quiet hours (customer-local), Loop-me-in threshold,
autonomy level, VIP legal-language block, and the already-paid/dispute halt. That is
what makes the eval's P0 = 0 gate real.

| Path | What |
|---|---|
| `lib/agent.ts` | core loop: context → classify → confidence fallback → play → compose → gate |
| `lib/guardrails.ts` | deterministic hard stops (PRD §7) |
| `lib/anthropic.ts` | Claude calls + scripted fallback |
| `lib/weighting.ts` | weighted-recovery scoring |
| `lib/data.ts` | mock book of business |
| `lib/cases.json` | the 15 eval cases (extend here) |
| `app/api/*` | server-side routes (the key never reaches the browser) |

## Deploy (Vercel)

Set the project **root directory to `prototype/`** and add `ANTHROPIC_API_KEY` as an
environment variable (Production + Preview). `npm run build` must pass first.
