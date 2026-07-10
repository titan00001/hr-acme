import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyModule } from '../../common/currency/currency.module';
import { EmployeeEntity } from '../employees/adapters/outbound/employee.entity';
import { SalaryRecordEntity } from '../salary/adapters/outbound/salary-record.entity';
import { SettingsModule } from '../settings/settings.module';
import { DashboardController } from './adapters/inbound/dashboard.controller';
import { TypeOrmDashboardQueryAdapter } from './adapters/outbound/typeorm-dashboard-query.adapter';
import { DashboardService } from './application/dashboard.service';
import { DASHBOARD_QUERY } from './ports/outbound/dashboard-query.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeEntity, SalaryRecordEntity]),
    CurrencyModule,
    SettingsModule,
  ],
  controllers: [DashboardController],
  providers: [
    DashboardService,
    TypeOrmDashboardQueryAdapter,
    {
      provide: DASHBOARD_QUERY,
      useExisting: TypeOrmDashboardQueryAdapter,
    },
  ],
  exports: [DashboardService],
})
export class DashboardModule {}
