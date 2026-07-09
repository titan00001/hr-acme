import { EmployeeStatus } from './employee-status.enum';
import { EmploymentType } from './employment-type.enum';
import { PaymentCycle } from './payment-cycle.enum';

describe('common/enums', () => {
  it('defines PaymentCycle values', () => {
    expect(Object.values(PaymentCycle)).toEqual([
      PaymentCycle.Monthly,
      PaymentCycle.BiWeekly,
      PaymentCycle.Weekly,
      PaymentCycle.Annual,
    ]);
  });

  it('defines EmploymentType values', () => {
    expect(Object.values(EmploymentType)).toEqual([
      EmploymentType.Permanent,
      EmploymentType.PartTime,
      EmploymentType.Contract,
    ]);
  });

  it('defines EmployeeStatus values', () => {
    expect(Object.values(EmployeeStatus)).toEqual([
      EmployeeStatus.Active,
      EmployeeStatus.Left,
    ]);
  });
});
