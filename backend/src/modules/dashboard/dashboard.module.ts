import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CurrencyModule } from '../../common/currency/currency.module';
import { EmployeeEntity } from '../employees/adapters/outbound/employee.entity';
import { SalaryRecordEntity } from '../salary/adapters/outbound/salary-record.entity';
import { SettingsModule } from '../settings/settings.module';
import { DashboardController } from './adapters/inbound/dashboard.controller';
import { DashboardReconcileController } from './adapters/inbound/dashboard-reconcile.controller';
import { DashboardCountrySnapshotEntity } from './adapters/outbound/dashboard-country-snapshot.entity';
import { DashboardDistributionSnapshotEntity } from './adapters/outbound/dashboard-distribution-snapshot.entity';
import { DashboardTrendSnapshotEntity } from './adapters/outbound/dashboard-trend-snapshot.entity';
import { TypeOrmDashboardQueryAdapter } from './adapters/outbound/typeorm-dashboard-query.adapter';
import { TypeOrmDashboardSnapshotRepository } from './adapters/outbound/typeorm-dashboard-snapshot.repository';
import { DashboardService } from './application/dashboard.service';
import { DashboardSnapshotService } from './application/dashboard-snapshot.service';
import { DASHBOARD_QUERY } from './ports/outbound/dashboard-query.port';
import { DASHBOARD_SNAPSHOT_REPOSITORY } from './ports/outbound/dashboard-snapshot.repository.port';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EmployeeEntity,
      SalaryRecordEntity,
      DashboardCountrySnapshotEntity,
      DashboardTrendSnapshotEntity,
      DashboardDistributionSnapshotEntity,
    ]),
    CurrencyModule,
    SettingsModule,
  ],
  controllers: [DashboardController, DashboardReconcileController],
  providers: [
    DashboardService,
    DashboardSnapshotService,
    TypeOrmDashboardQueryAdapter,
    TypeOrmDashboardSnapshotRepository,
    {
      provide: DASHBOARD_QUERY,
      useExisting: TypeOrmDashboardQueryAdapter,
    },
    {
      provide: DASHBOARD_SNAPSHOT_REPOSITORY,
      useExisting: TypeOrmDashboardSnapshotRepository,
    },
  ],
  exports: [DashboardService, DashboardSnapshotService],
})
export class DashboardModule {}
