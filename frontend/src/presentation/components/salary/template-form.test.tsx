import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { TemplateForm } from './template-form';

describe('TemplateForm', () => {
  it('shows validation errors when required fields are empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TemplateForm
        mode="create"
        countries={['India']}
        currencies={['INR']}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole('button', { name: /create template/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/country is required/i)).toBeInTheDocument();
    expect(screen.getByText(/currency is required/i)).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('submits create payload when valid', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <TemplateForm
        mode="create"
        countries={['India', 'US']}
        currencies={['INR', 'USD']}
        onSubmit={onSubmit}
      />,
    );

    await user.type(screen.getByLabelText(/^name$/i), 'India Standard');
    await user.selectOptions(screen.getByLabelText(/^country$/i), 'India');
    await user.selectOptions(screen.getByLabelText(/^currency$/i), 'INR');
    await user.clear(screen.getByLabelText(/base pay/i));
    await user.type(screen.getByLabelText(/base pay/i), '1200000');
    await user.click(screen.getByRole('button', { name: /create template/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });

    const values = onSubmit.mock.calls[0]?.[0] as {
      name: string;
      country: string;
      currency: string;
      basePay: number;
    };
    expect(values.name).toBe('India Standard');
    expect(values.country).toBe('India');
    expect(values.currency).toBe('INR');
    expect(values.basePay).toBe(1200000);
  });

  it('locks name field in version mode', () => {
    render(
      <TemplateForm
        mode="version"
        countries={['India']}
        currencies={['INR']}
        defaultValues={{
          name: 'India Standard',
          country: 'India',
          currency: 'INR',
          basePay: 100,
        }}
        onSubmit={vi.fn()}
      />,
    );

    expect(screen.getByLabelText(/^name$/i)).toBeDisabled();
    expect(
      screen.getByRole('button', { name: /create version/i }),
    ).toBeInTheDocument();
  });
});
