import React, { useState } from 'react';

import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useReconcileDashboardSnapshotsMutation } from '@/infrastructure/api/dashboard-api';
import { Dialog } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';

export function DashboardReconcileSection(): React.ReactElement {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [reconcile, { isLoading, error, isSuccess, data, reset }] =
    useReconcileDashboardSnapshotsMutation();

  async function handleConfirm(): Promise<void> {
    try {
      await reconcile().unwrap();
      setConfirmOpen(false);
    } catch {
      // Surfaced via mutation error
    }
  }

  function handleOpen(): void {
    reset();
    setConfirmOpen(true);
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-surface p-4 shadow-xs">
      <p className="text-sm text-ink-muted">
        Recompute country, trend, and distribution snapshots from committed
        salaries. Use after data repairs or if dashboard metrics look wrong.
      </p>

      {error ? (
        <p className="text-sm text-danger" role="alert">
          {formatApiErrorMessage(error, 'Reconcile failed')}
        </p>
      ) : null}
      {isSuccess && data ? (
        <p className="text-sm text-success" role="status">
          Reconciled {data.countries} countries and {data.trends} trend points.
        </p>
      ) : null}

      <Button type="button" variant="outline" onClick={handleOpen} disabled={isLoading}>
        Reconcile snapshots
      </Button>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Reconcile dashboard snapshots"
        description="This truncates and rebuilds all dashboard snapshot tables from source records. Safe for recovery; may take a moment with a large seed."
      >
        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setConfirmOpen(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={isLoading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {isLoading ? 'Reconciling…' : 'Confirm reconcile'}
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
