import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
  optionalNumberFromInput,
  toUpsertSalaryDraftRequest,
} from '@/domain/formatters/salary-draft-request';
import {
  salaryDraftFormSchema,
  type SalaryDraftFormValues,
} from '@/domain/schemas/salary-draft-form.schema';
import type { SalaryTemplate } from '@/domain/types/salary-template.types';
import type { UpsertSalaryDraftRequest } from '@/domain/types/salary.types';
import { PAYMENT_CYCLES } from '@/domain/types/salary.types';
import { TemplatePicker } from '@/presentation/components/salary/template-picker';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

const selectClassName =
  'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none';

export type SalaryFormProps = {
  country?: string;
  currencies: string[];
  defaultValues?: Partial<SalaryDraftFormValues>;
  isSubmitting?: boolean;
  serverError?: string | null;
  submitLabel?: string;
  onSubmit: (body: UpsertSalaryDraftRequest) => Promise<void> | void;
  onCancel?: () => void;
};

function applyTemplate(
  template: SalaryTemplate,
): Partial<SalaryDraftFormValues> {
  return {
    templateId: template.id,
    currency: template.currency,
    baseSalary: template.components.basePay,
    allowances: template.components.allowances,
    bonus: template.components.bonus,
    stockQuantity: template.components.stock?.quantity,
    stockVestingDate: template.components.stock?.vestingDate ?? '',
  };
}

export function SalaryForm({
  country,
  currencies,
  defaultValues,
  isSubmitting = false,
  serverError = null,
  submitLabel = 'Save draft',
  onSubmit,
  onCancel,
}: SalaryFormProps): React.ReactElement {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SalaryDraftFormValues>({
    resolver: zodResolver(salaryDraftFormSchema),
    defaultValues: {
      templateId: '',
      effectiveDate: '',
      baseSalary: 0,
      currency: currencies[0] ?? '',
      paymentCycle: 'Monthly',
      allowances: undefined,
      bonus: undefined,
      stockQuantity: undefined,
      stockVestingDate: '',
      reason: '',
      ...defaultValues,
    },
  });

  const templateId = watch('templateId');

  useEffect(() => {
    if (defaultValues) {
      reset({
        templateId: '',
        effectiveDate: '',
        baseSalary: 0,
        currency: currencies[0] ?? '',
        paymentCycle: 'Monthly',
        allowances: undefined,
        bonus: undefined,
        stockQuantity: undefined,
        stockVestingDate: '',
        reason: '',
        ...defaultValues,
      });
    }
  }, [defaultValues, currencies, reset]);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={handleSubmit(async (values) => {
        await onSubmit(toUpsertSalaryDraftRequest(values));
      })}
      noValidate
    >
      <TemplatePicker
        country={country}
        value={templateId}
        onChange={(template) => {
          if (!template) {
            setValue('templateId', '');
            return;
          }
          const next = applyTemplate(template);
          for (const [key, value] of Object.entries(next)) {
            setValue(key as keyof SalaryDraftFormValues, value as never, {
              shouldValidate: true,
            });
          }
        }}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-effective-date">Effective date</Label>
          <Input
            id="salary-effective-date"
            type="date"
            {...register('effectiveDate')}
          />
          {errors.effectiveDate ? (
            <p className="text-sm text-danger" role="alert">
              {errors.effectiveDate.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-payment-cycle">Payment cycle</Label>
          <select
            id="salary-payment-cycle"
            className={selectClassName}
            {...register('paymentCycle')}
          >
            {PAYMENT_CYCLES.map((cycle) => (
              <option key={cycle} value={cycle}>
                {cycle === 'BiWeekly' ? 'Bi-weekly' : cycle}
              </option>
            ))}
          </select>
          {errors.paymentCycle ? (
            <p className="text-sm text-danger" role="alert">
              {errors.paymentCycle.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-base">Base salary</Label>
          <Input
            id="salary-base"
            type="number"
            min={0}
            step="0.01"
            {...register('baseSalary', {
              setValueAs: (value) => optionalNumberFromInput(value) ?? 0,
            })}
          />
          {errors.baseSalary ? (
            <p className="text-sm text-danger" role="alert">
              {errors.baseSalary.message}
            </p>
          ) : null}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-currency">Currency</Label>
          <select
            id="salary-currency"
            className={selectClassName}
            {...register('currency')}
          >
            {currencies.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
          {errors.currency ? (
            <p className="text-sm text-danger" role="alert">
              {errors.currency.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-allowances">Allowances</Label>
          <Input
            id="salary-allowances"
            type="number"
            min={0}
            step="0.01"
            {...register('allowances', {
              setValueAs: optionalNumberFromInput,
            })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-bonus">Bonus</Label>
          <Input
            id="salary-bonus"
            type="number"
            min={0}
            step="0.01"
            {...register('bonus', {
              setValueAs: optionalNumberFromInput,
            })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-stock-qty">Stock quantity</Label>
          <Input
            id="salary-stock-qty"
            type="number"
            min={1}
            step="1"
            {...register('stockQuantity', {
              setValueAs: optionalNumberFromInput,
            })}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="salary-stock-vest">Stock vesting date</Label>
          <Input
            id="salary-stock-vest"
            type="date"
            {...register('stockVestingDate')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="salary-reason">Reason</Label>
        <Input id="salary-reason" {...register('reason')} />
      </div>

      {serverError ? (
        <p className="text-sm text-danger" role="alert">
          {serverError}
        </p>
      ) : null}

      <div className="flex justify-end gap-2">
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : null}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  );
}
