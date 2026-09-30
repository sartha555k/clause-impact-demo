import type {
  Business,
  BusinessEval,
  BusinessImpact,
  ClauseEval,
  ClauseKey,
  Evaluation,
  Impact,
  Scenario,
} from "./types";

export const CURRENT_YEAR = 2026;
export const EARLY_STAGE_EXEMPTION_YEARS = 3;

const OBLIGATION_LABEL: Record<ClauseKey, string> = {
  "3a": "Ordinance applies - registration & compliance programme",
  "5b": "Cross-border transfer registration duty",
  "9c": "Quarterly compliance reporting duty",
};

function eval3a(b: Business, amended: boolean): ClauseEval {
  const trace: string[] = [];
  if (!amended) {
    const emp = b.employees >= 50;
    const rev = b.revenue_eur_m > 10;
    trace.push(`Headcount test: ${b.employees} employees vs threshold 50 -> ${emp ? "MET" : "not met"}`);
    trace.push(`Revenue test: EUR ${b.revenue_eur_m}M vs EUR 10M -> ${rev ? "MET" : "not met"}`);
    const applies = emp || rev;
    trace.push(`Either test is sufficient -> ${applies ? "IN SCOPE" : "OUT OF SCOPE"}`);
    return { applies, trace };
  }
  const emp = b.employees >= 20;
  const rev = b.revenue_eur_m > 5;
  const ppd = b.processes_personal_data;
  trace.push(`Amended headcount test: ${b.employees} employees vs threshold 20 -> ${emp ? "MET" : "not met"}`);
  trace.push(`Amended revenue test: EUR ${b.revenue_eur_m}M vs EUR 5M -> ${rev ? "MET" : "not met"}`);
  trace.push(`Personal-data proviso: processes personal data = ${ppd ? "yes" : "no"} -> ${ppd ? "MET" : "NOT MET"}`);
  const threshold = emp || rev;
  const applies = threshold && ppd;
  trace.push(
    `Threshold ${threshold ? "met" : "not met"} AND proviso ${ppd ? "met" : "not met"} -> ${applies ? "IN SCOPE" : "OUT OF SCOPE"}`
  );
  return { applies, trace };
}

function eval5b(b: Business, amended: boolean): ClauseEval {
  const trace: string[] = [];
  const direct = b.cross_border_transfers;
  trace.push(`Direct transfers of customer data outside the Union: ${direct ? "yes" : "no"} -> ${direct ? "MET" : "not met"}`);
  if (!amended) {
    trace.push(`Current text reaches direct transfers only -> ${direct ? "DUTY APPLIES" : "NO DUTY"}`);
    return { applies: direct, trace };
  }
  const tpp = b.uses_third_party_processors;
  trace.push(`Engages a third-party processor that transfers data abroad: ${tpp ? "yes" : "no"} -> ${tpp ? "MET" : "not met"}`);
  const applies = direct || tpp;
  trace.push(`Amended text reaches either route -> ${applies ? "DUTY APPLIES" : "NO DUTY"}`);
  return { applies, trace };
}

function eval9c(b: Business, amended: boolean, inScope: boolean): ClauseEval {
  const trace: string[] = [];
  if (!inScope) {
    trace.push("Business is out of scope under §3(a) -> reporting duty does not arise");
    return { applies: false, trace };
  }
  trace.push("Business is in scope under §3(a) -> quarterly reporting duty arises");
  if (!amended) {
    trace.push("Current text contains no exemptions -> DUTY APPLIES");
    return { applies: true, trace };
  }
  const cutoff = CURRENT_YEAR - EARLY_STAGE_EXEMPTION_YEARS + 1;
  const exempt = b.founded_year >= cutoff;
  trace.push(
    `Early-stage exemption: incorporated ${b.founded_year}, cutoff ${cutoff} (${EARLY_STAGE_EXEMPTION_YEARS} years) -> ${exempt ? "EXEMPT" : "not exempt"}`
  );
  trace.push(exempt ? "Amended text lifts the duty -> NO DUTY" : "Exemption does not apply -> DUTY APPLIES");
  return { applies: !exempt, trace };
}

