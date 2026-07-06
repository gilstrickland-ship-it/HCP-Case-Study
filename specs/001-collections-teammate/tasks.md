---
description: "Task list for AI Collections Teammate prototype"
---

# Tasks: AI Collections Teammate

**Input**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md),
[contracts/api.md](contracts/api.md)
**Tests**: The `/eval` runner is the acceptance harness (US5). No separate unit test
suite required beyond guardrail/weighting sanity checks.

## Format: `[ID] [P?] [Story] Description`

## Phase 1: Setup

- [ ] T001 Scaffold Next.js 15 + TS app in `prototype/` (App Router, Node runtime).
- [ ] T002 [P] Copy `context/design-system/{tokens.css,hcp.css}` into `prototype/styles/`; add `app.css`; wire fonts + `.hcp` shell in `app/layout.tsx`.
- [ ] T003 [P] Add `.env.example` (`ANTHROPIC_API_KEY`, `AI_MODEL_CLASSIFY`, `AI_MODEL_COMPOSE`); install `@anthropic-ai/sdk`.

## Phase 2: Foundational (blocks all stories)

- [ ] T004 `lib/types.ts` — all entity + context + eval types (per data-model).
- [ ] T005 `lib/data.ts` — mock customers/invoices/settings covering all 4 segments + the special eval scenarios (VIP, already-paid, over-threshold, quiet-hours, ambiguous/low-confidence, promise + broken-promise); in-memory store + accessors.
- [ ] T006 [P] `lib/weighting.ts` — weighted-recovery score + AR ranking; `relativeDso`.
- [ ] T007 `lib/guardrails.ts` — deterministic gate: already-paid/dispute halt, quiet hours (customer-local), Loop-me-in threshold, autonomy-level gate, VIP legal-language block, low-confidence fallback trigger. Pure functions.
- [ ] T008 `lib/anthropic.ts` — Claude client; `classify()`, `compose()`, `triageReply()` with deterministic scenario-keyed fallback on missing key/error.
- [ ] T009 `components/Shell.tsx` + Badge/StatCard primitives (HCP-native).

**Checkpoint**: core loop can be assembled.

## Phase 3: US1 — Review & send the right follow-up (P1) 🎯 MVP

- [ ] T010 [US1] `lib/agent.ts` — `processInvoice()`: buildContext → classify → confidence fallback → selectPlay → compose → `guardrails.gate()` → decision.
- [ ] T011 [US1] `app/api/classify/route.ts` + `app/api/draft/route.ts` (contracts/api.md).
- [ ] T012 [US1] `app/invoices/[id]/page.tsx` — ContextPanel (5 buckets), ConfidenceMeter, DraftCard (approve/edit/send), auto-send vs. queued state.
- [ ] T013 [US1] `app/invoices/page.tsx` — AR list ranked by weighted priority, segment + status badges.

**Checkpoint**: MVP demoable — open invoice → context → reason+confidence → draft → send.

## Phase 4: US2 — Reply triage + cardinal failure (P1) 🎯 MVP

- [ ] T014 [US2] `app/api/reply/route.ts` — intent + promise + failureFlags + draft.
- [ ] T015 [US2] `components/ReplyThread.tsx` — reply input, intent display, promise chip.
- [ ] T016 [US2] Wire cardinal failure in `agent.ts` + detail page: "I already paid"/dispute → halt thread, freeze ALL customer invoices, surface apology draft to Pro.

**Checkpoint**: the trust/failure story is demoable end-to-end.

## Phase 5: US3 — Controls & VIP (P2)

- [ ] T017 [P] [US3] `components/Slider.tsx` + `components/VipList.tsx`.
- [ ] T018 [US3] `app/settings/page.tsx` — Persistence, Tone, Leash, Loop-me-in threshold, per-segment autonomy L0–L2, VIP list; persist to the in-memory store.
- [ ] T019 [US3] Feed settings into `agent.ts`/`guardrails.ts` (tone/persistence in compose; threshold/VIP/leash in gate).

## Phase 6: US4 — Wins dashboard (P2)

- [ ] T020 [US4] `app/page.tsx` — outcome tiles (dollars recovered, DSO vs. baseline, zero-touch, hours saved), review queue, recent sends, weighted recoveries, per-segment track record with an L2 autonomy offer.

## Phase 7: US5 — Eval harness (P2)

- [ ] T021 [US5] `lib/cases.json` — the 15 eval cases from the eval spec (exact IDs 1–15, error classes, P0 flags).
- [ ] T022 [US5] `app/api/eval/route.ts` — run each case through the real pipeline; score vs. expected; tag error class; compute summary + P0 gate.
- [ ] T023 [US5] `app/eval/page.tsx` — Run all / per-case; report with P0 gate + ≥90%/100%/≤10% bars; per-case pass/fail by error class.

## Phase 8: Polish & Deploy

- [ ] T024 [P] Empty/error/failure/deferred (quiet-hours) states; design pass vs. HCP reference screenshots.
- [ ] T025 `quickstart.md` (run + demo script); README for `prototype/`.
- [ ] T026 Local verification: demo path + guardrail checks + run 15 cases (expect P0 = 0); fallback check with key unset.
- [ ] T027 Deploy to Vercel (root `prototype/`), set `ANTHROPIC_API_KEY`; verify deployed URL end-to-end.
- [ ] T028 Update `04-ai-iteration-log.md` and `06-ai-usage-log.md` with this build session.

## Dependencies

- Phase 1 → Phase 2 → (Phase 3 = MVP) → Phase 4 → Phases 5/6/7 (parallelizable) → Phase 8.
- US1 (P1) is the standalone MVP; US2 (P1) completes the rubric's trust/failure axis.
- Guardrails (T007) block T010/T016/T019/T022 — the gate is used everywhere.
