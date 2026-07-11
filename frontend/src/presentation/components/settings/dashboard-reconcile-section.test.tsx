import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DashboardReconcileSection } from './dashboard-reconcile-section';

const reconcile = vi.fn();

vi.mock('@/infrastructure/api/dashboard-api', () => ({
  useReconcileDashboardSnapshotsMutation: () => [
    reconcile,
    {
      isLoading: false,
      error: undefined,
      isSuccess: false,
      data: undefined,
      reset: vi.fn(),
    },
  ],
}));

describe('DashboardReconcileSection', () => {
  beforeEach(() => {
    reconcile.mockReset();
    reconcile.mockReturnValue({
      unwrap: () => Promise.resolve({ countries: 5, trends: 12 }),
    });
  });

  it('requires confirmation before calling reconcile API', async () => {
    const user = userEvent.setup();

    render(<DashboardReconcileSection />);

    await user.click(
      screen.getByRole('button', { name: /reconcile snapshots/i }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(reconcile).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: /confirm reconcile/i }),
    );

    await waitFor(() => {
      expect(reconcile).toHaveBeenCalled();
    });
  });
});
