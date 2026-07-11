import React, { useEffect, useMemo } from 'react';

import type { SalaryTemplateFormValues } from '@/domain/schemas/salary-template-form.schema';
import {
  templateToFormValues,
  toCreateTemplateVersionRequest,
} from '@/domain/formatters/salary-template-request';
import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useCreateSalaryTemplateVersionMutation } from '@/infrastructure/api/salary-templates-api';
import { useGetSettingsQuery } from '@/infrastructure/api/settings-api';
import { TemplateForm } from '@/presentation/components/salary/template-form';
import { Dialog } from '@/presentation/components/ui/dialog';

export type CreateTemplateVersionDialogProps = {
  open: boolean;
  template: SalaryTemplate | null;
  onClose: () => void;
  onSuccess?: (templateId: string) => void;
};

export function CreateTemplateVersionDialog({
  open,
  template,
  onClose,
  onSuccess,
}: CreateTemplateVersionDialogProps): React.ReactElement {
  const { data: settings } = useGetSettingsQuery(undefined, { skip: !open });
  const [createVersion, { isLoading, error, reset }] =
    useCreateSalaryTemplateVersionMutation();

  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);

  const defaultValues = useMemo(
    () => (template ? templateToFormValues(template) : undefined),
    [template],
  );

  async function handleSubmit(values: SalaryTemplateFormValues): Promise<void> {
    if (!template) {
      return;
    }
    try {
      const created = await createVersion({
        id: template.id,
        body: toCreateTemplateVersionRequest(values),
      }).unwrap();
      onSuccess?.(created.id);
      onClose();
    } catch {
      // Surfaced via mutation error
    }
  }

  return (
    <Dialog
      open={open && template !== null}
      onClose={onClose}
      title="Create version"
      description={
        template
          ? `Create the next version of ${template.name} (currently latest v${template.latestVersion}).`
          : undefined
      }
      className="max-w-xl"
    >
      {template ? (
        <TemplateForm
          key={`version-${template.id}`}
          mode="version"
          countries={settings?.supportedCountries ?? []}
          currencies={settings?.supportedCurrencies ?? []}
          defaultValues={defaultValues}
          isSubmitting={isLoading}
          serverError={
            error
              ? formatApiErrorMessage(error, 'Unable to create version')
              : null
          }
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Dialog>
  );
}
