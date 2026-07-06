import { NextResponse } from "next/server";
import { getInvoice, getCustomer } from "../../../lib/data";
import { triageReply } from "../../../lib/anthropic";
import { freezeCustomer } from "../../../lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Triage an inbound customer reply. On already-paid/dispute, halt + freeze ALL of
// the customer's open invoices (constitution IV) — enforced here in code.
export async function POST(req: Request) {
  const { invoiceId, reply } = await req.json();
  const invoice = getInvoice(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "invoice not found" }, { status: 404 });
  }
  const customer = getCustomer(invoice.customerId)!;

  const triage = await triageReply(reply, customer.name);

  // Record the inbound reply on the thread.
  invoice.thread.push({
    id: `m_in_${invoice.thread.length + 1}_${invoice.id}`,
    direction: "in",
    body: reply,
    status: "sent",
    intent: triage.intent,
    promiseDate: triage.promiseDate,
    createdAt: new Date().toISOString(),
  });

  // Cardinal failure path.
  let frozenInvoices: string[] = [];
  let decision: "halt" | "queue_for_review" = "queue_for_review";
  if (triage.failureFlags.alreadyPaid || triage.failureFlags.disputed) {
    if (triage.failureFlags.disputed) invoice.disputed = true;
    frozenInvoices = freezeCustomer(invoice.customerId);
    decision = "halt";
  }

  return NextResponse.json({
    triage,
    decision,
    frozenInvoices,
    customerName: customer.name,
  });
}
