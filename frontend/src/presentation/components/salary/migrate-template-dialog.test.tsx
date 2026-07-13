import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { MigrateTemplateDialog } from './migrate-template-dialog';

const migrate = vi.fn();

vi.mock('@/infrastructure/api/salary-api', () => ({
  useGetMigrationCandidatesQuery: () => ({
    data: {
      data: [
        {
          id: 'emp-1',
          employeeId: 'E001',
          name: 'Ada Lovelace',
          email: 'ada@example.com',
          country: 'India',
          currentTemplateId: 'tpl-v1',
          currentTemplateVersion: 1,
          currentSalary: {
            totalCompensation: '1030000.00',
            currency: 'INR',
          },
        },
      ],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    },
    isLoading: false,
    isError: false,
    error: undefined,
  }),
  useMigrateFromTemplateMutation: () => [
    migrate,
    { isLoading: false, error: undefined, reset: vi.fn() },
  ],
}));

const template: SalaryTemplate = {
  id: 'tpl-v2',
  name: 'India Standard',
  version: 2,
  country: 'India',
  currency: 'INR',
  components: { basePay: 1_400_000, allowances: 60_000, bonus: 120_000 },
  isAssigned: false,
  latestVersion: 2,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('MigrateTemplateDialog', () => {
  beforeEach(() => {
    migrate.mockReset();
    migrate.mockReturnValue({
      unwrap: () => Promise.resolve({ draftsCreated: 1, drafts: [] }),
    });
  });

  it('migrates selected employees with preserveFields and effective date', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <MigrateTemplateDialog
        open
        template={template}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /migrate employees/i }),
    ).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();

    await user.click(screen.getByLabelText(/select ada lovelace/i));
    await user.type(screen.getByLabelText(/effective date/i), '2026-07-01');
    await user.click(screen.getByRole('button', { name: /create drafts \(1\)/i }));

    await waitFor(() => {
      expect(migrate).toHaveBeenCalledWith({
        templateId: 'tpl-v2',
        body: {
          employeeIds: ['emp-1'],
          preserveFields: ['baseSalary'],
          effectiveDate: '2026-07-01',
          reason: undefined,
        },
      });
    });
    expect(onSuccess).toHaveBeenCalledWith(1);
    expect(onClose).toHaveBeenCalled();
  });

  it('disables submit until an employee and date are chosen', () => {
    render(
      <MigrateTemplateDialog open template={template} onClose={vi.fn()} />,
    );

    expect(
      screen.getByRole('button', { name: /create drafts \(0\)/i }),
    ).toBeDisabled();
  });
});
