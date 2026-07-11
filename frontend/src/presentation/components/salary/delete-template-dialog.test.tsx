import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { DeleteTemplateDialog } from './delete-template-dialog';

const deleteTemplate = vi.fn();

vi.mock('@/infrastructure/api/salary-templates-api', () => ({
  useDeleteSalaryTemplateMutation: () => [
    deleteTemplate,
    { isLoading: false, error: undefined, reset: vi.fn() },
  ],
}));

const unusedTemplate: SalaryTemplate = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  name: 'India Standard',
  version: 1,
  country: 'India',
  currency: 'INR',
  components: { basePay: 1200000 },
  isAssigned: false,
  latestVersion: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

describe('DeleteTemplateDialog', () => {
  beforeEach(() => {
    deleteTemplate.mockReset();
    deleteTemplate.mockReturnValue({
      unwrap: () => Promise.resolve(),
    });
  });

  it('requires confirmation before deleting', async () => {
    const user = userEvent.setup();
    const onSuccess = vi.fn();
    const onClose = vi.fn();

    render(
      <DeleteTemplateDialog
        open
        template={unusedTemplate}
        onClose={onClose}
        onSuccess={onSuccess}
      />,
    );

    expect(
      screen.getByRole('heading', { name: /delete template/i }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm delete/i }));

    await waitFor(() => {
      expect(deleteTemplate).toHaveBeenCalledWith(unusedTemplate.id);
    });
    expect(onSuccess).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });
});
