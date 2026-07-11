/** Compact number labels for chart axes (e.g. 1.2M, 50k, 900). */
export function formatAxisCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) {
    return `${trimTrailingZero(value / 1_000_000)}M`;
  }
  if (abs >= 1_000) {
    return `${trimTrailingZero(value / 1_000)}k`;
  }
  return String(Math.round(value));
}

function trimTrailingZero(n: number): string {
  const rounded = Math.round(n * 10) / 10;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
}
