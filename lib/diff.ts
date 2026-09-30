export type DiffOp = { type: "same" | "add" | "del"; text: string };

function tokenize(s: string): string[] {
  return s.match(/[\w€$%]+|[^\w\s]/g) ?? [];
}

/** Word-level LCS diff between two short texts. */
export function wordDiff(oldText: string, newText: string): { oldSide: DiffOp[]; newSide: DiffOp[] } {
  const a = tokenize(oldText);
  const b = tokenize(newText);
  const m = a.length;
  const n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i].toLowerCase() === b[j].toLowerCase() ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  const oldSide: DiffOp[] = [];
  const newSide: DiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i].toLowerCase() === b[j].toLowerCase()) {
      oldSide.push({ type: "same", text: a[i] });
      newSide.push({ type: "same", text: b[j] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      oldSide.push({ type: "del", text: a[i] });
      i++;
    } else {
      newSide.push({ type: "add", text: b[j] });
      j++;
    }
  }
  while (i < m) oldSide.push({ type: "del", text: a[i++] });
  while (j < n) newSide.push({ type: "add", text: b[j++] });
  return { oldSide, newSide };
}
