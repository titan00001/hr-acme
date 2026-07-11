import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { DemoSettingsSection } from './demo-settings-section';

const seedDemo = vi.fn();
const clearDemo = vi.fn();

vi.mock('@/infrastructure/api/demo-api', () => ({
  useSeedDemoMutation: () => [
    seedDemo,
    { isLoading: false, error: undefined, isSuccess: false, data: undefined },
  ],
  useClearDemoMutation: () => [
    clearDemo,
    { isLoading: false, error: undefined, isSuccess: false, data: undefined },
  ],
}));

describe('DemoSettingsSection', () => {
  beforeEach(() => {
    seedDemo.mockReset();
    clearDemo.mockReset();
    seedDemo.mockReturnValue({
      unwrap: () => Promise.resolve({ inserted: 10000 }),
    });
    clearDemo.mockReturnValue({
      unwrap: () => Promise.resolve({ cleared: true }),
    });
  });

  it('requires confirmation before clearing demo data', async () => {
    const user = userEvent.setup();

    render(
      <DemoSettingsSection
        status={{ seeded: true, employeeCount: 100 }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /clear demo/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(clearDemo).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /confirm clear/i }));

    await waitFor(() => {
      expect(clearDemo).toHaveBeenCalled();
    });
  });
});
