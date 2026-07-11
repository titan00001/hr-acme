import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { CompensationTrendsChart } from './compensation-trends-chart';

describe('CompensationTrendsChart', () => {
  it('notifies when from and to date pickers change', () => {
    const onRangeChange = vi.fn();

    render(
      <CompensationTrendsChart
        points={[]}
        from="2026-01-01"
        to="2026-06-30"
        onRangeChange={onRangeChange}
      />,
    );

    fireEvent.change(screen.getByLabelText(/^from$/i), {
      target: { value: '2026-02-01' },
    });
    expect(onRangeChange).toHaveBeenCalledWith({
      from: '2026-02-01',
      to: '2026-06-30',
    });

    fireEvent.change(screen.getByLabelText(/^to$/i), {
      target: { value: '2026-03-15' },
    });
    expect(onRangeChange).toHaveBeenCalledWith({
      from: '2026-01-01',
      to: '2026-03-15',
    });
  });
});
