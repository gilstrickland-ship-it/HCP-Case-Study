import { NextResponse } from "next/server";
import { runEval } from "../../../lib/evalRunner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Run the 15-case eval through the real pipeline; enforce the P0 = 0 gate.
export async function POST(req: Request) {
  let caseId: number | undefined;
  try {
    const body = await req.json();
    caseId = body?.caseId;
  } catch {
    // no body -> run all
  }
  const out = await runEval(caseId);
  return NextResponse.json(out);
}
