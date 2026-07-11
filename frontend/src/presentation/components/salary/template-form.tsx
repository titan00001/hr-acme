import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { optionalNumberFromInput } from '@/domain/formatters/salary-draft-request';
import {
  salaryTemplateFormSchema,
  type SalaryTemplateFormValues,
} from '@/domain/schemas/salary-template-form.schema';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

const selectClassName =
  'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none';

export type TemplateFormMode = 'create' | 'edit' | 'version';

export type TemplateFormProps = {
  mode: TemplateFormMode;
  countries: string[];
  currencies: string[];
  defaultValues?: Partial<SalaryTemplateFormValues>;
  isSubmitting?: boolean;
  serverError?: string | null;
  submitLabel?: string;
  onSubmit: (values: SalaryTemplateFormValues) => Promise<void> | void;
  onCancel?: () => void;
};

export function TemplateForm({
  mode,
  countries,
  currencies,
  defaultValues,
  isSubmitting = false,
  serverError = null,
  submitLabel,
  onSubmit,
  onCancel,
}: TemplateFormProps): React.ReactElement {
  const nameLocked = mode !== 'create';
  const resolvedSubmitLabel =
    submitLabel ??
    (mode === 'create'
      ? 'Create template'
      : mode === 'version'
        ? 'Create version'
        : 'Save changes');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<SalaryTemplateFormValues>({
    resolver: zodResolver(salaryTemplateFormSchema),
    defaultValues: {
      name: '',
      country: '',
      currency: '',
      basePay: 0,
      allowances: undefined,
      bonus: undefined,
      stockQuantity: undefined,
      stockVestingDate: '',
      ...defaultValues,
    },
  });

  useEffect(() => {
    reset({
      name: '',
      country: '',
      currency: '',
      basePay: 0,
      allowances: undefined,
      bonus: undefined,
      stockQuantity: undefined,
      stockVestingDate: '',
      ...defaultValues,
    });
  }, [defaultValues, reset]);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={handleSubmit(onSubmit)}
      noValidate
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="template-name">Name</Label>
        <Input
          id="template-name"
          disabled={nameLocked}
          aria-invalid={errors.name ? true : undefined}
          {...register('name')}
        />
        {errors.name ? (
          <p className="text-sm text-danger" role="alert">
            {errors.name.message}
          </p>
        ) : null}
        {nameLocked ? (
          <p className="text-xs text-ink-subtle">
            Family name is fixed across versions.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-country">Country</Label>
          {countries.length > 0 ? (
            <select
              id="template-country"
              className={selectClassName}
              aria-invalid={errors.country ? true : undefined}
              {...register('country')}
            >
              <option value="">Select country</option>
              {countries.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
          ) : (
            <Input id="template-country" {...register('country')} />
          )}
          {errors.country ? (
            <p className="text-sm text-danger" role="alert">
              {errors.country.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-currency">Currency</Label>
          {currencies.length > 0 ? (
            <select
              id="template-currency"
              className={selectClassName}
              aria-invalid={errors.currency ? true : undefined}
              {...register('currency')}
            >
              <option value="">Select currency</option>
              {currencies.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          ) : (
            <Input id="template-currency" {...register('currency')} />
          )}
          {errors.currency ? (
            <p className="text-sm text-danger" role="alert">
              {errors.currency.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-base-pay">Base pay</Label>
          <Input
            id="template-base-pay"
            type="number"
            min={0}
            step="0.01"
            aria-invalid={errors.basePay ? true : undefined}
            {...register('basePay', {
              setValueAs: (value) => optionalNumberFromInput(value) ?? 0,
            })}
          />
          {errors.basePay ? (
            <p className="text-sm text-danger" role="alert">
              {errors.basePay.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-allowances">Allowances</Label>
          <Input
            id="template-allowances"
            type="number"
            min={0}
            step="0.01"
            {...register('allowances', {
              setValueAs: optionalNumberFromInput,
            })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-bonus">Bonus</Label>
          <Input
            id="template-bonus"
            type="number"
            min={0}
            step="0.01"
            {...register('bonus', {
              setValueAs: optionalNumberFromInput,
            })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="template-stock-qty">Stock quantity</Label>
          <Input
            id="template-stock-qty"
            type="number"
            min={1}
            step="1"
            {...register('stockQuantity', {
              setValueAs: optionalNumberFromInput,
            })}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="template-stock-vest">Stock vesting date</Label>
        <Input
          id="template-stock-vest"
          type="date"
          {...register('stockVestingDate')}
        />
      </div>

      {serverError ? (
        <p className="text-sm text-danger" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="mt-2 flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : resolvedSubmitLabel}
        </Button>
      </div>
    </form>
  );
}
