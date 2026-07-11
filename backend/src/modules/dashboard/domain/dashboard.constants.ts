export interface DistributionBucketDefinition {
  index: number;
  label: string;
  lowerBound: number;
  upperBound: number | null;
}

/** Fixed compensation buckets in base currency (Settings.baseCurrency). */
export const DISTRIBUTION_BUCKETS: readonly DistributionBucketDefinition[] = [
  { index: 0, label: '0–50k', lowerBound: 0, upperBound: 50_000 },
  { index: 1, label: '50k–100k', lowerBound: 50_000, upperBound: 100_000 },
  { index: 2, label: '100k–200k', lowerBound: 100_000, upperBound: 200_000 },
  { index: 3, label: '200k–500k', lowerBound: 200_000, upperBound: 500_000 },
  { index: 4, label: '500k+', lowerBound: 500_000, upperBound: null },
] as const;
