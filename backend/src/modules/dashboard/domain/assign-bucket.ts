import { DISTRIBUTION_BUCKETS } from './dashboard.constants';

/**
 * Map a base-currency compensation amount to its fixed bucket index.
 * Ranges are [lower, upper) except the last bucket which is [lower, ∞).
 */
export function assignBucketIndex(amountInBaseCurrency: number): number {
  if (!Number.isFinite(amountInBaseCurrency) || amountInBaseCurrency < 0) {
    return 0;
  }

  for (const bucket of DISTRIBUTION_BUCKETS) {
    if (bucket.upperBound === null) {
      return bucket.index;
    }
    if (amountInBaseCurrency < bucket.upperBound) {
      return bucket.index;
    }
  }

  return DISTRIBUTION_BUCKETS[DISTRIBUTION_BUCKETS.length - 1].index;
}
