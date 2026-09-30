import { NextResponse } from "next/server";
import { getBusinesses, getClauses, getRegulation } from "@/lib/db";
import { evaluate, BASELINE_SCENARIO } from "@/lib/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [clauses, businesses] = await Promise.all([getClauses(), getBusinesses()]);
  const baseline = evaluate(businesses, BASELINE_SCENARIO);
  return NextResponse.json({ regulation: getRegulation(), clauses, businesses, baseline });
}
