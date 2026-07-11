import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryRecordEntity } from '../salary/adapters/outbound/salary-record.entity';
import { SettingsModule } from '../settings/settings.module';
import { EmployeeService } from './application/employee.service';
import { EmployeesController } from './adapters/inbound/employees.controller';
import { EmployeeEntity } from './adapters/outbound/employee.entity';
import { TypeOrmEmployeeRepository } from './adapters/outbound/typeorm-employee.repository';
import { EMPLOYEE_REPOSITORY } from './ports/outbound/employee.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeEntity, SalaryRecordEntity]),
    SettingsModule,
  ],
  controllers: [EmployeesController],
  providers: [
    EmployeeService,
    TypeOrmEmployeeRepository,
    {
      provide: EMPLOYEE_REPOSITORY,
      useExisting: TypeOrmEmployeeRepository,
    },
  ],
  exports: [EmployeeService, EMPLOYEE_REPOSITORY],
})
export class EmployeesModule {}
