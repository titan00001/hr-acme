import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { CurrencyModule } from './common/currency/currency.module';
import { DatabaseModule } from './common/database/database.module';
import { CurrencyRatesModule } from './modules/currency-rates/currency-rates.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EmployeesModule } from './modules/employees/employees.module';
import { SalaryDraftsModule } from './modules/salary-drafts/salary-drafts.module';
import { SalaryModule } from './modules/salary/salary.module';
import { SalaryTemplatesModule } from './modules/salary-templates/salary-templates.module';
import { SettingsModule } from './modules/settings/settings.module';
import {
  MockDatabaseModule,
  TestCurrencyModule,
  TestCurrencyRatesModule,
  TestDashboardModule,
  TestEmployeesModule,
  TestSalaryDraftsModule,
  TestSalaryModule,
  TestSalaryTemplatesModule,
  TestSettingsModule,
} from '../test/test-app.util';

describe('AppModule', () => {
  it('compiles', async () => {
    const module: TestingModule = await Test.createTestingModule({
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
      .useModule(TestSalaryDraftsModule)
      .overrideModule(DashboardModule)
      .useModule(TestDashboardModule)
      .compile();

    expect(module).toBeDefined();
  });
});
