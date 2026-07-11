import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi, beforeEach } from 'vitest';

import { OnboardModal } from './onboard-modal';

vi.mock('@/infrastructure/api/settings-api', () => ({
  useGetSettingsQuery: () => ({
    data: {
      supportedCountries: ['India', 'USA'],
    },
  }),
}));

const createEmployee = vi.fn();

vi.mock('@/infrastructure/api/employees-api', () => ({
  useCreateEmployeeMutation: () => [
    createEmployee,
    { isLoading: false, error: undefined, reset: vi.fn() },
  ],
}));

describe('OnboardModal', () => {
  beforeEach(() => {
    createEmployee.mockReset();
  });

  it('shows validation errors when submitted empty', async () => {
    const user = userEvent.setup();

    render(<OnboardModal open onClose={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /^onboard$/i }));

    expect(
      await screen.findByText(/employee id is required/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/enter a valid email/i)).toBeInTheDocument();
    expect(screen.getByText(/country is required/i)).toBeInTheDocument();
    expect(screen.getByText(/joining date is required/i)).toBeInTheDocument();
    expect(createEmployee).not.toHaveBeenCalled();
  });
});
