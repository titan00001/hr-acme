import { zodResolver } from '@hookform/resolvers/zod';
import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';

import {
  onboardEmployeeSchema,
  type OnboardEmployeeFormValues,
} from '@/domain/schemas/onboard-employee.schema';
import type { CreateEmployeeRequest } from '@/domain/types/employee.types';
import { EMPLOYMENT_TYPES } from '@/domain/types/employee.types';
import { formatApiErrorMessage } from '@/infrastructure/api/extract-api-error';
import { useCreateEmployeeMutation } from '@/infrastructure/api/employees-api';
import { useGetSettingsQuery } from '@/infrastructure/api/settings-api';
import { Dialog } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';

const selectClassName =
  'flex h-10 w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-ink shadow-xs transition-theme focus-visible:border-brand focus-visible:shadow-focus focus-visible:outline-none';

export type OnboardModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess?: (employeeId: string) => void;
};

export function OnboardModal({
  open,
  onClose,
  onSuccess,
}: OnboardModalProps): React.ReactElement {
  const { data: settings } = useGetSettingsQuery(undefined, { skip: !open });
  const [createEmployee, { isLoading, error, reset }] =
    useCreateEmployeeMutation();

  const {
    register,
    handleSubmit,
    reset: resetForm,
    formState: { errors },
  } = useForm<OnboardEmployeeFormValues>({
    resolver: zodResolver(onboardEmployeeSchema),
    defaultValues: {
      employeeId: '',
      name: '',
      email: '',
      country: '',
      employmentType: 'Permanent',
      joiningDate: '',
    },
  });

  useEffect(() => {
    if (!open) {
      resetForm();
      reset();
    }
  }, [open, resetForm, reset]);

  async function onSubmit(values: OnboardEmployeeFormValues): Promise<void> {
    const body: CreateEmployeeRequest = {
      employeeId: values.employeeId,
      name: values.name,
      email: values.email,
      country: values.country,
      employmentType: values.employmentType,
      joiningDate: values.joiningDate,
    };

    try {
      const created = await createEmployee(body).unwrap();
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
      title="Onboard employee"
      description="Create a new Active employee record."
      className="max-w-xl"
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="onboard-employee-id">Employee ID</Label>
            <Input id="onboard-employee-id" {...register('employeeId')} />
            {errors.employeeId ? (
              <p className="text-sm text-danger" role="alert">
                {errors.employeeId.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="onboard-joining-date">Joining date</Label>
            <Input
              id="onboard-joining-date"
              type="date"
              {...register('joiningDate')}
            />
            {errors.joiningDate ? (
              <p className="text-sm text-danger" role="alert">
                {errors.joiningDate.message}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="onboard-name">Name</Label>
          <Input id="onboard-name" {...register('name')} />
          {errors.name ? (
            <p className="text-sm text-danger" role="alert">
              {errors.name.message}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="onboard-email">Email</Label>
          <Input id="onboard-email" type="email" {...register('email')} />
          {errors.email ? (
            <p className="text-sm text-danger" role="alert">
              {errors.email.message}
            </p>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="onboard-country">Country</Label>
            {settings?.supportedCountries?.length ? (
              <select
                id="onboard-country"
                className={selectClassName}
                {...register('country')}
              >
                <option value="">Select country</option>
                {settings.supportedCountries.map((country) => (
                  <option key={country} value={country}>
                    {country}
                  </option>
                ))}
              </select>
            ) : (
              <Input id="onboard-country" {...register('country')} />
            )}
            {errors.country ? (
              <p className="text-sm text-danger" role="alert">
                {errors.country.message}
              </p>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="onboard-type">Employment type</Label>
            <select
              id="onboard-type"
              className={selectClassName}
              {...register('employmentType')}
            >
              {EMPLOYMENT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type === 'PartTime' ? 'Part-time' : type}
                </option>
              ))}
            </select>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-danger" role="alert">
            {formatApiErrorMessage(error, 'Unable to onboard employee')}
          </p>
        ) : null}

        <div className="mt-2 flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving…' : 'Onboard'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
