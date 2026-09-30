import { getBusinesses, getClauses, getRegulation } from "@/lib/db";
import { evaluate, BASELINE_SCENARIO } from "@/lib/engine";
import DemoClient from "@/components/DemoClient";

export const dynamic = "force-dynamic";

export default async function Page() {
  const [clauses, businesses] = await Promise.all([getClauses(), getBusinesses()]);
  const baseline = evaluate(businesses, BASELINE_SCENARIO);
  return (
    <DemoClient
      regulation={getRegulation()}
      clauses={clauses}
      businesses={businesses}
      baseline={baseline}
    />
  );
}
