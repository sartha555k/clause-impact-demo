export type ClauseKey = "3a" | "5b" | "9c";

export interface BusinessFacts {
  processes_personal_data: boolean;
  cross_border_transfers: boolean;
  uses_third_party_processors: boolean;
}

export interface Business extends BusinessFacts {
  id: string;
  name: string;
  tagline: string;
  employees: number;
  revenue_eur_m: number;
  founded_year: number;
}

export interface Clause {
  key: ClauseKey;
  label: string;
  title: string;
  current_text: string;
  amended_text: string;
}

export type FactOverride = Partial<BusinessFacts>;

export interface Scenario {
  amendedClauses: ClauseKey[];
  factOverrides: Record<string, FactOverride>;
}

export interface ClauseEval {
  applies: boolean;
  trace: string[];
}

export interface BusinessEval {
  businessId: string;
  inScope: boolean;
  clauses: Record<ClauseKey, ClauseEval>;
  obligations: string[];
}

export interface Evaluation {
  scenario: Scenario;
  results: BusinessEval[];
}

export interface BusinessImpact {
  businessId: string;
  changed: boolean;
  newlyInScope: boolean;
  newlyExempt: boolean;
  newObligations: string[];
  removedObligations: string[];
  changedClauses: ClauseKey[];
  reviewerQuestions: string[];
}

export interface Impact {
  baseline: Evaluation;
  scenario: Evaluation;
  businesses: BusinessImpact[];
  newlyInScopeCount: number;
  newlyExemptCount: number;
  newObligationCount: number;
}
