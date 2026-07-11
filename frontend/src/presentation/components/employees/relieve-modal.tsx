import React, { useState } from 'react';

import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useRelieveEmployeeMutation } from '@/infrastructure/api/employees-api';
import { Dialog } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

export type RelieveModalProps = {
  open: boolean;
  employeeId: string;
  employeeName: string;
  onClose: () => void;
  onSuccess?: () => void;
};

export function RelieveModal({
  open,
  employeeId,
  employeeName,
  onClose,
  onSuccess,
}: RelieveModalProps): React.ReactElement {
  const [reason, setReason] = useState('');
  const [relieveEmployee, { isLoading, error, reset }] =
    useRelieveEmployeeMutation();

  async function handleConfirm(): Promise<void> {
    try {
      await relieveEmployee({
        id: employeeId,
        body: reason.trim() ? { reason: reason.trim() } : {},
      }).unwrap();
      setReason('');
      reset();
      onSuccess?.();
      onClose();
    } catch {
      // Surfaced via mutation error
    }
  }

  function handleClose(): void {
    setReason('');
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      title="Relieve employee"
      description={`Mark ${employeeName} as Left. They will move to the Left employees list.`}
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-ink-muted">
          This cannot be undone from this screen. Confirm to continue.
        </p>
        <div className="flex flex-col gap-2">
          <Label htmlFor="relieve-reason">Reason (optional)</Label>
          <Input
            id="relieve-reason"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. Resigned"
          />
        </div>
        {error ? (
          <p className="text-sm text-danger" role="alert">
            {formatApiErrorMessage(error, 'Unable to relieve employee')}
          </p>
        ) : null}
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            disabled={isLoading}
            onClick={() => {
              void handleConfirm();
            }}
          >
            {isLoading ? 'Relieving…' : 'Confirm relieve'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
}
