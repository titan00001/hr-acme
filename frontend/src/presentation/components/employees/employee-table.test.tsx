import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Employee } from '@/domain/types/employee.types';
import { EmployeeTable } from './employee-table';

const sampleEmployees: Employee[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    employeeId: 'E001',
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    country: 'India',
    employmentType: 'Permanent',
    status: 'Active',
    joiningDate: '2026-01-15',
    currentSalaryId: '22222222-2222-2222-2222-222222222222',
    currentSalary: {
      totalCompensation: '1250000.00',
      currency: 'INR',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    employeeId: 'E002',
    name: 'Grace Hopper',
    email: 'grace@example.com',
    country: 'USA',
    employmentType: 'Contract',
    status: 'Active',
    joiningDate: '2025-06-01',
    currentSalaryId: null,
    currentSalary: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
];

describe('EmployeeTable', () => {
  it('renders employee rows with original-currency salary', () => {
    render(<EmployeeTable rows={sampleEmployees} />);

    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText(/E001/)).toBeInTheDocument();
    expect(screen.getByText('Grace Hopper')).toBeInTheDocument();
    expect(screen.getByText('—')).toBeInTheDocument();
    expect(screen.getByText(/₹|INR|1,250,000|12,50,000/)).toBeInTheDocument();
  });

  it('shows empty state when there are no rows', () => {
    render(<EmployeeTable rows={[]} />);

    expect(
      screen.getByText(/no employees match your filters/i),
    ).toBeInTheDocument();
  });

  it('invokes onRowClick when a row is clicked', () => {
    const onRowClick = vi.fn();
    render(<EmployeeTable rows={sampleEmployees} onRowClick={onRowClick} />);

    screen.getByText('Ada Lovelace').click();

    expect(onRowClick).toHaveBeenCalledWith(sampleEmployees[0]);
  });
});
