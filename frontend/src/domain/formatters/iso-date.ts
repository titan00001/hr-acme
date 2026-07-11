/** Format a Date as `YYYY-MM-DD` in local calendar time. */
export function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Default trends window: first day of the current year through today. */
export function defaultTrendsRange(now = new Date()): {
  from: string;
  to: string;
} {
  return {
    from: toIsoDate(new Date(now.getFullYear(), 0, 1)),
    to: toIsoDate(now),
  };
}