function applyOverrides(b: Business, scenario: Scenario): Business {
  const o = scenario.factOverrides[b.id];
  if (!o) return b;
  return {
    ...b,
    processes_personal_data: o.processes_personal_data ?? b.processes_personal_data,
    cross_border_transfers: o.cross_border_transfers ?? b.cross_border_transfers,
    uses_third_party_processors: o.uses_third_party_processors ?? b.uses_third_party_processors,
  };
}

export function evaluate(businesses: Business[], scenario: Scenario): Evaluation {
  const amended = new Set(scenario.amendedClauses);
  const results: BusinessEval[] = businesses.map((raw) => {
    const b = applyOverrides(raw, scenario);
    const c3a = eval3a(b, amended.has("3a"));
    const c5b = eval5b(b, amended.has("5b"));
    const c9c = eval9c(b, amended.has("9c"), c3a.applies);
    const clauses: Record<ClauseKey, ClauseEval> = { "3a": c3a, "5b": c5b, "9c": c9c };
    const obligations = (Object.keys(clauses) as ClauseKey[]).filter((k) => clauses[k].applies).map((k) => OBLIGATION_LABEL[k]);
    return { businessId: b.id, inScope: c3a.applies, clauses, obligations };
  });
  return { scenario, results };
}

export const BASELINE_SCENARIO: Scenario = { amendedClauses: [], factOverrides: {} };

function reviewerQuestionsFor(
  b: Business,
  before: BusinessEval,
  after: BusinessEval,
  changedClauses: ClauseKey[]
): string[] {
  const qs: string[] = [];
  if (!before.inScope && after.inScope) {
    qs.push(
      `Confirm ${b.name} meets the amended §3(a) threshold on current figures (${b.employees} employees, EUR ${b.revenue_eur_m}M revenue) and that its data processing qualifies as "personal data" under §1(4).`
    );
  }
  if (before.inScope && !after.inScope) {
    qs.push(
      `The amended §3(a) proviso is the only basis for ${b.name}'s exemption - verify with a reviewer that it does not process personal data as defined in §1(4).`
    );
  }
  for (const key of changedClauses) {
    if (key === "5b" && !before.clauses["5b"].applies && after.clauses["5b"].applies) {
      qs.push(
        `Map which of ${b.name}'s third-party processors move customer data outside the Union, and assign an owner for each new registration.`
      );
    }
    if (key === "9c" && before.clauses["9c"].applies && !after.clauses["9c"].applies) {
      qs.push(
        `Confirm ${b.name}'s incorporation date (${b.founded_year}) against the commercial register before relying on the early-stage exemption.`
      );
    }
    if (key === "9c" && !before.clauses["9c"].applies && after.clauses["9c"].applies) {
      qs.push(`Set up ${b.name}'s first quarterly compliance report and assign an internal owner before the next filing window.`);
    }
  }
  return qs;
}

export function impact(businesses: Business[], scenario: Scenario): Impact {
  const baseline = evaluate(businesses, BASELINE_SCENARIO);
  const after = evaluate(businesses, scenario);
  const byId = new Map(businesses.map((b) => [b.id, b]));
  const impacts: BusinessImpact[] = baseline.results.map((before) => {
    const s = after.results.find((r) => r.businessId === before.businessId)!;
    const b = byId.get(before.businessId)!;
    const newObligations = s.obligations.filter((o) => !before.obligations.includes(o));
    const removedObligations = before.obligations.filter((o) => !s.obligations.includes(o));
    const changedClauses = (Object.keys(before.clauses) as ClauseKey[]).filter(
      (k) => before.clauses[k].applies !== s.clauses[k].applies
    );
    const newlyInScope = !before.inScope && s.inScope;
    const newlyExempt = before.inScope && !s.inScope;
    return {
      businessId: before.businessId,
      changed: newObligations.length > 0 || removedObligations.length > 0 || newlyInScope || newlyExempt,
      newlyInScope,
      newlyExempt,
      newObligations,
      removedObligations,
      changedClauses,
      reviewerQuestions: reviewerQuestionsFor(b, before, s, changedClauses),
    };
  });
  return {
    baseline,
    scenario: after,
    businesses: impacts,
    newlyInScopeCount: impacts.filter((i) => i.newlyInScope).length,
    newlyExemptCount: impacts.filter((i) => i.newlyExempt).length,
    newObligationCount: impacts.reduce((n, i) => n + i.newObligations.length, 0),
  };
}
