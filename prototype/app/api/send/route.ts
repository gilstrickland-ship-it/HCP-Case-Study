import { NextResponse } from "next/server";
import { getInvoice } from "../../../lib/data";
import { markSent } from "../../../lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Record an approved/auto send onto the invoice thread (feeds the dashboard).
export async function POST(req: Request) {
  const { invoiceId, body } = await req.json();
  const invoice = getInvoice(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "invoice not found" }, { status: 404 });
  }
  markSent(invoiceId, body);
  return NextResponse.json({ ok: true, status: invoice.status });
}
