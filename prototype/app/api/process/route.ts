import { NextResponse } from "next/server";
import { getInvoice } from "../../../lib/data";
import { processInvoice } from "../../../lib/agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Runs the full agent loop on one invoice: classify -> confidence fallback ->
// select play -> compose -> gate. (classify + draft from contracts/api.md are the
// two Claude steps inside this loop.)
export async function POST(req: Request) {
  const { invoiceId, localHour } = await req.json();
  const invoice = getInvoice(invoiceId);
  if (!invoice) {
    return NextResponse.json({ error: "invoice not found" }, { status: 404 });
  }
  const result = await processInvoice(invoice, { localHour });
  return NextResponse.json(result);
}
