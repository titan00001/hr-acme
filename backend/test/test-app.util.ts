import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { CurrencyModule } from '../src/common/currency/currency.module';
import { CurrencyService } from '../src/common/currency/currency.service';
import { DatabaseModule } from '../src/common/database/database.module';
import { CurrencyRatesController } from '../src/modules/currency-rates/adapters/inbound/currency-rates.controller';
import { CurrencyRateService } from '../src/modules/currency-rates/application/currency-rate.service';
import { CURRENCY_RATE_REPOSITORY } from '../src/modules/currency-rates/ports/outbound/currency-rate.repository.port';
import { EXCHANGE_RATE_PORT } from '../src/modules/currency-rates/ports/outbound/exchange-rate.port';
import { CurrencyRatesModule } from '../src/modules/currency-rates/currency-rates.module';
import { EmployeesController } from '../src/modules/employees/adapters/inbound/employees.controller';
import { EmployeeService } from '../src/modules/employees/application/employee.service';
import { EMPLOYEE_REPOSITORY } from '../src/modules/employees/ports/outbound/employee.repository.port';
import { EmployeesModule } from '../src/modules/employees/employees.module';
import { SalaryDraftsController } from '../src/modules/salary-drafts/adapters/inbound/salary-drafts.controller';
import { SalaryDraftService } from '../src/modules/salary-drafts/application/salary-draft.service';
import { StockSnapshotService } from '../src/modules/salary-drafts/application/stock-snapshot.service';
import { SALARY_DRAFT_REPOSITORY } from '../src/modules/salary-drafts/ports/outbound/salary-draft.repository.port';
import { SalaryDraftsModule } from '../src/modules/salary-drafts/salary-drafts.module';
import { SALARY_RECORD_REPOSITORY } from '../src/modules/salary/ports/outbound/salary-record.repository.port';
import { SalaryModule } from '../src/modules/salary/salary.module';
import { SalaryTemplatesController } from '../src/modules/salary-templates/adapters/inbound/salary-templates.controller';
import { SalaryTemplateService } from '../src/modules/salary-templates/application/salary-template.service';
import { SALARY_TEMPLATE_REPOSITORY } from '../src/modules/salary-templates/ports/outbound/salary-template.repository.port';
import { SalaryTemplatesModule } from '../src/modules/salary-templates/salary-templates.module';
import { SettingsController } from '../src/modules/settings/adapters/inbound/settings.controller';
import { SettingsService } from '../src/modules/settings/application/settings.service';
import { SETTINGS_REPOSITORY } from '../src/modules/settings/ports/outbound/settings.repository.port';
import { SettingsModule } from '../src/modules/settings/settings.module';
import { InMemoryCurrencyRateRepository } from './mocks/in-memory-currency-rate.repository';
import { InMemoryEmployeeRepository } from './mocks/in-memory-employee.repository';
import { InMemorySalaryDraftRepository } from './mocks/in-memory-salary-draft.repository';
import { InMemorySalaryRecordRepository } from './mocks/in-memory-salary-record.repository';
import { InMemorySalaryTemplateRepository } from './mocks/in-memory-salary-template.repository';
import { InMemorySettingsRepository } from './mocks/in-memory-settings.repository';
import { MockExchangeRatePort } from './mocks/mock-exchange-rate.port';

@Module({})
export class MockDatabaseModule {}

export const sharedSettingsRepository = new InMemorySettingsRepository();
export const sharedCurrencyRateRepository =
  new InMemoryCurrencyRateRepository();
export const sharedExchangeRatePort = new MockExchangeRatePort();
export const sharedEmployeeRepository = new InMemoryEmployeeRepository();
export const sharedSalaryTemplateRepository =
  new InMemorySalaryTemplateRepository();
export const sharedSalaryRecordRepository =
  new InMemorySalaryRecordRepository();
export const sharedSalaryDraftRepository = new InMemorySalaryDraftRepository();

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
  ],
  exports: [SettingsService, SETTINGS_REPOSITORY],
})
export class TestSettingsModule {}

