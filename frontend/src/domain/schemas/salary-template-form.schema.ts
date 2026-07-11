import { z } from 'zod';

export const salaryTemplateFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  basePay: z.number().min(0, 'Base pay must be 0 or greater'),
  allowances: z.number().min(0).optional(),
  bonus: z.number().min(0).optional(),
  stockQuantity: z.number().positive().optional(),
  stockVestingDate: z.string().optional(),
});

export type SalaryTemplateFormValues = z.infer<typeof salaryTemplateFormSchema>;
