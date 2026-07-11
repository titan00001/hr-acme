import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { SelectRemoveList } from './select-remove-list';

describe('SelectRemoveList', () => {
  it('adds and removes values from the list', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    const { rerender } = render(
      <SelectRemoveList
        label="Supported countries"
        values={['US']}
        options={['US', 'India', 'UK']}
        onChange={onChange}
      />,
    );

    await user.selectOptions(
      screen.getByLabelText(/supported countries/i),
      'India',
    );
    await user.click(screen.getByRole('button', { name: /^add$/i }));
    expect(onChange).toHaveBeenCalledWith(['US', 'India']);

    rerender(
      <SelectRemoveList
        label="Supported countries"
        values={['US', 'India']}
        options={['US', 'India', 'UK']}
        onChange={onChange}
      />,
    );

    await user.click(screen.getByRole('button', { name: /remove india/i }));
    expect(onChange).toHaveBeenCalledWith(['US']);
  });
});
