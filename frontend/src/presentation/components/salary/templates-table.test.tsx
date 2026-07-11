import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { TemplatesTable } from './templates-table';

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

const assignedTemplate: SalaryTemplate = {
  ...unusedTemplate,
  id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  isAssigned: true,
};

describe('TemplatesTable', () => {
  it('disables edit and delete when template is assigned', () => {
    const onEdit = vi.fn();
    const onDelete = vi.fn();
    const onCreateVersion = vi.fn();

    render(
      <TemplatesTable
        rows={[assignedTemplate]}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateVersion={onCreateVersion}
      />,
    );

    expect(screen.queryByRole('button', { name: /^edit$/i })).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /^delete$/i }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create version/i }),
    ).toBeInTheDocument();
  });

  it('shows edit and delete for unused templates', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    const onDelete = vi.fn();

    render(
      <TemplatesTable
        rows={[unusedTemplate]}
        onEdit={onEdit}
        onDelete={onDelete}
        onCreateVersion={vi.fn()}
      />,
    );

    await user.click(screen.getByRole('button', { name: /^edit$/i }));
    expect(onEdit).toHaveBeenCalledWith(unusedTemplate);

    await user.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onDelete).toHaveBeenCalledWith(unusedTemplate);
  });
});
