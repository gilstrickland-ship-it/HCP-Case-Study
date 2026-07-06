# Problem Framing — AI Collections Teammate (Idea 1, selected)

Selected bet from the [idea shortlist](01a-idea-shortlist.md). This doc defines the
specific problem, what good and failure look like, and — because the agent's
judgment *is* the product — the **context model**, **success weighting**, and
**trust/control design** that will drive its behavior.

Acronyms defined at first use: AR = accounts receivable (money owed on issued
invoices). DSO = days sales outstanding (average days from invoicing to receiving
payment; lower is better). LLM = large language model. VIP = a customer the Pro
flags for extra care. HCP = Housecall Pro.

---

## 1. Problem — the specific pain point

**The post-invoice recovery loop is broken for the solo/small Pro.** Once an invoice
is issued and goes unpaid, the only recovery mechanism HCP (and every competitor)
offers is **template-based, timer-based reminders** — the same message on the same
cadence for every customer, regardless of who they are, how much they owe, or *why*
they haven't paid ([competitor-notes.md](02-research/competitor-notes.md);
[HCP invoice reminders](https://help.housecallpro.com/en/articles/4249157-how-do-i-set-up-invoice-reminders)).

**Why this is the pain point that matters:**

- **Late payment is not one behavior.** It splits into **forgot**, **can't pay right
  now**, **disputes the bill**, and **won't pay** — each needing a different remedy
  and a different tone. A single fixed cadence is wrong for at least three of the
  four ([ar-stats.md](02-research/ar-stats.md);
  [Atradius via Clockify](https://clockify.me/late-invoice-statistics)).
- **The person chasing money has no back office.** It's the owner, at night, after a
  full day in the field, spending ~14 hrs/week on payment admin
  ([ar-stats.md](02-research/ar-stats.md);
  [FundTap](https://fundtap.co/resources/why-chasing-invoices-costs-more-than-you-think),
  [Chaser](https://www.chaserhq.com/blog/the-time-cost-of-late-payments);
  [pro-quotes.md](02-research/pro-quotes.md)).
- **The relationship is the constraint.** Pros live on repeat business and referrals;
  they need to get paid *without* sounding like a collections agency. A wrong or
  aggressive message is worse than the unpaid invoice — e.g. "a customer gets 5 late
  payment requests after they've paid" ([pro-quotes.md](02-research/pro-quotes.md);
  [Trustpilot](https://www.trustpilot.com/review/housecallpro.com?page=7)).
- **It's the thinnest part of the stack with zero competitive coverage.** HCP's
  fintech already covers settlement speed (Instapay), affordability at point of sale
  (Wisetack), and spend (Expense Card); the **post-invoice recovery loop is the least
  developed part of every stack**, and **no HCP AI Team member owns AR**
  ([hcp-company-fintech-deep-dive.md §2, §4](../context/hcp-research/hcp-company-fintech-deep-dive.md)).

## 2. Evidence

| Claim | Source |
|---|---|
| Reminders are template + timer-based; no adaptation to customer, amount, or reason; no reply handling; no prioritization | [competitor-notes.md](02-research/competitor-notes.md) |
| Late payment = 4 distinct behaviors, each needing a different remedy/tone | [ar-stats.md](02-research/ar-stats.md), [Clockify](https://clockify.me/late-invoice-statistics) |
| Customer cash-flow pressure is the #1 root cause (~43%) | [ar-stats.md](02-research/ar-stats.md) |
| Pros spend ~14 hrs/week chasing payment | [FundTap](https://fundtap.co/resources/why-chasing-invoices-costs-more-than-you-think), [Chaser](https://www.chaserhq.com/blog/the-time-cost-of-late-payments) |
| AI in AR cuts DSO (99% reduced it; 75% by 6+ days) | [Billtrust State of AI in AR 2025](https://www.billtrust.com/resources/blog/the-state-of-ai-in-accounts-receivable-2025), [Billtrust DSO study](https://www.billtrust.com/news/study-finds-ai-in-accounts-receivable-reduces-dso) |
| The wrong reminder damages the relationship faster than the unpaid invoice | [pro-quotes.md](02-research/pro-quotes.md), [Trustpilot](https://www.trustpilot.com/review/housecallpro.com?page=7) |
| Enforcement is hollow below ~$2–5K → communication quality is the only real lever | [pro-quotes.md](02-research/pro-quotes.md) |
| HCP already ships an "AI Team + unified inbox"; no member owns AR | [hcp-company-fintech-deep-dive.md §4](../context/hcp-research/hcp-company-fintech-deep-dive.md) |

## 3. What good looks like / what failure looks like

**Good:**
- DSO drops meaningfully **against the Pro's own baseline** (benchmark: 6+ days is
  achievable with AI in AR).
- A measurable share of overdue invoices resolve with **zero Pro touches**; the Pro
  reviews a short digest instead of writing messages.
- Recovery is **weighted toward the hard cases** — high-DSO, high-risk customers —
  not just the easy dollars that would have come in anyway.
- The Pro *sees* the wins on a dashboard and grants the agent more autonomy over
  time because it earned it.

**Failure:**
- **The "5 requests after they paid" scenario** — dunning a customer who already paid
  or has an open dispute. This is the cardinal failure; it breaks trust irreparably.
- A message that reads like a collections agency and costs the Pro a repeat customer
  or referral.
- The agent games the metric by nudging only sure-payers (recovers "credit" without
  recovering hard dollars).
- A system that demands management — the Pro turns it off because it needs
  hand-holding they have no time for.

## 4. Options considered → why this one

Full framing of all five candidates is in the [idea shortlist](01a-idea-shortlist.md).
Idea 1 wins on leverage: it targets all four non-payment behaviors adaptively, sits
on the one gap with zero competitive coverage, attacks the biggest measurable cost,
makes AI genuinely central (reason-classification + generative messaging + reply
handling), and lands naturally as the missing "AR teammate" in HCP's existing AI
Team framing.

**Viable non-AI alternative considered:** richer rule-based reminders (more
templates, more timer branches, aging buckets — essentially ServiceTitan's approach).
Rejected because rules can't classify *why* a specific customer hasn't paid from a
free-text reply, can't adapt tone to relationship value, and can't distinguish a
maybe-paid customer from a stall — which is exactly where the cardinal failure lives.
The core task is judgment on unstructured, per-customer context; that is an LLM job.

---

## 5. Solution shape — what the agent does

An **AI Collections Teammate**: an AR-owning member of HCP's AI Team that, for each
overdue invoice, reads the customer context, infers *why* it's unpaid, and runs the
right play — adapting message, tone, timing, and channel per customer — while
handling replies, tracking payment promises, and escalating to the Pro when judgment
is needed.

**Autonomous (within the Pro's set limits):** drafting and (once earned) sending
reminders on the low-risk segment, classifying non-payment reason, triaging replies,
tracking promises, and following up on broken ones.

**Handed to the human:** anything high-stakes, uncertain, disputed, or VIP — always
with a ready-to-send draft so the Pro's job is *review*, not *compose*. **It is never
an autopilot** (see §8).

## 6. The Customer Context Model — what the agent reads before acting

The agent is only as good as the signals it reads. Five buckets:

| Bucket | Signals | What it changes |
|---|---|---|
| **A. Relationship & value** | repeat customer, lifetime revenue, membership/plan member, referral source, tenure, reviews left | Softens tone; raises the relationship-preservation weight; feeds VIP auto-population |
| **B. Payment behavior / DSO history** | **this customer's DSO vs. this Pro's own average**, on-time rate, prior late count, broken-promise count, prior disputes, card-on-file/autopay | Sets urgency + escalation; drives the success weighting (§7) |
| **C. Invoice / job specifics** | amount (vs. ~$2–5K enforcement floor), days overdue, job type (emergency/scheduled/commercial/insurance), deposit taken?, dispute flagged? | Sets cadence + expectations for the message |
| **D. Inferred non-payment reason** | forgot / can't pay / disputes / won't pay (+ a confidence score) | Selects the play; **when confidence is low, default to the "forgot" gentle nudge** — the lowest-risk message across all four segments — and reserve segment-specific plays (payment plan, escalation) for high-confidence reads |
| **E. Pro guardrails & prefs** | the sliders + VIP list (§8) | Hard bounds on what the agent may do |

**On bucket B — relative, not absolute DSO.** "High DSO" means high *relative to this
Pro's own customer average*, not an industry number. A 45-day customer is normal for
a roofer and alarming for an emergency plumber; the baseline is the Pro's book of
business ([ar-stats.md — DSO by trade](02-research/ar-stats.md)).

## 7. Objective & success weighting

- **Headline metric:** dollars recovered.
- **Hard constraint (not a weighted term):** preserve the customer relationship. A
  recovery that damages the relationship is not a win.
- **Weighting — hard wins count more.** Score a recovery as **recovery uplift over
  baseline** (did the agent beat what would have happened anyway?) **× dollars at
  risk**, weighted up by (1) dollar amount, (2) days overdue, and (3) customer risk =
  **relative DSO vs. the Pro's own average**. So recovering from a chronically-late,
  high-DSO customer counts for more than nudging someone who'd have paid on time
  regardless — and the agent **cannot game the metric** by cherry-picking sure-payers.
- **Wins dashboard.** The weighted recoveries surface on a dashboard so the Pro *sees*
  the value the agent created (this is also the trust surface — §8).

## 8. Trust & control — never an autopilot

**Principle: the Pro is always in the loop and always in control.** The agent never
runs as a black-box autopilot; the Pro always has a view into what's been sent and
what's queued for review, and the Pro tunes behavior with **simple dials, not
prompt-engineering** — because Pros aren't technical and won't hand-hold a system.

**The control surface (MVP): ~4 sliders + one list.**
- **Persistence** — gentle nudge ↔ keep at it
- **Tone** — warm/neighborly ↔ firm/businesslike
- **Leash** — draft everything for me ↔ auto-send the easy ones (the autonomy dial)
- **Loop-me-in threshold** — a dollar amount above which everything comes to the Pro
- **VIP list** — **auto-populates** from bucket-A signals where available, and the Pro
  can add names; VIPs always get kid gloves + human review

**How autonomy graduates (earned, per-segment, with evidence).** Trust is never a
blanket "trust me now." The dashboard shows the agent's track record per segment
(e.g. "proposed 40, you approved 38 unedited on small forgot-to-pay invoices"), and
only then does the agent offer to move *that segment's* leash toward auto-send — which
the Pro confirms with the dial. If failures reappear, the Pro dials it back with a
slider. **The early stage trains the Pro as much as the agent.**

## 9. Guardrails — hard stops, never violated (even at the cost of a recovery)

1. **Never dun a customer who may have already paid or has an open dispute** — the
   cardinal failure.
2. **Never use legal/collections language with a VIP.**
3. **Never contact outside quiet hours — 9pm–6am in the *customer's* local time**
   (not the Pro's; the customer is the one being messaged).
4. **When the non-payment reason is uncertain, act only on the safe default** (gentle
   "forgot" nudge); never fire a segment-specific play on a low-confidence guess.

## 10. Failure & uncertainty behavior — when the agent is wrong

When a customer replies "I already paid" or "this charge is wrong":
- **Halt** the thread immediately and **suppress** further reminders on the invoice.
- **Pause the agent across *all* of that customer's open invoices** until the Pro
  reviews — one "I already paid" signals the Pro's records may be out of sync for the
  whole relationship, so freezing all threads is the safe default.
- **Surface to the Pro** with the customer's own words plus a ready-to-send
  apology/correction draft — review, not compose.
- **Log it** as a signal that adjusts future behavior for that customer.

## 11. Measurement (outcome metrics + AI quality bar)

Full spec lives in [05-eval-spec.md](05-eval-spec.md); the framing-level targets:
- **Outcome:** DSO reduction vs. the Pro's own baseline; weighted dollars recovered
  (§7); % of overdue invoices resolved with zero Pro touches; Pro hours saved.
- **AI quality bar before shipping:** ~zero false-dun rate on already-paid/disputed
  invoices (the cardinal failure); non-payment-reason classification accuracy above a
  set bar; tone/appropriateness pass rate on generated messages; correct guardrail
  adherence on quiet hours and VIP handling.

---

*Context sources: [ar-stats.md](02-research/ar-stats.md),
[pro-quotes.md](02-research/pro-quotes.md),
[competitor-notes.md](02-research/competitor-notes.md),
[hcp-company-fintech-deep-dive.md](../context/hcp-research/hcp-company-fintech-deep-dive.md),
[case-study brief](00-case-study-brief.md).*
