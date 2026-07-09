import { Module } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import { DatabaseModule } from '../src/common/database/database.module';
import { SettingsController } from '../src/modules/settings/adapters/inbound/settings.controller';
import { SettingsService } from '../src/modules/settings/application/settings.service';
import { SETTINGS_REPOSITORY } from '../src/modules/settings/ports/outbound/settings.repository.port';
import { SettingsModule } from '../src/modules/settings/settings.module';
import { InMemorySettingsRepository } from './mocks/in-memory-settings.repository';

@Module({})
export class MockDatabaseModule {}

@Module({
  controllers: [SettingsController],
  providers: [
    SettingsService,
    {
      provide: SETTINGS_REPOSITORY,
      useClass: InMemorySettingsRepository,
    },
  ],
  exports: [SettingsService, SETTINGS_REPOSITORY],
})
export class TestSettingsModule {}

export async function createTestModule(): Promise<TestingModule> {
  return Test.createTestingModule({
    imports: [AppModule],
  })
    .overrideModule(DatabaseModule)
    .useModule(MockDatabaseModule)
    .overrideModule(SettingsModule)
    .useModule(TestSettingsModule)
    .compile();
}
