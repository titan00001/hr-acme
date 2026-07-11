/** Split a comma/newline-separated list into trimmed unique tokens. */
export function parseCsvList(raw: string): string[] {
  const seen = new Set<string>();
  const values: string[] = [];

  for (const part of raw.split(/[\n,]+/)) {
    const trimmed = part.trim();
    if (!trimmed || seen.has(trimmed)) {
      continue;
    }
    seen.add(trimmed);
    values.push(trimmed);
  }

  return values;
}

export function formatCsvList(values: string[]): string {
  return values.join(', ');
}
