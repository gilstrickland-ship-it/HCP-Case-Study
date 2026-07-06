# Competitor & Current-State Notes

How Housecall Pro and its main competitors handle getting Pros paid today.
Gathered 2026-07-06 from public docs and help centers.

## Housecall Pro (current state)

**Payments stack:**
- **HCP Payments** — built-in card + ACH (Automated Clearing House, i.e. direct
  bank transfer) processing; invoices payable online
  directly from the invoice (no portal login required — reviewers praise this).
  ([HCP Payments help](https://help.housecallpro.com/en/collections/74819-hcp-payments), [payment features](https://www.housecallpro.com/features/payment/))
- **Instapay** — card/ACH deposits land in the Pro's bank in under ~30 minutes for
  +1% per transaction. Solves *speed of settlement*, not *whether the customer pays*.
  ([Instapay](https://www.housecallpro.com/features/instapay/))
- **Consumer financing (Wisetack)** — customers split $500–$25K jobs into monthly
  payments (terms to 60 months, 0–35.9% APR — annual percentage rate); **Pro gets paid in full when the job
  is done**; flat 3.9% fee to the Pro. Addresses "can't afford it" at point of sale.
  ([Wisetack overview](https://help.housecallpro.com/en/articles/4720493-wisetack-consumer-lending-overview), [consumer financing](https://www.housecallpro.com/features/consumer-financing/))

**Invoice reminders (the follow-up mechanism today):**
- Auto-send reminders by email or text for overdue invoices; customizable timing
  and frequency (up to daily, up to 30 days); can be toggled off per customer.
  ([Invoice reminders help article](https://help.housecallpro.com/en/articles/4249157-how-do-i-set-up-invoice-reminders))
- Reminders are **template-based and timer-based** — same message cadence
  regardless of customer history, amount, or reason for non-payment.

**AI Team (existing AI surface at HCP):**
- Launched 2024, expanded fall 2025: CSR AI (CSR = customer service
  representative; 24/7 call answering + booking), Analyst AI (reports/cash-flow
  answers), Coach AI, Marketing AI. Fall 2025 added a
  central inbox unifying customer/employee/AI messages.
  ([AI Team overview](https://help.housecallpro.com/en/articles/9311875-ai-team-overview), [fall 2025 press release](https://www.prnewswire.com/news-releases/housecall-pro-unveils-major-ai-powered-updates-for-fall-2025-302594189.html))
- Notable: HCP already has an AI-as-teammates framing and an inbox surface, but
  **no AI Team member owns collections/AR (accounts receivable — money owed on
  issued invoices)**.

**Company context:** ~200K+ Pros on platform; Series D unicorn ($1.1B valuation,
$125M raised June 2022); San Diego; ~1,500 employees.
([Crunchbase](https://www.crunchbase.com/organization/housecall), [funding press release](https://www.housecallpro.com/resources/news-press/press/housecall-pro-secures-new-funding/))

## Jobber

- **Invoice follow-ups**: automatic email/text reminders for past-due invoices —
  but capped at **two follow-ups**, keyed only to days-past-due. Connect plan and up.
  ([Jobber invoice reminders](https://help.getjobber.com/hc/en-us/articles/115009517847-Invoice-Reminders))
- **Automatic payments**: clients with stored payment methods are auto-charged on
  their billing frequency — prevention via card-on-file, mainly fits recurring work.
  ([Jobber automatic payments](https://help.getjobber.com/hc/en-us/articles/360036931633-Automatic-Payments))
- Positioning: praised for simplicity; the follow-up system is deliberately minimal.

## ServiceTitan

- **AR Management module**: outstanding balances organized by aging buckets;
  reminders are **manual/bulk statement emails** initiated by office staff; per-contact
  notes supported. ([Collect what you're owed](https://help.servicetitan.com/docs/collect-what-youre-owed), [automated reminders how-to](https://help.servicetitan.com/problem-solution/how-do-i-send-automated-reminders-for-customers-to-pay-their-invoices))
- **Credit Hold tag**: flags delinquent customers with a red banner at
  call/booking time — a manual trust signal, downstream of the damage.
- SMS (text-message) payment nudges require configuring **Marketing Pro**
  campaigns (separate product, more setup).
- Positioning: enterprise-grade visibility for an office/AR staff role; assumes a
  back office that smaller Pros don't have.

## Pattern across all three

1. Follow-up is **rule-based**: fixed templates on fixed timers (or manual bulk
   sends). None adapt message, tone, timing, or channel to the customer, the
   amount, or payment history.
2. **No reply handling**: when a customer responds ("I'll pay Friday," "this charge
   is wrong," "what's this for?"), every system hands the thread back to the Pro
   with no triage or tracking of promises made.
3. **No prioritization**: aging buckets at best (ServiceTitan). Nobody tells a Pro
   *which* overdue invoices are worth attention today vs. which will resolve on
   their own.
4. Prevention tools exist (financing, card-on-file, deposits) but the
   **post-invoice recovery loop is the least developed** part of every stack.
