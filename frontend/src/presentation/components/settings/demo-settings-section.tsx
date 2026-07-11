import React, { useState } from 'react';

import type { DemoStatus } from '@/domain/types/settings.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import {
  useClearDemoMutation,
  useSeedDemoMutation,
} from '@/infrastructure/api/demo-api';
import { Dialog } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';

export type DemoSettingsSectionProps = {
  status: DemoStatus | undefined;
  isLoading?: boolean;
};

type ConfirmAction = 'seed' | 'clear' | null;

export function DemoSettingsSection({
  status,
  isLoading = false,
}: DemoSettingsSectionProps): React.ReactElement {
  const [confirmAction, setConfirmAction] = useState<ConfirmAction>(null);
  const [seedDemo, seedState] = useSeedDemoMutation();
  const [clearDemo, clearState] = useClearDemoMutation();

  const actionError = seedState.error ?? clearState.error;
  const isBusy = seedState.isLoading || clearState.isLoading;

  async function handleConfirm(): Promise<void> {
    if (!confirmAction) {
      return;
    }

    try {
      if (confirmAction === 'seed') {
        await seedDemo().unwrap();
      } else {
        await clearDemo().unwrap();
      }
      setConfirmAction(null);
    } catch {
      // Surfaced via mutation error
    }
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
      {isLoading || !status ? (
        <p className="text-sm text-ink-muted" role="status">
          Loading demo status…
        </p>
      ) : (
        <p className="text-sm text-ink-muted">
          Status:{' '}
          <span className="font-medium text-ink">
            {status.seeded ? 'Seeded' : 'Empty'}
          </span>
          {' · '}
          <span className="font-mono text-ink">{status.employeeCount}</span>{' '}
          employees
        </p>
      )}

      <p className="text-sm text-ink-muted">
        Seed creates ~10k demo employees when the directory is empty. Clear
        removes employees, salaries, and drafts but keeps settings.
      </p>

      {actionError ? (
        <p className="text-sm text-danger" role="alert">
          {formatApiErrorMessage(actionError, 'Demo action failed')}
        </p>
      ) : null}
      {seedState.isSuccess ? (
        <p className="text-sm text-success" role="status">
          Inserted {seedState.data.inserted} employees.
        </p>
      ) : null}
      {clearState.isSuccess ? (
        <p className="text-sm text-success" role="status">
          Demo data cleared.
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={isBusy || status?.seeded === true}
          onClick={() => setConfirmAction('seed')}
        >
          Seed demo
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isBusy || (status?.employeeCount ?? 0) === 0}
          onClick={() => setConfirmAction('clear')}
        >
          Clear demo
        </Button>
      </div>

      <Dialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        title={confirmAction === 'clear' ? 'Clear demo data' : 'Seed demo data'}
        description={
          confirmAction === 'clear'
            ? 'This deletes employees, salary history, and drafts. Settings are preserved.'
            : 'This inserts a large demo dataset. Only allowed when no employees exist.'
        }
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmAction(null)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant={confirmAction === 'clear' ? 'danger' : 'default'}
            disabled={isBusy}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {confirmAction === 'clear' ? 'Confirm clear' : 'Confirm seed'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
