"use client";

import type { Business, BusinessEval, BusinessImpact, Clause, ClauseKey, FactOverride } from "@/lib/types";
import { wordDiff } from "@/lib/diff";

const FACT_FIELDS: { key: keyof FactOverride; label: string }[] = [
  { key: "processes_personal_data", label: "Processes personal data" },
  { key: "cross_border_transfers", label: "Transfers customer data outside the Union" },
  { key: "uses_third_party_processors", label: "Uses third-party processors abroad" },
];

function DiffLine({ oldText, newText, side }: { oldText: string; newText: string; side: "old" | "new" }) {
  const { oldSide, newSide } = wordDiff(oldText, newText);
  const ops = side === "old" ? oldSide : newSide;
  return (
    <p className="diff-sentence diff-sentence--sm">
      {ops.map((op, i) => (
        <span key={i} className={op.type === "del" ? "diff-del" : op.type === "add" ? "diff-add" : undefined}>
          {op.text}{" "}
        </span>
      ))}
    </p>
  );
}

export default function EvidenceDrawer({
  business,
  before,
  after,
  impact,
  clauses,
  overrides,
  onOverride,
  onClose,
}: {
  business: Business;
  before: BusinessEval;
  after: BusinessEval;
  impact: BusinessImpact | null;
  clauses: Clause[];
  overrides: FactOverride;
  onOverride: (key: keyof FactOverride, value: boolean) => void;
  onClose: () => void;
}) {
  const clauseByKey = new Map(clauses.map((c) => [c.key, c]));
  const changedClauses = impact?.changedClauses ?? [];

  return (
    <div className="drawer-root">
      <div className="drawer-backdrop" onClick={onClose} />
      <aside className="drawer">
        <header className="drawer__head">
          <div>
            <h2>{business.name}</h2>
            <p className="drawer__tagline">{business.tagline}</p>
          </div>
          <button className="drawer__close" onClick={onClose} aria-label="Close">
            x
          </button>
        </header>

        <div className="drawer__stats">
          <div>
            <span className="stat__num">{business.employees}</span>
            <span className="stat__lbl">employees</span>
          </div>
          <div>
            <span className="stat__num">EUR {business.revenue_eur_m}M</span>
            <span className="stat__lbl">revenue</span>
          </div>
          <div>
            <span className="stat__num">{business.founded_year}</span>
            <span className="stat__lbl">incorporated</span>
          </div>
        </div>

        <section className="drawer__section">
          <h4>Business facts - toggle one and watch the graph</h4>
          {FACT_FIELDS.map(({ key, label }) => {
            const value = overrides[key] ?? business[key];
            const dirty = overrides[key] !== undefined && overrides[key] !== business[key];
            return (
              <label key={key} className={`fact-toggle ${dirty ? "fact-toggle--dirty" : ""}`}>
                <span>{label}</span>
                <span className="switch switch--sm">
                  <input type="checkbox" checked={value} onChange={(e) => onOverride(key, e.target.checked)} />
                  <span className="switch__track" />
                </span>
              </label>
            );
          })}
        </section>

        <section className="drawer__section">
          <h4>Obligations</h4>
          {after.obligations.length === 0 && <p className="muted">No obligations under the simulated text.</p>}
          {after.obligations.map((o) => (
            <div key={o} className={`obl ${impact?.newObligations.includes(o) ? "obl--new" : ""}`}>
              {o}
              {impact?.newObligations.includes(o) && <span className="obl__tag">new</span>}
            </div>
          ))}
          {impact?.removedObligations.map((o) => (
            <div key={o} className="obl obl--removed">
              {o}
              <span className="obl__tag obl__tag--lifted">lifted</span>
            </div>
          ))}
          {impact?.newlyInScope && <p className="impact-flag impact-flag--hit">Newly pulled into scope by the amendment.</p>}
          {impact?.newlyExempt && <p className="impact-flag impact-flag--relief">Newly outside the scope of the Ordinance.</p>}
        </section>

        <section className="drawer__section">
          <h4>Rule trace</h4>
          {(Object.keys(after.clauses) as ClauseKey[]).map((k) => {
            const ce = after.clauses[k];
            const changed = changedClauses.includes(k);
            const clause = clauseByKey.get(k)!;
            return (
              <details key={k} className={`trace ${changed ? "trace--changed" : ""}`} open={changed}>
                <summary>
                  <span className="clause-chip">{clauseByKey.get(k)?.label}</span> {clauseByKey.get(k)?.title}
                  <span className={`trace__verdict ${ce.applies ? "trace__verdict--yes" : ""}`}>
                    {ce.applies ? "applies" : "does not apply"}
                  </span>
                </summary>
                {changed && (
                  <div className="trace__diff">
                    <span className="clause-tag clause-tag--now">before</span>
                    <DiffLine oldText={clause.current_text} newText={clause.amended_text} side="old" />
                    <span className="clause-tag clause-tag--prop">after</span>
                    <DiffLine oldText={clause.current_text} newText={clause.amended_text} side="new" />
                  </div>
                )}
                <ol>
                  {ce.trace.map((t, i) => (
                    <li key={i}>{t}</li>
                  ))}
                </ol>
              </details>
            );
          })}
        </section>

        {impact && impact.reviewerQuestions.length > 0 && (
          <section className="drawer__section">
            <h4>Hand to a human reviewer</h4>
            {impact.reviewerQuestions.map((q, i) => (
              <p key={i} className="review-q">
                {q}
              </p>
            ))}
          </section>
        )}

        <footer className="drawer__foot">Fictional business, fictional regulation. Demo data only - not legal advice.</footer>
      </aside>
    </div>
  );
}
