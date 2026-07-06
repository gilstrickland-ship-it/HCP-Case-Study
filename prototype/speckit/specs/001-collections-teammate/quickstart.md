# Quickstart — AI Collections Teammate

## Run

```bash
cd prototype
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY for live Claude
npm run dev                  # http://localhost:3000
```

No key? The app runs on deterministic fallbacks — every screen and the eval still work.

## Demo script (the 15-min walkthrough)

1. **Dashboard** `/` — lead with outcomes: weighted recoveries (hard cases credited
   over easy dollars), the "waiting on you" queue, earned per-segment autonomy.
2. **Collections** `/invoices` — ranked by who-to-chase; note relative-DSO risk.
3. **Core loop** `/invoices/INV-2044` — the 5 context buckets, reason + confidence,
   the draft. Change nothing or edit; approve & send.
4. **The trust/failure beat** — on `/invoices/INV-2033`, click *try: "I already paid
   this last week"*. The thread halts and **all of that customer's open invoices
   freeze**; an apology draft is queued for the Pro. This is the cardinal failure,
   handled.
5. **Live iteration** — hand the reply box to the panel. They type any customer
   reply; the agent triages intent, records promises, and routes disputes/already-paid
   to the Pro. (Live Claude makes this open-ended.)
6. **Controls** `/settings` — move Tone/Leash; show it's dials, not menus.
7. **Eval** `/eval` — run all 15; show **P0 = 0** ship gate, classification ≥ 90%,
   escalation recall = 100%. Point out `lib/cases.json` is where a teammate extends it.

## Verify the guardrails hold (by code)

- `INV-2007` (Whitfield, $6,200, VIP) → escalates: over threshold **and** VIP.
- Draft-only segments never auto-send; only `forgot` (L2) auto-sends, and only
  outside the customer's quiet hours.
- Run `/eval` — the gate is red if any P0 case regresses.
