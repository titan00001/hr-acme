import React, { useEffect } from 'react';

import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useDeleteSalaryTemplateMutation } from '@/infrastructure/api/salary-templates-api';
import { Dialog } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';

export type DeleteTemplateDialogProps = {
  open: boolean;
  template: SalaryTemplate | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function DeleteTemplateDialog({
  open,
  template,
  onClose,
  onSuccess,
}: DeleteTemplateDialogProps): React.ReactElement {
  const [deleteTemplate, { isLoading, error, reset }] =
    useDeleteSalaryTemplateMutation();

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  async function handleConfirm(): Promise<void> {
    if (!template) {
      return;
    }
    try {
      await deleteTemplate(template.id).unwrap();
      onSuccess?.();
      onClose();
    } catch {
      // Surfaced via mutation error
    }
  }

  return (
    <Dialog
      open={open && template !== null}
      onClose={onClose}
      title="Delete template"
      description={
        template
          ? `Permanently remove ${template.name} v${template.version}. Only unused templates can be deleted.`
          : undefined
      }
    >
      {error ? (
        <p className="mb-4 text-sm text-danger" role="alert">
          {formatApiErrorMessage(error, 'Unable to delete template')}
        </p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="button"
          variant="danger"
          disabled={isLoading || !template}
          onClick={() => {
            void handleConfirm();
          }}
        >
          {isLoading ? 'Deleting…' : 'Confirm delete'}
        </Button>
      </div>
    </Dialog>
  );
}
