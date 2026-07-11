import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { CreateTemplateVersionDialog } from './create-template-version-dialog';

const createVersion = vi.fn();

vi.mock('@/infrastructure/api/salary-templates-api', () => ({
  useCreateSalaryTemplateVersionMutation: () => [
    createVersion,
    { isLoading: false, error: undefined, reset: vi.fn() },
  ],
}));

vi.mock('@/infrastructure/api/settings-api', () => ({
  useGetSettingsQuery: () => ({
    data: {
      supportedCountries: ['India'],
      supportedCurrencies: ['INR'],
    },
  }),
}));

const sourceTemplate: SalaryTemplate = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'India Standard',
  version: 1,
  country: 'India',
  currency: 'INR',
  components: { basePay: 1200000, allowances: 50000 },
  isAssigned: true,
  latestVersion: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('CreateTemplateVersionDialog', () => {
  beforeEach(() => {
    createVersion.mockReset();
    createVersion.mockReturnValue({
      unwrap: () =>
        Promise.resolve({
          ...sourceTemplate,
          id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
          version: 2,
          isAssigned: false,
          latestVersion: 2,
        }),
    });
  });

  it('creates a new version from the source template', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();

    render(
      <CreateTemplateVersionDialog
        open
        template={sourceTemplate}
        onClose={vi.fn()}
        onSuccess={onSuccess}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /create version/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/^name$/i)).toBeDisabled();
    expect(screen.getByLabelText(/^name$/i)).toHaveValue('India Standard');

    await user.clear(screen.getByLabelText(/base pay/i));
    await user.type(screen.getByLabelText(/base pay/i), '1500000');
    await user.click(screen.getByRole('button', { name: /create version/i }));

    await waitFor(() => {
      expect(createVersion).toHaveBeenCalled();
    });

    const arg = createVersion.mock.calls[0]?.[0] as {
      id: string;
      body: { country: string; currency: string; components: { basePay: number } };
    };
    expect(arg.id).toBe(sourceTemplate.id);
    expect(arg.body.country).toBe('India');
    expect(arg.body.currency).toBe('INR');
    expect(arg.body.components.basePay).toBe(1500000);
    expect(onSuccess).toHaveBeenCalledWith(
      'cccccccc-cccc-cccc-cccc-cccccccccccc',
    );
  });
});