@Module({
  controllers: [CurrencyRatesController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
    CurrencyRateService,
    {
      provide: CURRENCY_RATE_REPOSITORY,
      useValue: sharedCurrencyRateRepository,
    },
    {
      provide: EXCHANGE_RATE_PORT,
      useValue: sharedExchangeRatePort,
    },
  ],
  exports: [CurrencyRateService, CURRENCY_RATE_REPOSITORY, EXCHANGE_RATE_PORT],
})
export class TestCurrencyRatesModule {}

@Module({
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
    CurrencyRateService,
    {
      provide: CURRENCY_RATE_REPOSITORY,
      useValue: sharedCurrencyRateRepository,
    },
    {
      provide: EXCHANGE_RATE_PORT,
      useValue: sharedExchangeRatePort,
    },
    CurrencyService,
  ],
  exports: [CurrencyService, CurrencyRateService],
})
export class TestCurrencyModule {}

@Module({
  controllers: [EmployeesController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
    EmployeeService,
    {
      provide: EMPLOYEE_REPOSITORY,
      useValue: sharedEmployeeRepository,
    },
  ],
  exports: [EmployeeService, EMPLOYEE_REPOSITORY],
})
export class TestEmployeesModule {}

@Module({
  controllers: [SalaryTemplatesController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
    SalaryTemplateService,
    {
      provide: SALARY_TEMPLATE_REPOSITORY,
      useValue: sharedSalaryTemplateRepository,
    },
  ],
  exports: [SalaryTemplateService, SALARY_TEMPLATE_REPOSITORY],
})
export class TestSalaryTemplatesModule {}

@Module({
  providers: [
    {
      provide: SALARY_RECORD_REPOSITORY,
      useValue: sharedSalaryRecordRepository,
    },
  ],
  exports: [SALARY_RECORD_REPOSITORY],
})
export class TestSalaryModule {}

@Module({
  controllers: [SalaryDraftsController],
  providers: [
    SalaryDraftService,
    StockSnapshotService,
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useValue: sharedSettingsRepository,
    },
    EmployeeService,
    {
      provide: EMPLOYEE_REPOSITORY,
      useValue: sharedEmployeeRepository,
    },
    SalaryTemplateService,
    {
      provide: SALARY_TEMPLATE_REPOSITORY,
      useValue: sharedSalaryTemplateRepository,
    },
    {
      provide: SALARY_RECORD_REPOSITORY,
      useValue: sharedSalaryRecordRepository,
    },
    {
      provide: SALARY_DRAFT_REPOSITORY,
      useValue: sharedSalaryDraftRepository,
    },
    CurrencyRateService,
    {
      provide: CURRENCY_RATE_REPOSITORY,
      useValue: sharedCurrencyRateRepository,
    },
    {
      provide: EXCHANGE_RATE_PORT,
      useValue: sharedExchangeRatePort,
    },
    CurrencyService,
  ],
  exports: [SalaryDraftService, SALARY_DRAFT_REPOSITORY],
})
export class TestSalaryDraftsModule {}

export function createTestModuleBuilder() {
  return Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(DatabaseModule)
    .useModule(MockDatabaseModule)
    .overrideModule(SettingsModule)
    .useModule(TestSettingsModule)
    .overrideModule(CurrencyRatesModule)
    .useModule(TestCurrencyRatesModule)
    .overrideModule(CurrencyModule)
    .useModule(TestCurrencyModule)
    .overrideModule(EmployeesModule)
    .useModule(TestEmployeesModule)
    .overrideModule(SalaryTemplatesModule)
    .useModule(TestSalaryTemplatesModule)
    .overrideModule(SalaryModule)
    .useModule(TestSalaryModule)
    .overrideModule(SalaryDraftsModule)
    .useModule(TestSalaryDraftsModule);
}

export async function createTestModule(): Promise<TestingModule> {
  return createTestModuleBuilder().compile();
}
