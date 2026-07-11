import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { DISPLAY_CURRENCY_ORIGINAL } from '@/domain/types/dashboard.types';
import { DisplayCurrencyFilter } from './display-currency-filter';

describe('DisplayCurrencyFilter', () => {
  it('changes query currency when a supported code is selected', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <DisplayCurrencyFilter
        value={DISPLAY_CURRENCY_ORIGINAL}
        currencies={['USD', 'INR', 'EUR']}
        onChange={onChange}
      />,
    );

    await user.selectOptions(screen.getByLabelText(/display currency/i), 'USD');

    expect(onChange).toHaveBeenCalledWith('USD');
  });
});
