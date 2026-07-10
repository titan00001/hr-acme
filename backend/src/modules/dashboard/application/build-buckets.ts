export interface BucketRange {
  min: number;
  max: number;
  label: string;
}

/** Build `count` contiguous histogram ranges covering [min, max]. */
export function buildBuckets(
  min: number,
  max: number,
  count: number,
): BucketRange[] {
  if (count < 1) {
    return [];
  }

  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) {
    return [];
  }

  if (min === max) {
    const label = `${formatBucketBound(min)}–${formatBucketBound(max)}`;
    return [{ min, max, label }];
  }

  const width = (max - min) / count;
  const buckets: BucketRange[] = [];

  for (let i = 0; i < count; i += 1) {
    const bucketMin = min + width * i;
    const bucketMax = i === count - 1 ? max : min + width * (i + 1);
    buckets.push({
      min: bucketMin,
      max: bucketMax,
      label: `${formatBucketBound(bucketMin)}–${formatBucketBound(bucketMax)}`,
    });
  }

  return buckets;
}

function formatBucketBound(value: number): string {
  return Math.round(value).toLocaleString('en-US');
}

export function assignBucketIndex(
  value: number,
  buckets: BucketRange[],
): number {
  for (let i = 0; i < buckets.length; i += 1) {
    const bucket = buckets[i];
    const isLast = i === buckets.length - 1;
    if (
      value >= bucket.min &&
      (isLast ? value <= bucket.max : value < bucket.max)
    ) {
      return i;
    }
  }
  return buckets.length - 1;
}
