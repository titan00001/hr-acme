import React, { useEffect, useMemo, useState } from 'react';

import {
  MIGRATION_BATCH_MAX,
  PRESERVE_SALARY_FIELDS,
  type PreserveSalaryField,
  type SalaryTemplate,
} from '@/domain/types/salary-template.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import {
  useGetMigrationCandidatesQuery,
  useMigrateFromTemplateMutation,
} from '@/infrastructure/api/salary-api';
import { ErrorHandler } from '@/presentation/components/feedback/error-handler';
import { Button } from '@/presentation/components/ui/button';
import { Dialog } from '@/presentation/components/ui/dialog';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

const PRESERVE_FIELD_LABELS: Record<PreserveSalaryField, string> = {
  baseSalary: 'Base salary',
  currency: 'Currency',
  paymentCycle: 'Payment cycle',
  allowances: 'Allowances',
  bonus: 'Bonus',
  stock: 'Stock',
};

export type MigrateTemplateDialogProps = {
  open: boolean;
  template: SalaryTemplate | null;
  onClose: () => void;
  onSuccess?: (draftsCreated: number) => void;
};

export function MigrateTemplateDialog({
  open,
  template,
  onClose,
  onSuccess,
}: MigrateTemplateDialogProps): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [preserveFields, setPreserveFields] = useState<Set<PreserveSalaryField>>(
    new Set(['baseSalary']),
  );
  const [effectiveDate, setEffectiveDate] = useState('');
  const [reason, setReason] = useState('');

  const {
    data: candidates,
    isLoading: candidatesLoading,
    isError: candidatesError,
    error: candidatesLoadError,
  } = useGetMigrationCandidatesQuery(
    { templateId: template?.id ?? '', limit: MIGRATION_BATCH_MAX },
    { skip: !open || !template },
  );

  const [migrate, { isLoading, error, reset }] =
    useMigrateFromTemplateMutation();

  useEffect(() => {
    if (!open) {
      reset();
      setSelectedIds(new Set());
      setPreserveFields(new Set(['baseSalary']));
      setEffectiveDate('');
      setReason('');
    }
  }, [open, reset]);

  const rows = useMemo(() => candidates?.data ?? [], [candidates?.data]);

  const allSelected =
    rows.length > 0 && rows.every((row) => selectedIds.has(row.id));

  function toggleEmployee(id: string): void {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleAll(): void {
    if (allSelected) {
      setSelectedIds(new Set());
      return;
    }
    setSelectedIds(new Set(rows.map((row) => row.id)));
  }

  function togglePreserve(field: PreserveSalaryField): void {
    setPreserveFields((prev) => {
      const next = new Set(prev);
      if (next.has(field)) {
        next.delete(field);
      } else {
        next.add(field);
      }
      return next;
    });
  }

  async function handleSubmit(): Promise<void> {
    if (!template || selectedIds.size === 0 || !effectiveDate) {
      return;
    }
    try {
      const result = await migrate({
        templateId: template.id,
        body: {
          employeeIds: [...selectedIds],
          preserveFields: [...preserveFields],
          effectiveDate,
          reason: reason.trim() || undefined,
        },
      }).unwrap();
      onSuccess?.(result.draftsCreated);
      onClose();
    } catch {
      // Surfaced via mutation error
    }
  }

  const canSubmit =
    selectedIds.size > 0 && Boolean(effectiveDate) && !isLoading;

  return (
    <Dialog
      open={open && template !== null}
      onClose={onClose}
      title="Migrate employees"
      description={
        template
          ? `Move up to ${MIGRATION_BATCH_MAX} selected employees onto ${template.name} v${template.version}. Creates salary drafts — commit them on the Drafts page.`
          : undefined
      }
      className="max-w-2xl"
    >
      {candidatesLoading ? (
        <p className="text-sm text-ink-muted" role="status">
          Loading eligible employees…
        </p>
      ) : null}

      {candidatesError ? (
        <ErrorHandler
          error={candidatesLoadError}
          defaultMessage="Unable to load migration candidates"
        />
      ) : null}

      {!candidatesLoading && !candidatesError && rows.length === 0 ? (
        <p className="text-sm text-ink-muted">
          No Active employees are on other versions of this template family.
        </p>
      ) : null}

      {rows.length > 0 ? (
        <div className="space-y-4">
          <div className="max-h-56 overflow-y-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-surface-muted">
                <tr>
                  <th className="px-3 py-2">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={toggleAll}
                      aria-label="Select all employees"
                    />
                  </th>
                  <th className="px-3 py-2 font-medium text-ink">Employee</th>
                  <th className="px-3 py-2 font-medium text-ink">On version</th>
                  <th className="px-3 py-2 font-medium text-ink">Compensation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => {
                          toggleEmployee(row.id);
                        }}
                        aria-label={`Select ${row.name}`}
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-ink">{row.name}</div>
                      <div className="text-ink-muted">{row.employeeId}</div>
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      v{row.currentTemplateVersion}
                    </td>
                    <td className="px-3 py-2 text-ink-muted">
                      {row.currentSalary
                        ? `${row.currentSalary.totalCompensation} ${row.currentSalary.currency}`
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-medium text-ink">
              Preserve existing values
            </legend>
            <p className="text-xs text-ink-muted">
              Checked fields keep the employee&apos;s current values; unchecked
              fields take values from this template.
            </p>
            <div className="flex flex-wrap gap-3">
              {PRESERVE_SALARY_FIELDS.map((field) => (
                <label
                  key={field}
                  className="flex items-center gap-2 text-sm text-ink"
                >
                  <input
                    type="checkbox"
                    checked={preserveFields.has(field)}
                    onChange={() => {
                      togglePreserve(field);
                    }}
                  />
                  {PRESERVE_FIELD_LABELS[field]}
                </label>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="migrate-effective-date">Effective date</Label>
              <Input
                id="migrate-effective-date"
                type="date"
                value={effectiveDate}
                onChange={(event) => {
                  setEffectiveDate(event.target.value);
                }}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="migrate-reason">Reason (optional)</Label>
              <Input
                id="migrate-reason"
                value={reason}
                onChange={(event) => {
                  setReason(event.target.value);
                }}
                placeholder={`Migrate to ${template?.name ?? 'template'} v${template?.version ?? ''}`}
              />
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {formatApiErrorMessage(error, 'Unable to migrate employees')}
        </p>
      ) : null}

      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          disabled={!canSubmit || rows.length === 0}
          onClick={() => {
            void handleSubmit();
          }}
        >
          {isLoading
            ? 'Creating drafts…'
            : `Create drafts (${selectedIds.size})`}
        </Button>
      </div>
    </Dialog>
  );
}
