# One Sentence Changed. Who Gets Hit?

An interactive **change-impact explorer** for a (fully fictional) regulation - the kind of
question a regulatory-change monitoring product answers every day:

> A clause gets reworded. Which businesses are now in scope? Which are exempt?
> And can you show the exact words, numbers and rule steps that caused each effect?

Flip an amendment switch and the impact graph recomputes live. Every business node opens
into an evidence drawer: the before/after sentence with a word-level diff, the full rule
trace against that business's facts, and the question a human reviewer should answer next.
Toggle a business fact (e.g. "processes personal data") and the affected set recomputes again.

**Everything here is fictional** - the regulation, the clauses and the six businesses are
invented sample data. This is a UI/workflow demo, not legal advice and not a coverage claim.

## The 60-second tour

1. Press **Play the change** - each of the three proposed amendments is applied in turn and
   the graph shows who gets hit.
2. Flip **§3(a)** yourself: the scope threshold drops *and* gains a personal-data proviso.
   Watch Fernleaf Groceries get pulled in while Quarry & Finch drops out.
3. Click any red or green node - the drawer shows the exact before/after words, the rule
   trace ("30 employees >= 20 -> MET ..."), and what a human reviewer should confirm.
4. In the drawer, toggle **Processes personal data** for a business and watch the graph recompute.

## Stack

- **Next.js 15 (App Router) + TypeScript** - server components, Node route handlers
- **Postgres** - clauses, business profiles and an `evaluation_runs` audit trail live in Postgres.
  - Zero-config: with no `DATABASE_URL` set, the app boots **PGlite** (PostgreSQL compiled to
    WebAssembly) in-process and seeds itself on first request.
  - Set `DATABASE_URL` (Vercel Postgres, Neon, ...) and the same queries run against your
    database via the `pg` driver - see `lib/db.ts`.
- **Deterministic rules engine** in `lib/engine.ts` - no LLM in the loop; every applicability
  verdict comes with an inspectable trace.

## Run it

```bash
npm install
npm run dev
# open http://localhost:3000
```

Deep-linkable scenarios for screenshots/sharing:

- `/?amended=3a` - scope amendment applied
- `/?amended=3a&open=fernleaf` - with the evidence drawer open

## Deploy

Import this repo into Vercel - it builds and runs as-is (embedded Postgres, no services to
configure). To use a persistent database instead, add any Postgres and set `DATABASE_URL`.

## API

- `GET /api/state` - regulation, clauses, businesses and the baseline evaluation
- `POST /api/evaluate` - body `{ "scenario": { "amendedClauses": ["3a"], "factOverrides": {} } }`,
  returns the evaluation plus the impact diff; each run is logged to `evaluation_runs`.

---

Built by an AI agent directed by Sarthak Patel, as a demonstration of agent-orchestrated
engineering: scoped, built and verified end-to-end from a one-paragraph brief.
