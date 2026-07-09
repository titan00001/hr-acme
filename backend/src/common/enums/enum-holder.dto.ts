import { IsEnum } from 'class-validator';
import { EmployeeStatus } from './employee-status.enum';
import { EmploymentType } from './employment-type.enum';
import { PaymentCycle } from './payment-cycle.enum';

export class EnumHolderDto {
  @IsEnum(PaymentCycle)
  paymentCycle!: PaymentCycle;

  @IsEnum(EmploymentType)
  employmentType!: EmploymentType;

  @IsEnum(EmployeeStatus)
  status!: EmployeeStatus;
}
