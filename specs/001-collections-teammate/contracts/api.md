# API Contracts — AI Collections Teammate

All routes are Next.js Node-runtime handlers under `prototype/app/api/`. All Claude
calls happen here (server-side); the browser never sees the key. Each route degrades
to a deterministic fallback when the API key is missing or a call fails.

## POST /api/classify
Classify why an invoice is unpaid.
- **Request**: `{ context: CustomerInvoiceContext }`
- **Response**: `{ reason: "forgot"|"cant_pay"|"disputes"|"wont_pay", confidence: number, rationale: string, source: "llm"|"fallback" }`
- **Guarantee**: caller (`agent.ts`) applies the confidence-fallback rule; this route
  only returns the raw read.

## POST /api/draft
Compose a follow-up message.
- **Request**: `{ context, segment, tone, persistence, vip: boolean }`
- **Response**: `{ body: string, source: "llm"|"fallback" }`
- **Note**: VIP legal-language stripping is enforced downstream in `guardrails.ts`, not
  trusted to the model.

## POST /api/reply
Triage an inbound customer reply.
- **Request**: `{ thread: Message[], reply: string, context }`
- **Response**: `{ intent: "promise"|"dispute"|"already_paid"|"info_request"|"other", promiseDate: string|null, failureFlags: { alreadyPaid: boolean, disputed: boolean }, draft: string, source: "llm"|"fallback" }`
- **Guarantee**: on `alreadyPaid` or `disputed`, the agent halts + freezes all of the
  customer's invoices (code-side, per constitution IV).

## POST /api/eval
Run the eval.
- **Request**: `{ caseId?: number }` (omit to run all 15)
- **Response**: `{ results: Array<{ id, title, pass: boolean, errorClass: string|null, expected, got }>, summary: { p0Rate: number, classifyAccuracy: number, escalationRecall: number, tonemisses: number, gatePassed: boolean } }`
- **Gate**: `summary.gatePassed = (p0Rate === 0)`.
