import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from './app.module';
import { DatabaseModule } from './common/database/database.module';
import { SettingsModule } from './modules/settings/settings.module';
import { MockDatabaseModule, TestSettingsModule } from '../test/test-app.util';

describe('AppModule', () => {
  it('compiles', async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideModule(DatabaseModule)
      .useModule(MockDatabaseModule)
      .overrideModule(SettingsModule)
      .useModule(TestSettingsModule)
      .compile();

    expect(module).toBeDefined();
  });
});
