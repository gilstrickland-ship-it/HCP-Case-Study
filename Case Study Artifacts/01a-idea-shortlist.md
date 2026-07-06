# Idea Shortlist — 5 Candidates for the Highest-Leverage Bet

Five prototype-ready candidates for improving *getting Pros paid and on time*,
each framed with its target pain point, what "good" looks like, and what failure
looks like. Deliberately spread across the payment lifecycle (prevention →
prioritization → action → reply-handling → affordability) and across the distinct
root causes of late payment, so these are genuinely different bets rather than five
variations of "smarter reminder."

Acronyms: AR = accounts receivable (money owed on issued invoices). DSO = days
sales outstanding (average days from invoicing to receiving payment; lower is
better). LLM = large language model. APR = annual percentage rate.

## The anchor insight

Late payment is not one behavior — it splits into **forgot**, **can't pay right
now**, **disputes the bill**, and **won't pay**, and each needs a different remedy
and a different tone
([ar-stats.md](02-research/ar-stats.md); root-cause data from
[Atradius via Clockify](https://clockify.me/late-invoice-statistics)).

The clearest structural gap: across Housecall Pro (HCP), Jobber, and ServiceTitan,
follow-up is rule-based (fixed templates on fixed timers), **no one handles customer
replies**, **no one prioritizes** which invoice to chase, and **no HCP AI Team
member owns collections/AR**
([competitor-notes.md](02-research/competitor-notes.md);
[HCP invoice reminders](https://help.housecallpro.com/en/articles/4249157-how-do-i-set-up-invoice-reminders),
[Jobber invoice reminders](https://help.getjobber.com/hc/en-us/articles/115009517847-Invoice-Reminders),
[ServiceTitan — collect what you're owed](https://help.servicetitan.com/docs/collect-what-youre-owed),
[HCP AI Team overview](https://help.housecallpro.com/en/articles/9311875-ai-team-overview)).

---

## Idea 1 — AI Collections Teammate (adaptive dunning agent)

An "AR teammate" that owns the post-invoice recovery loop end-to-end: classifies
*why* each invoice is unpaid, adapts message/tone/timing/channel per customer and
amount, handles replies, tracks payment promises, and escalates to the Pro only
when judgment is needed.

- **Pain point & why:** Reminders today are template- and timer-based — same
  cadence regardless of customer, amount, or reason
  ([competitor-notes.md](02-research/competitor-notes.md);
  [HCP invoice reminders](https://help.housecallpro.com/en/articles/4249157-how-do-i-set-up-invoice-reminders)).
  Pros spend ~14 hrs/week chasing payment
  ([ar-stats.md](02-research/ar-stats.md);
  [FundTap](https://fundtap.co/resources/why-chasing-invoices-costs-more-than-you-think),
  [Chaser](https://www.chaserhq.com/blog/the-time-cost-of-late-payments)),
  and the person doing it is the owner, at night, with no back office
  ([pro-quotes.md](02-research/pro-quotes.md);
  [ACCA blog](https://hvac-blog.acca.org/what-do-i-do-when-a-customer-doesnt-pay/)).
  This is the thinnest, highest-value part of the stack and the one no competitor
  and no HCP AI Team member owns
  ([hcp-company-fintech-deep-dive.md §2, §4](../context/hcp-research/hcp-company-fintech-deep-dive.md)).
- **What good looks like:** DSO drops 6+ days, in line with AI-in-AR benchmarks
  (99% of firms using AI in AR reduced DSO; 75% by 6+ days)
  ([ar-stats.md](02-research/ar-stats.md);
  [Billtrust — State of AI in AR 2025](https://www.billtrust.com/resources/blog/the-state-of-ai-in-accounts-receivable-2025),
  [Billtrust DSO study](https://www.billtrust.com/news/study-finds-ai-in-accounts-receivable-reduces-dso));
  a measurable share of overdue invoices resolve with zero Pro touches.
- **What failure looks like:** The "5 late-payment requests after they've paid"
  scenario — dunning a customer who already paid or has a legitimate dispute, which
  damages the relationship faster than the unpaid invoice did
  ([pro-quotes.md](02-research/pro-quotes.md);
  [Trustpilot](https://www.trustpilot.com/review/housecallpro.com?page=7)).
- **AI leverage:** High and central — reason-classification + generative,
  context-aware messaging is the core of the product.

## Idea 2 — Reply Triage & Promise-Keeper

Narrower sibling of #1, focused on the *inbound* side. When a customer replies to a
reminder — "I'll pay Friday," "this charge is wrong," "what's this for?" — AI
classifies intent, drafts the right response, logs the promise, and auto-follows-up
when a promise is broken.

- **Pain point & why:** Every system today hands the reply thread back to the Pro
  with no triage and no tracking of promises made
  ([competitor-notes.md](02-research/competitor-notes.md)); broken payment promises
  are a named driver of wasted follow-up time
  ([ar-stats.md](02-research/ar-stats.md)). HCP already ships the unified inbox
  surface this would live in
  ([hcp-company-fintech-deep-dive.md §4](../context/hcp-research/hcp-company-fintech-deep-dive.md);
  [Fall 2025 press release](https://www.prnewswire.com/news-releases/housecall-pro-unveils-major-ai-powered-updates-for-fall-2025-302594189.html)).
- **What good looks like:** Replies get an accurate first-draft response in seconds;
  promises are tracked and honored-or-chased automatically; disputes route to the
  Pro fast instead of festering.
- **What failure looks like:** Misclassifying a dispute as a stall (nagging someone
  with a legitimate complaint), or auto-sending a tone-deaf reply that reads like a
  collections agency — which Pros fear because they live on repeat business and
  referrals ([pro-quotes.md](02-research/pro-quotes.md)).
- **AI leverage:** High — intent classification + drafting on messy free-text
  replies is inherently an LLM job.

## Idea 3 — "Who to Chase Today" (AR prioritization / risk scoring)

Decision-support, low-autonomy: a model that scores every open invoice by
likelihood-to-self-resolve vs. needs-attention vs. likely-won't-pay, and surfaces
the 3 that matter today with a recommended action. The Pro stays in control of
sending.

- **Pain point & why:** Nobody tells a Pro *which* overdue invoices are worth
  attention today; the best any competitor does is aging buckets
  ([competitor-notes.md](02-research/competitor-notes.md);
  [ServiceTitan — collect what you're owed](https://help.servicetitan.com/docs/collect-what-youre-owed)).
  Enforcement is hollow below ~$2–5K, so attention is the scarce resource and
  spending it well is the whole game
  ([pro-quotes.md](02-research/pro-quotes.md);
  [HVAC Site forum](https://www.hvacsite.com/threads/anyone-dealing-with-some-non-paying-customers.87/)).
- **What good looks like:** More dollars recovered per hour of Pro effort; the Pro
  trusts the daily "top 3" enough to stop scrolling the full aging list.
- **What failure looks like:** Ranking that feels arbitrary or wrong (surfacing a
  customer about to pay, burying the one truly at risk) kills trust in one bad week;
  or it's just a prettier dashboard nobody opens.
- **AI leverage:** Medium — predictive scoring is real value, but it's the least
  generative idea and closest to a non-AI analytics feature, weakening the
  "AI is central" mandate.

## Idea 4 — Dispute-Proof Invoice (prevention at creation)

Shift left: AI reviews the estimate→invoice *before it's sent*, flags what's likely
to cause a delay or dispute (vague line items, no photos, amount higher than the
estimate, missing terms), suggests a deposit on large jobs, and drafts a
plain-language walkthrough message.

- **Pain point & why:** Invoice disputes and process friction (forgotten invoices,
  unclear charges) are top root causes of late payment
  ([ar-stats.md](02-research/ar-stats.md);
  [Atradius via Clockify](https://clockify.me/late-invoice-statistics));
  the Pros who avoid the problem do it with process discipline — deposits, clarity,
  walking the customer through the invoice on site
  ([pro-quotes.md](02-research/pro-quotes.md);
  [ACCA blog](https://hvac-blog.acca.org/what-do-i-do-when-a-customer-doesnt-pay/)).
  This prevents the unpaid invoice instead of recovering it.
- **What good looks like:** Fewer invoices ever go overdue; dispute rate and
  time-to-first-payment drop; deposit attach-rate on large jobs rises.
- **What failure looks like:** False-positive warnings on every invoice (Pro turns
  it off), or generic advice that doesn't fit a specific trade/job — friction added,
  no payment behavior changed. Prevention is also harder to attribute, so wins are
  less demoable.
- **AI leverage:** Medium-high — reviewing unstructured invoice content and
  generating tailored guidance is LLM-shaped, but the value is diffuse and slower to
  prove.

## Idea 5 — Payment-Plan Concierge (affordability rescue)

For the "can't pay right now" segment, AI detects likely affordability stalls and
proactively offers a structured path in the Pro's voice — partial payment, a payment
schedule, or Wisetack financing — converting a stuck balance into a plan the
customer will actually complete.

- **Pain point & why:** Customer cash-flow pressure is the single largest root cause
  of overdue invoices (~43%)
  ([ar-stats.md](02-research/ar-stats.md);
  [Atradius via Clockify](https://clockify.me/late-invoice-statistics)). HCP already
  owns the rails — Wisetack financing, where the Pro is paid in full at a flat 3.9% —
  but it's positioned at point-of-sale, not as a *rescue* for an already-overdue
  invoice
  ([hcp-company-fintech-deep-dive.md §2](../context/hcp-research/hcp-company-fintech-deep-dive.md);
  [HCP consumer financing](https://www.housecallpro.com/features/consumer-financing/),
  [Wisetack overview](https://help.housecallpro.com/en/articles/4720493-wisetack-consumer-lending-overview);
  [competitor-notes.md](02-research/competitor-notes.md)).
- **What good looks like:** Stuck balances in the "can't pay" bucket get recovered as
  plans instead of written off; financing/plan attach-rate on overdue invoices
  climbs; recovery on sub-$5K balances (where liens/lawyers don't pencil out) rises.
- **What failure looks like:** Offering financing to someone who simply *forgot*
  (leaving money and goodwill on the table), or pushing a plan that reads as
  predatory and hurts the relationship. Misreading *won't-pay* as *can't-pay* wastes
  the offer.
- **AI leverage:** Medium-high — leverage is in detecting the affordability segment
  and personalizing the offer; the financial rails already exist.

---

## Leverage read

| Idea | Root cause targeted | AI centrality | Time-to-demo | Whitespace vs. competitors |
|---|---|---|---|---|
| **1. Collections Teammate** | All 4 (adaptive) | ★★★ Highest | Medium | Total — nobody owns this |
| **2. Reply Triage** | Forgot / disputes | ★★★ High | Fast | Total — no one handles replies |
| **3. Who to Chase** | Prioritization | ★★ Medium | Fast | Aging buckets only |
| **4. Dispute-Proof Invoice** | Disputes / friction | ★★☆ Med-high | Slow (attribution) | Unaddressed, but diffuse |
| **5. Payment-Plan Concierge** | Can't pay (~43%) | ★★☆ Med-high | Medium | Rails exist, unused for recovery |

**Recommendation:** **Idea 1 is the highest-leverage bet, with Idea 2 as its natural
MVP core.** It sits on the single thinnest part of HCP's fintech stack (post-invoice
recovery), it's the one area with zero competitive coverage, it attacks the biggest
measurable cost (14 hrs/week + DSO), AI is unambiguously central
(reason-classification + generative messaging + reply handling), and it slots into
HCP's existing "AI Team + unified inbox" framing as the missing "AR teammate." The
reply-triage engine (Idea 2) is the demoable heart of it and where the sharpest
trust/failure story lives — exactly what the case-study rubric weights
([00-case-study-brief.md](00-case-study-brief.md)).

## Source index

Internal research these conclusions draw from:
- [02-research/ar-stats.md](02-research/ar-stats.md) — AR scale, time cost, DSO
  benchmarks, root causes, AI-in-AR adoption.
- [02-research/pro-quotes.md](02-research/pro-quotes.md) — voice of the Pro; the
  relationship constraint and embarrassment risk.
- [02-research/competitor-notes.md](02-research/competitor-notes.md) — HCP current
  state and Jobber/ServiceTitan follow-up gaps.
- [../context/hcp-research/hcp-company-fintech-deep-dive.md](../context/hcp-research/hcp-company-fintech-deep-dive.md)
  — HCP fintech stack, AI Team, and the post-invoice recovery gap.
- [00-case-study-brief.md](00-case-study-brief.md) — the assignment and rubric.
