import { describe, expect, it } from 'vitest';

import { theme } from './tokens';

describe('theme tokens', () => {
  it('exposes the Harbor Ink palette keys', () => {
    expect(theme.colors.brand).toBe('var(--color-brand)');
    expect(theme.chart.brand).toBe('#0d7377');
    expect(theme.fonts.display).toBe('var(--font-display)');
    expect(theme.shadow.md).toBe('var(--shadow-md)');
    expect(theme.motion.durationBase).toBe('var(--duration-base)');
  });
});
