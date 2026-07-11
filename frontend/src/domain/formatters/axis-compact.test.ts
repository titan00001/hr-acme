import { describe, expect, it } from 'vitest';

import { formatAxisCompact } from './axis-compact';

describe('formatAxisCompact', () => {
  it('formats thousands and millions', () => {
    expect(formatAxisCompact(900)).toBe('900');
    expect(formatAxisCompact(12_500)).toBe('12.5k');
    expect(formatAxisCompact(1_200_000)).toBe('1.2M');
  });
});
