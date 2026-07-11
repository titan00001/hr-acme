import { z } from 'zod';

export const onboardEmployeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required'),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  country: z.string().min(1, 'Country is required'),
  employmentType: z.enum(['Permanent', 'PartTime', 'Contract'], {
    message: 'Employment type is required',
  }),
  joiningDate: z.string().min(1, 'Joining date is required'),
});

export type OnboardEmployeeFormValues = z.infer<typeof onboardEmployeeSchema>;
