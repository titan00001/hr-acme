import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { DatabaseModule } from './common/database/database.module';
import { CurrencyRatesModule } from './modules/currency-rates/currency-rates.module';
import { SettingsModule } from './modules/settings/settings.module';
import {
  MockDatabaseModule,
  TestCurrencyRatesModule,
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
      .compile();

    expect(module).toBeDefined();
  });
});
