import type { SalaryTemplateFormValues } from '@/domain/schemas/salary-template-form.schema';
import type {
  CreateTemplateRequest,
  CreateTemplateVersionRequest,
  TemplateComponents,
  UpdateTemplateRequest,
} from '@/domain/types/salary-template.types';

export function toTemplateComponents(
  values: SalaryTemplateFormValues,
): TemplateComponents {
  return {
    basePay: values.basePay,
    ...(values.allowances !== undefined ? { allowances: values.allowances } : {}),
    ...(values.bonus !== undefined ? { bonus: values.bonus } : {}),
    ...(values.stockQuantity !== undefined
      ? {
          stock: {
            quantity: values.stockQuantity,
            ...(values.stockVestingDate
              ? { vestingDate: values.stockVestingDate }
              : {}),
          },
        }
      : {}),
  };
}

export function toCreateTemplateRequest(
  values: SalaryTemplateFormValues,
): CreateTemplateRequest {
  return {
    name: values.name.trim(),
    country: values.country,
    currency: values.currency,
    components: toTemplateComponents(values),
  };
}

export function toUpdateTemplateRequest(
  values: SalaryTemplateFormValues,
): UpdateTemplateRequest {
  return {
    country: values.country,
    currency: values.currency,
    components: toTemplateComponents(values),
  };
}

export function toCreateTemplateVersionRequest(
  values: SalaryTemplateFormValues,
): CreateTemplateVersionRequest {
  return {
    country: values.country,
    currency: values.currency,
    components: toTemplateComponents(values),
  };
}

export function templateToFormValues(
  template: {
    name: string;
    country: string;
    currency: string;
    components: TemplateComponents;
  },
): SalaryTemplateFormValues {
  return {
    name: template.name,
    country: template.country,
    currency: template.currency,
    basePay: template.components.basePay,
    allowances: template.components.allowances,
    bonus: template.components.bonus,
    stockQuantity: template.components.stock?.quantity,
    stockVestingDate: template.components.stock?.vestingDate ?? '',
  };
}
