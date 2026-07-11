import React, { useEffect, useMemo } from 'react';

import type { SalaryTemplateFormValues } from '@/domain/schemas/salary-template-form.schema';
import {
  templateToFormValues,
  toUpdateTemplateRequest,
} from '@/domain/formatters/salary-template-request';
import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useUpdateSalaryTemplateMutation } from '@/infrastructure/api/salary-templates-api';
import { useGetSettingsQuery } from '@/infrastructure/api/settings-api';
import { TemplateForm } from '@/presentation/components/salary/template-form';
import { Dialog } from '@/presentation/components/ui/dialog';

export type EditTemplateDialogProps = {
  open: boolean;
  template: SalaryTemplate | null;
  onClose: () => void;
  onSuccess?: () => void;
};

export function EditTemplateDialog({
  open,
  template,
  onClose,
  onSuccess,
}: EditTemplateDialogProps): React.ReactElement {
  const { data: settings } = useGetSettingsQuery(undefined, { skip: !open });
  const [updateTemplate, { isLoading, error, reset }] =
    useUpdateSalaryTemplateMutation();

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
      await updateTemplate({
        id: template.id,
        body: toUpdateTemplateRequest(values),
      }).unwrap();
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
      title="Edit template"
      description={
        template
          ? `Update ${template.name} v${template.version}. Only unused templates can be edited.`
          : undefined
      }
      className="max-w-xl"
    >
      {template ? (
        <TemplateForm
          key={template.id}
          mode="edit"
          countries={settings?.supportedCountries ?? []}
          currencies={settings?.supportedCurrencies ?? []}
          defaultValues={defaultValues}
          isSubmitting={isLoading}
          serverError={
            error
              ? formatApiErrorMessage(error, 'Unable to update template')
              : null
          }
          onCancel={onClose}
          onSubmit={handleSubmit}
        />
      ) : null}
    </Dialog>
  );
}
