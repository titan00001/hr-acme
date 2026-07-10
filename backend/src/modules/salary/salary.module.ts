import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeesModule } from '../employees/employees.module';
import { SalaryDraftsModule } from '../salary-drafts/salary-drafts.module';
import { SalaryTemplatesModule } from '../salary-templates/salary-templates.module';
import { SalaryController } from './adapters/inbound/salary.controller';
import { SalaryRecordEntity } from './adapters/outbound/salary-record.entity';
import { TypeOrmSalaryRecordRepository } from './adapters/outbound/typeorm-salary-record.repository';
import { SalaryService } from './application/salary.service';
import { SALARY_RECORD_REPOSITORY } from './ports/outbound/salary-record.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryRecordEntity]),
    EmployeesModule,
    SalaryTemplatesModule,
    forwardRef(() => SalaryDraftsModule),
  ],
  controllers: [SalaryController],
  providers: [
    SalaryService,
    TypeOrmSalaryRecordRepository,
    {
      provide: SALARY_RECORD_REPOSITORY,
      useExisting: TypeOrmSalaryRecordRepository,
    },
  ],
  exports: [SalaryService, SALARY_RECORD_REPOSITORY],
})
export class SalaryModule {}
