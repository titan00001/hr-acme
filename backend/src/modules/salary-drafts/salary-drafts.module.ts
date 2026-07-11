import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyModule } from '../../common/currency/currency.module';
import { EmployeeEntity } from '../employees/adapters/outbound/employee.entity';
import { EmployeesModule } from '../employees/employees.module';
import { SalaryModule } from '../salary/salary.module';
import { SalaryTemplatesModule } from '../salary-templates/salary-templates.module';
import { SettingsModule } from '../settings/settings.module';
import { SalaryDraftService } from './application/salary-draft.service';
import { StockSnapshotService } from './application/stock-snapshot.service';
import { SalaryDraftsController } from './adapters/inbound/salary-drafts.controller';
import { SalaryDraftEntity } from './adapters/outbound/salary-draft.entity';
import { TypeOrmSalaryDraftRepository } from './adapters/outbound/typeorm-salary-draft.repository';
import { SALARY_DRAFT_REPOSITORY } from './ports/outbound/salary-draft.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([SalaryDraftEntity, EmployeeEntity]),
    EmployeesModule,
    forwardRef(() => SalaryModule),
    SalaryTemplatesModule,
    SettingsModule,
    CurrencyModule,
  ],
  controllers: [SalaryDraftsController],
  providers: [
    SalaryDraftService,
    StockSnapshotService,
    TypeOrmSalaryDraftRepository,
    {
      provide: SALARY_DRAFT_REPOSITORY,
      useExisting: TypeOrmSalaryDraftRepository,
    },
  ],
  exports: [SalaryDraftService, SALARY_DRAFT_REPOSITORY],
})
export class SalaryDraftsModule {}
