import { z } from 'zod';

export const salaryDraftFormSchema = z.object({
  templateId: z.string().optional(),
  effectiveDate: z.string().min(1, 'Effective date is required'),
  baseSalary: z.number().min(0, 'Base salary must be 0 or greater'),
  currency: z.string().min(1, 'Currency is required'),
  paymentCycle: z.enum(['Monthly', 'BiWeekly', 'Weekly', 'Annual'], {
    message: 'Payment cycle is required',
  }),
  allowances: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  stockQuantity: z.number().positive().optional(),
  stockVestingDate: z.string().optional(),
  reason: z.string().optional(),
});

export type SalaryDraftFormValues = z.infer<typeof salaryDraftFormSchema>;
