"use client";

import type { Clause } from "@/lib/types";
import { wordDiff } from "@/lib/diff";

function DiffSentence({ oldText, newText, side }: { oldText: string; newText: string; side: "old" | "new" }) {
  const { oldSide, newSide } = wordDiff(oldText, newText);
  const ops = side === "old" ? oldSide : newSide;
  return (
    <p className="diff-sentence">
      {ops.map((op, i) => (
        <span key={i} className={op.type === "del" ? "diff-del" : op.type === "add" ? "diff-add" : undefined}>
          {op.text}
          {" "}
        </span>
      ))}
    </p>
  );
}

export default function ClauseCard({
  clause,
  amended,
  onToggle,
}: {
  clause: Clause;
  amended: boolean;
  onToggle: (key: Clause["key"]) => void;
}) {
  return (
    <section className={`clause-card ${amended ? "clause-card--amended" : ""}`}>
      <header className="clause-card__head">
        <span className="clause-chip">{clause.label}</span>
        <h3>{clause.title}</h3>
        <label className="switch" title="Apply proposed amendment">
          <input type="checkbox" checked={amended} onChange={() => onToggle(clause.key)} />
          <span className="switch__track" />
        </label>
      </header>
      <div className="clause-card__body">
        <div className="clause-row">
          <span className="clause-tag clause-tag--now">in force</span>
          <DiffSentence oldText={clause.current_text} newText={clause.amended_text} side="old" />
        </div>
        <div className={`clause-row clause-row--proposed ${amended ? "clause-row--active" : ""}`}>
          <span className="clause-tag clause-tag--prop">proposed</span>
          <DiffSentence oldText={clause.current_text} newText={clause.amended_text} side="new" />
        </div>
      </div>
      <footer className="clause-card__foot">{amended ? "Amendment applied to the simulation" : "Flip the switch to apply the proposed wording"}</footer>
    </section>
  );
}
