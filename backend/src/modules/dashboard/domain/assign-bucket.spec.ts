import { assignBucketIndex } from './assign-bucket';

describe('assignBucketIndex', () => {
  it('maps amounts into fixed base-currency buckets', () => {
    expect(assignBucketIndex(0)).toBe(0);
    expect(assignBucketIndex(49_999)).toBe(0);
    expect(assignBucketIndex(50_000)).toBe(1);
    expect(assignBucketIndex(99_999)).toBe(1);
    expect(assignBucketIndex(100_000)).toBe(2);
    expect(assignBucketIndex(199_999)).toBe(2);
    expect(assignBucketIndex(200_000)).toBe(3);
    expect(assignBucketIndex(499_999)).toBe(3);
    expect(assignBucketIndex(500_000)).toBe(4);
    expect(assignBucketIndex(1_000_000)).toBe(4);
  });

  it('treats non-finite and negative amounts as bucket 0', () => {
    expect(assignBucketIndex(-1)).toBe(0);
    expect(assignBucketIndex(Number.NaN)).toBe(0);
  });
});
