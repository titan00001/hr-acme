import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { RelieveModal } from './relieve-modal';

const relieveEmployee = vi.fn();

vi.mock('@/infrastructure/api/employees-api', () => ({
  useRelieveEmployeeMutation: () => [
    relieveEmployee,
    { isLoading: false, error: undefined, reset: vi.fn() },
  ],
}));

describe('RelieveModal', () => {
  beforeEach(() => {
    relieveEmployee.mockReset();
    relieveEmployee.mockReturnValue({
      unwrap: () => Promise.resolve({ id: 'emp-1', status: 'Left' }),
    });
  });

  it('requires confirmation before relieving', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <RelieveModal
        open
        employeeId="emp-1"
        employeeName="Ada Lovelace"
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    expect(
      screen.getByText(/mark ada lovelace as left/i),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /confirm relieve/i }),
    ).toBeInTheDocument();

    await user.type(screen.getByLabelText(/reason/i), 'Resigned');
    await user.click(screen.getByRole('button', { name: /confirm relieve/i }));

    await waitFor(() => {
      expect(relieveEmployee).toHaveBeenCalledWith({
        id: 'emp-1',
        body: { reason: 'Resigned' },
      });
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
