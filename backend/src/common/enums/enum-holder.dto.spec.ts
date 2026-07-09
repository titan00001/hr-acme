import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate, type ValidationError } from 'class-validator';
import { EmployeeStatus } from './employee-status.enum';
import { EmploymentType } from './employment-type.enum';
import { EnumHolderDto } from './enum-holder.dto';
import { PaymentCycle } from './payment-cycle.enum';

describe('EnumHolderDto', () => {
  it('accepts valid enum values', async () => {
    const dto: EnumHolderDto = plainToInstance(EnumHolderDto, {
      paymentCycle: PaymentCycle.Monthly,
      employmentType: EmploymentType.Permanent,
      status: EmployeeStatus.Active,
    });

    const errors: ValidationError[] = await validate(dto);
    expect(errors).toHaveLength(0);
  });

  it('rejects invalid enum values', async () => {
    const dto: EnumHolderDto = plainToInstance(EnumHolderDto, {
      paymentCycle: 'Invalid',
      employmentType: 'Something',
      status: 'Other',
    });

    const errors: ValidationError[] = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
