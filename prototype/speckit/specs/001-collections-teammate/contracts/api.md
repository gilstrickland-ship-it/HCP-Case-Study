# API Contracts — AI Collections Teammate

All routes are Next.js Node-runtime handlers under `prototype/app/api/`. All Claude
calls happen here (server-side); the browser never sees the key. Each route degrades
to a deterministic fallback when the API key is missing or a call fails.

## POST /api/process
Run the full agent loop on one invoice (classify → confidence fallback → select play →
compose → gate). The two Claude steps (classify, compose) live inside this loop.
- **Request**: `{ invoiceId: string, localHour?: number }`
- **Response**: the `processInvoice` result — `{ decision, reason, confidence, draft,
  contextBuckets, guardrailTrace, source }`
- **Guarantee**: `guardrails.gate()` runs server-side; the LLM never decides
  sendability. VIP legal-language stripping is enforced in `guardrails.ts`, not trusted
  to the model.

## POST /api/reply
Triage an inbound customer reply; on already-paid/dispute, halt + freeze ALL of the
customer's open invoices (constitution IV), enforced in code.
- **Request**: `{ invoiceId: string, reply: string }`
- **Response**: `{ triage: { intent, promiseDate, failureFlags, draft, source },
  decision: "halt"|"queue_for_review", frozenInvoices: string[], customerName: string }`
- **Guarantee**: on `failureFlags.alreadyPaid` or `failureFlags.disputed`, the agent
  halts the thread and freezes every open invoice for that customer.

## POST /api/send
Record an approved/auto send onto the invoice thread (feeds the dashboard).
- **Request**: `{ invoiceId: string, body: string }`
- **Response**: `{ ok: true, status: InvoiceStatus }`

## GET / POST /api/settings
Read or patch Pro settings (sliders, VIP list, per-segment autonomy, baseline DSO).
- **GET Response**: `ProSettings`
- **POST Request**: `Partial<ProSettings>` → **Response**: updated `ProSettings`
