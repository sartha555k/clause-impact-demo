"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type {
  Business,
  BusinessEval,
  Clause,
  ClauseKey,
  Evaluation,
  FactOverride,
  Impact,
  Scenario,
} from "@/lib/types";
import ClauseCard from "./ClauseCard";
import ImpactGraph from "./ImpactGraph";
import EvidenceDrawer from "./EvidenceDrawer";

const EMPTY_SCENARIO: Scenario = { amendedClauses: [], factOverrides: {} };
const CLAUSE_ORDER: ClauseKey[] = ["3a", "5b", "9c"];

function isEmpty(s: Scenario) {
  return s.amendedClauses.length === 0 && Object.keys(s.factOverrides).length === 0;
}

export default function DemoClient({
  regulation,
  clauses,
  businesses,
  baseline,
}: {
  regulation: { code: string; name: string; note: string };
  clauses: Clause[];
  businesses: Business[];
  baseline: Evaluation;
}) {
  const [scenario, setScenario] = useState<Scenario>(EMPTY_SCENARIO);
  const [impact, setImpact] = useState<Impact | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [loading, setLoading] = useState(false);
  const playCancel = useRef(false);

  // Deep-linkable scenario states, e.g. ?amended=3a,5b&open=fernleaf
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const amended = (params.get("amended") ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is ClauseKey => s === "3a" || s === "5b" || s === "9c");
    if (amended.length > 0) setScenario({ amendedClauses: amended, factOverrides: {} });
    const open = params.get("open");
    if (open && businesses.some((b) => b.id === open)) setSelectedId(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isEmpty(scenario)) {
      setImpact(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetch("/api/evaluate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ scenario }),
    })
      .then((r) => r.json())
      .then((data: Impact) => {
        if (!cancelled) setImpact(data);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [scenario]);

  const toggleClause = useCallback((key: ClauseKey) => {
    setScenario((s) => ({
      ...s,
      amendedClauses: s.amendedClauses.includes(key)
        ? s.amendedClauses.filter((k) => k !== key)
        : [...s.amendedClauses, key],
    }));
  }, []);

  const setOverride = useCallback((bizId: string, key: keyof FactOverride, value: boolean) => {
    setScenario((s) => {
      const original = businesses.find((b) => b.id === bizId)!;
      const current = { ...s.factOverrides };
      const biz = { ...(current[bizId] ?? {}) };
      if (value === original[key]) delete biz[key];
      else biz[key] = value;
      if (Object.keys(biz).length === 0) delete current[bizId];
      else current[bizId] = biz;
      return { ...s, factOverrides: current };
    });
  }, [businesses]);

  const reset = useCallback(() => {
    playCancel.current = true;
    setPlaying(false);
    setScenario(EMPTY_SCENARIO);
  }, []);

  const play = useCallback(async () => {
    if (playing) return;
    playCancel.current = false;
    setPlaying(true);
    setScenario(EMPTY_SCENARIO);
    for (const key of CLAUSE_ORDER) {
      if (playCancel.current) break;
      await new Promise((r) => setTimeout(r, 700));
      if (playCancel.current) break;
      setScenario({ amendedClauses: [key], factOverrides: {} });
      await new Promise((r) => setTimeout(r, 2100));
    }
    if (!playCancel.current) {
      await new Promise((r) => setTimeout(r, 600));
      setScenario(EMPTY_SCENARIO);
    }
    setPlaying(false);
  }, [playing]);

  const results: BusinessEval[] = impact ? impact.scenario.results : baseline.results;
  const baselineById = useMemo(() => new Map(baseline.results.map((r) => [r.businessId, r])), [baseline]);
  const resultsById = useMemo(() => new Map(results.map((r) => [r.businessId, r])), [results]);
  const impactById = useMemo(
    () => new Map((impact?.businesses ?? []).map((i) => [i.businessId, i])),
    [impact]
  );
  const changedCount = impact?.businesses.filter((b) => b.changed).length ?? 0;
  const selected = selectedId ? businesses.find((b) => b.id === selectedId) ?? null : null;
  const amendedLabels = scenario.amendedClauses
    .slice()
    .sort()
    .map((k) => clauses.find((c) => c.key === k)?.label ?? k);

  return (
    <div className="shell">
      <header className="topbar">
        <div className="topbar__left">
          <span className="reg-chip">{regulation.code}</span>
          <div>
            <h1>
              One sentence changed. <em>Who gets hit?</em>
            </h1>
            <p className="topbar__sub">{regulation.name} - change-impact explorer</p>
          </div>
        </div>
        <div className="topbar__right">
          <span className="demo-badge">FICTIONAL DEMO DATA</span>
          {!isEmpty(scenario) && (
            <button className="btn btn--ghost" onClick={reset}>
              Reset
            </button>
          )}
          <button className="btn" onClick={play} disabled={playing}>
            {playing ? "Playing..." : "Play the change"}
          </button>
        </div>
      </header>

      {impact && changedCount > 0 && (
        <div className="impact-banner">
          <span className="impact-banner__label">
            Simulating{amendedLabels.length > 0 ? `: ${amendedLabels.join(" + ")} amended` : ": edited business facts"}
          </span>
          <span className="pill pill--hit">{impact.newlyInScopeCount} newly in scope</span>
          <span className="pill pill--relief">{impact.newlyExemptCount} newly exempt</span>
          <span className="pill">{impact.newObligationCount} new obligations</span>
          <span className="pill pill--muted">{changedCount} of {businesses.length} businesses affected</span>
        </div>
      )}

      <main className="workspace">
        <aside className="clauses">
          <p className="clauses__hint">
            Three clauses of the Ordinance are up for amendment. Flip one - the graph recomputes which businesses get hit,
            and every node opens to show the exact evidence.
          </p>
          {clauses.map((c) => (
            <ClauseCard key={c.key} clause={c} amended={scenario.amendedClauses.includes(c.key)} onToggle={toggleClause} />
          ))}
        </aside>

        <section className={`graph-wrap ${loading ? "graph-wrap--loading" : ""}`}>
          <ImpactGraph
            businesses={businesses}
            results={results}
            impacts={impactById}
            regulationCode={regulation.code}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
          <div className="legend">
            <span><i className="dot dot--in" /> in scope</span>
            <span><i className="dot dot--out" /> out of scope</span>
            <span><i className="dot dot--hit" /> newly hit</span>
            <span><i className="dot dot--relief" /> newly clear</span>
          </div>
        </section>
      </main>

      <footer className="foot">
        <p>{regulation.note} Built to show what change-impact review could feel like: every effect traceable to the exact words that caused it.</p>
      </footer>

      {selected && (
        <EvidenceDrawer
          business={selected}
          before={baselineById.get(selected.id)!}
          after={resultsById.get(selected.id)!}
          impact={impactById.get(selected.id) ?? null}
          clauses={clauses}
          overrides={scenario.factOverrides[selected.id] ?? {}}
          onOverride={(key, value) => setOverride(selected.id, key, value)}
          onClose={() => setSelectedId(null)}
        />
      )}
    </div>
  );
}
