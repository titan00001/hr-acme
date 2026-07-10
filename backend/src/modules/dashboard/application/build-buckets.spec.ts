import { assignBucketIndex, buildBuckets } from './build-buckets';

describe('buildBuckets', () => {
  it('builds contiguous ranges', () => {
    const buckets = buildBuckets(0, 100, 4);
    expect(buckets).toHaveLength(4);
    expect(buckets[0]?.min).toBe(0);
    expect(buckets[3]?.max).toBe(100);
  });

  it('handles equal min and max', () => {
    const buckets = buildBuckets(50, 50, 5);
    expect(buckets).toHaveLength(1);
    expect(assignBucketIndex(50, buckets)).toBe(0);
  });
});
