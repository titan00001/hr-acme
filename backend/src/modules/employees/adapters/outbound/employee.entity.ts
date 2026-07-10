import { Column, Entity, Index } from 'typeorm';
import { BaseEntity } from '../../../../common/database/base.entity';
import { EmployeeStatus } from '../../../../common/enums/employee-status.enum';
import { EmploymentType } from '../../../../common/enums/employment-type.enum';

@Entity('employees')
@Index(['name'])
@Index(['email'])
@Index(['country'])
@Index(['status'])
@Index(['employmentType'])
@Index(['country', 'status'])
export class EmployeeEntity extends BaseEntity {
  @Column({ name: 'employee_id', type: 'varchar', unique: true })
  employeeId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', unique: true })
  email!: string;

  @Column({ type: 'varchar' })
  country!: string;

  @Column({ name: 'employment_type', type: 'varchar' })
  employmentType!: EmploymentType;

  @Column({ type: 'varchar', default: EmployeeStatus.Active })
  status!: EmployeeStatus;

  @Column({ name: 'joining_date', type: 'date' })
  joiningDate!: string;

  @Column({ name: 'current_salary_id', type: 'uuid', nullable: true })
  currentSalaryId!: string | null;
}
