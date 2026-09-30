"use client";

import type { Business, BusinessEval, BusinessImpact } from "@/lib/types";

const POSITIONS: Record<string, { x: number; y: number }> = {
  northwind: { x: 150, y: 104 },
  fernleaf: { x: 460, y: 66 },
  cobalt: { x: 770, y: 104 },
  halloway: { x: 150, y: 456 },
  pinewood: { x: 460, y: 498 },
  quarry: { x: 770, y: 456 },
};

const CENTER = { x: 460, y: 280 };

type NodeState = "hit" | "relief" | "in" | "out";

function nodeState(ev: BusinessEval, imp: BusinessImpact | undefined): NodeState {
  if (imp?.newlyInScope || (imp && imp.newObligations.length > 0)) return "hit";
  if (imp?.newlyExempt || (imp && imp.removedObligations.length > 0)) return "relief";
  return ev.inScope ? "in" : "out";
}

const STATE_LABEL: Record<NodeState, string> = {
  hit: "NEWLY HIT",
  relief: "NEWLY CLEAR",
  in: "IN SCOPE",
  out: "OUT OF SCOPE",
};

export default function ImpactGraph({
  businesses,
  results,
  impacts,
  regulationCode,
  selectedId,
  onSelect,
}: {
  businesses: Business[];
  results: BusinessEval[];
  impacts: Map<string, BusinessImpact>;
  regulationCode: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const evalById = new Map(results.map((r) => [r.businessId, r]));
  return (
    <svg className="graph" viewBox="0 0 920 560" role="img" aria-label="Impact graph">
      <defs>
        <radialGradient id="hub" cx="50%" cy="42%" r="65%">
          <stop offset="0%" stopColor="#1d2a44" />
          <stop offset="100%" stopColor="#101828" />
        </radialGradient>
      </defs>

      {businesses.map((b) => {
        const p = POSITIONS[b.id] ?? CENTER;
        const imp = impacts.get(b.id);
        const changed = !!imp?.changed;
        const st = nodeState(evalById.get(b.id)!, imp);
        return (
          <line
            key={`edge-${b.id}`}
            x1={CENTER.x}
            y1={CENTER.y}
            x2={p.x}
            y2={p.y}
            className={`edge ${changed ? `edge--changed edge--${st}` : ""}`}
          />
        );
      })}

      <g className="hub" transform={`translate(${CENTER.x}, ${CENTER.y})`}>
        <circle r="52" fill="url(#hub)" stroke="#31415f" strokeWidth="1.5" />
        <text textAnchor="middle" dy="-2" className="hub__code">
          {regulationCode}
        </text>
        <text textAnchor="middle" dy="16" className="hub__sub">
          regulation
        </text>
      </g>

      {businesses.map((b) => {
        const p = POSITIONS[b.id] ?? CENTER;
        const ev = evalById.get(b.id)!;
        const imp = impacts.get(b.id);
        const st = nodeState(ev, imp);
        const sel = selectedId === b.id;
        return (
          <g
            key={b.id}
            className={`node node--${st} ${sel ? "node--selected" : ""} ${imp?.changed ? "node--changed" : ""}`}
            transform={`translate(${p.x}, ${p.y})`}
            onClick={() => onSelect(b.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && onSelect(b.id)}
          >
            {imp?.changed && <circle r="46" className="node__pulse" />}
            <circle r="36" className="node__disc" />
            <text textAnchor="middle" dy="5" className="node__initial">
              {b.name.slice(0, 1)}
            </text>
            <text textAnchor="middle" y="56" className="node__name">
              {b.name}
            </text>
            <text textAnchor="middle" y="72" className={`node__state node__state--${st}`}>
              {STATE_LABEL[st]}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
