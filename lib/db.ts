import { CLAUSES, BUSINESSES, REGULATION } from "./seed-data";
import type { Business, Clause, Scenario } from "./types";

/**
 * Postgres access layer.
 *
 * - If DATABASE_URL is set (e.g. Vercel Postgres / Neon), queries run against
 *   that Postgres through the `pg` driver.
 * - Otherwise the app boots an embedded Postgres (PGlite - PostgreSQL compiled
 *   to WebAssembly) in-process, so the demo runs with zero external services.
 */

interface QueryResult<T> {
  rows: T[];
}

interface Adapter {
  query<T>(text: string, params?: unknown[]): Promise<QueryResult<T>>;
}

async function createAdapter(): Promise<Adapter> {
  if (process.env.DATABASE_URL) {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    return {
      query: async <T>(text: string, params?: unknown[]) => {
        const res = await pool.query(text, params as never[]);
        return { rows: res.rows as T[] };
      },
    };
  }
  const { PGlite } = await import("@electric-sql/pglite");
  const pglite = new PGlite();
  return {
    query: async <T>(text: string, params?: unknown[]) => {
      const res = await pglite.query(text, params as never[]);
      return { rows: res.rows as T[] };
    },
  };
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS clauses (
    key TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    title TEXT NOT NULL,
    current_text TEXT NOT NULL,
    amended_text TEXT NOT NULL,
    sort INT NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS businesses (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    tagline TEXT NOT NULL,
    employees INT NOT NULL,
    revenue_eur_m NUMERIC NOT NULL,
    founded_year INT NOT NULL,
    processes_personal_data BOOLEAN NOT NULL,
    cross_border_transfers BOOLEAN NOT NULL,
    uses_third_party_processors BOOLEAN NOT NULL
  )`,
  `CREATE TABLE IF NOT EXISTS evaluation_runs (
    id BIGSERIAL PRIMARY KEY,
    scenario JSONB NOT NULL,
    newly_in_scope TEXT[] NOT NULL,
    newly_exempt TEXT[] NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`,
];

declare global {
  // eslint-disable-next-line no-var
  var __clauseImpactDb: Promise<Adapter> | undefined;
}

function getAdapter(): Promise<Adapter> {
  if (!globalThis.__clauseImpactDb) {
    globalThis.__clauseImpactDb = (async () => {
      const adapter = await createAdapter();
      for (const stmt of SCHEMA_STATEMENTS) {
        await adapter.query(stmt);
      }
      for (const [i, c] of CLAUSES.entries()) {
        await adapter.query(
          `INSERT INTO clauses (key, label, title, current_text, amended_text, sort)
           VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT (key) DO NOTHING`,
          [c.key, c.label, c.title, c.current_text, c.amended_text, i]
        );
      }
      for (const b of BUSINESSES) {
        await adapter.query(
          `INSERT INTO businesses
             (id, name, tagline, employees, revenue_eur_m, founded_year,
              processes_personal_data, cross_border_transfers, uses_third_party_processors)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (id) DO NOTHING`,
          [
            b.id, b.name, b.tagline, b.employees, b.revenue_eur_m, b.founded_year,
            b.processes_personal_data, b.cross_border_transfers, b.uses_third_party_processors,
          ]
        );
      }
      return adapter;
    })();
  }
  return globalThis.__clauseImpactDb;
}

export async function getClauses(): Promise<Clause[]> {
  const db = await getAdapter();
  const { rows } = await db.query<Clause>(`SELECT key, label, title, current_text, amended_text FROM clauses ORDER BY sort`);
  return rows;
}

export async function getBusinesses(): Promise<Business[]> {
  const db = await getAdapter();
  const { rows } = await db.query<Business & { revenue_eur_m: string | number }>(
    `SELECT id, name, tagline, employees, revenue_eur_m, founded_year,
            processes_personal_data, cross_border_transfers, uses_third_party_processors
     FROM businesses ORDER BY name`
  );
  return rows.map((r) => ({ ...r, revenue_eur_m: Number(r.revenue_eur_m) }));
}

export function getRegulation() {
  return REGULATION;
}

export async function logEvaluationRun(scenario: Scenario, newlyInScope: string[], newlyExempt: string[]) {
  const db = await getAdapter();
  await db.query(
    `INSERT INTO evaluation_runs (scenario, newly_in_scope, newly_exempt) VALUES ($1, $2, $3)`,
    [JSON.stringify(scenario), newlyInScope, newlyExempt]
  );
}
