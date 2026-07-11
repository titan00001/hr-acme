import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SalaryDraft } from '@/domain/types/salary.types';
import { DraftsTable } from './drafts-table';

const commitDraft = vi.fn();
const rollbackDraft = vi.fn();

vi.mock('@/infrastructure/api/salary-drafts-api', () => ({
  useCommitSalaryDraftMutation: () => [
    commitDraft,
    { isLoading: false, error: undefined },
  ],
  useRollbackSalaryDraftMutation: () => [
    rollbackDraft,
    { isLoading: false, error: undefined, unwrap: undefined },
  ],
}));

const sampleDraft: SalaryDraft = {
  id: 'draft-1',
  employeeId: '11111111-1111-1111-1111-111111111111',
  templateId: null,
  effectiveDate: '2026-04-01',
  baseSalary: '1000000.00',
  currency: 'INR',
  paymentCycle: 'Monthly',
  components: { allowances: 50000, bonus: 0 },
  stockPriceAtEntry: null,
  stockPriceCurrencyAtEntry: null,
  stockValueInStockCurrency: null,
  stockValueInSalaryCurrency: null,
  fxRateUsed: null,
  reason: 'Annual revision',
  createdBy: 'admin',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DraftsTable', () => {
  beforeEach(() => {
    commitDraft.mockReset();
    rollbackDraft.mockReset();
    commitDraft.mockReturnValue({ unwrap: () => Promise.resolve({}) });
    rollbackDraft.mockReturnValue({
      unwrap: () => Promise.resolve(undefined),
    });
  });

  it('calls commit API when Commit is clicked', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DraftsTable rows={[sampleDraft]} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /^commit$/i }));

    expect(commitDraft).toHaveBeenCalledWith('draft-1');
  });

  it('confirms before rollback and then calls API', async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <DraftsTable rows={[sampleDraft]} />
      </MemoryRouter>,
    );

    await user.click(screen.getByRole('button', { name: /^rollback$/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(rollbackDraft).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /confirm rollback/i }),
    );

    await waitFor(() => {
      expect(rollbackDraft).toHaveBeenCalledWith('draft-1');
    });
  });
});
