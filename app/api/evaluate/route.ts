import { NextResponse } from "next/server";
import { getBusinesses, logEvaluationRun } from "@/lib/db";
import { impact } from "@/lib/engine";
import type { Scenario } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { scenario?: Scenario };
  const scenario: Scenario = body.scenario ?? { amendedClauses: [], factOverrides: {} };
  const businesses = await getBusinesses();
  const result = impact(businesses, scenario);
  const newlyIn = result.businesses.filter((b) => b.newlyInScope).map((b) => b.businessId);
  const newlyOut = result.businesses.filter((b) => b.newlyExempt).map((b) => b.businessId);
  await logEvaluationRun(scenario, newlyIn, newlyOut);
  return NextResponse.json(result);
}
