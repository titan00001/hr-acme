import React, { useEffect } from 'react';

import type { SalaryTemplateFormValues } from '@/domain/schemas/salary-template-form.schema';
import { toCreateTemplateRequest } from '@/domain/formatters/salary-template-request';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useCreateSalaryTemplateMutation } from '@/infrastructure/api/salary-templates-api';
import { useGetSettingsQuery } from '@/infrastructure/api/settings-api';
import { TemplateForm } from '@/presentation/components/salary/template-form';
import { Dialog } from '@/presentation/components/ui/dialog';

export type CreateTemplateDialogProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (templateId: string) => void;
};

export function CreateTemplateDialog({
  open,
  onClose,
  onSuccess,
}: CreateTemplateDialogProps): React.ReactElement {
  const { data: settings } = useGetSettingsQuery(undefined, { skip: !open });
  const [createTemplate, { isLoading, error, reset }] =
    useCreateSalaryTemplateMutation();

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  async function handleSubmit(values: SalaryTemplateFormValues): Promise<void> {
    try {
      const created = await createTemplate(
        toCreateTemplateRequest(values),
      ).unwrap();
      onSuccess?.(created.id);
      onClose();
    } catch {
      // Surfaced via mutation error
    }
  }

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Create template"
      description="Create version 1 of a new salary template family."
      className="max-w-xl"
    >
      <TemplateForm
        mode="create"
        countries={settings?.supportedCountries ?? []}
        currencies={settings?.supportedCurrencies ?? []}
        isSubmitting={isLoading}
        serverError={
          error
            ? formatApiErrorMessage(error, 'Unable to create template')
            : null
        }
        onCancel={onClose}
        onSubmit={handleSubmit}
      />
    </Dialog>
  );
}
