import { NextResponse } from "next/server";
import { getSettings, updateSettings } from "../../../lib/data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(getSettings());
}

export async function POST(req: Request) {
  const patch = await req.json();
  const updated = updateSettings(patch);
  return NextResponse.json(updated);
}
