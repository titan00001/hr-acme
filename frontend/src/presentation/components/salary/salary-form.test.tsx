import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { SalaryForm } from './salary-form';

const sampleTemplate: SalaryTemplate = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'India Standard',
  version: 1,
  country: 'India',
  currency: 'INR',
  components: {
    basePay: 1200000,
    allowances: 50000,
    bonus: 100000,
    stock: { quantity: 10, vestingDate: '2027-01-01' },
  },
  isAssigned: false,
  latestVersion: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

vi.mock('./template-picker', () => ({
  TemplatePicker: ({
    onChange,
  }: {
    onChange: (template: SalaryTemplate | null) => void;
  }) => (
    <button type="button" onClick={() => onChange(sampleTemplate)}>
      Apply template
    </button>
  ),
}));

describe('SalaryForm', () => {
  it('lists all paymentCycle enum values', () => {
    render(
      <SalaryForm
        currencies={['USD', 'INR']}
        onSubmit={vi.fn()}
      />,
    );

    const cycle = screen.getByLabelText(/payment cycle/i);
    expect(cycle).toContainHTML('Monthly');
    expect(cycle).toContainHTML('BiWeekly');
    expect(cycle).toContainHTML('Weekly');
    expect(cycle).toContainHTML('Annual');
  });

  it('shows validation errors for missing effective date', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <SalaryForm currencies={['USD']} onSubmit={onSubmit} />,
    );

    await user.clear(screen.getByLabelText(/base salary/i));
    await user.type(screen.getByLabelText(/base salary/i), '1000');
    await user.click(screen.getByRole('button', { name: /save draft/i }));

    expect(
      await screen.findByText(/effective date is required/i),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('pre-fills fields from a selected template', async () => {
    const user = userEvent.setup();

    render(
      <SalaryForm currencies={['USD', 'INR']} onSubmit={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /apply template/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/base salary/i)).toHaveValue(1200000);
    });
    expect(screen.getByLabelText(/currency/i)).toHaveValue('INR');
    expect(screen.getByLabelText(/allowances/i)).toHaveValue(50000);
    expect(screen.getByLabelText(/bonus/i)).toHaveValue(100000);
    expect(screen.getByLabelText(/stock quantity/i)).toHaveValue(10);
  });
});
