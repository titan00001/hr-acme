import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsService } from './application/settings.service';
import { SettingsController } from './adapters/inbound/settings.controller';
import { SettingsEntity } from './adapters/outbound/settings.entity';
import { TypeOrmSettingsRepository } from './adapters/outbound/typeorm-settings.repository';
import { SETTINGS_REPOSITORY } from './ports/outbound/settings.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([SettingsEntity])],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    TypeOrmSettingsRepository,
    {
      provide: SETTINGS_REPOSITORY,
      useExisting: TypeOrmSettingsRepository,
    },
  ],
  exports: [SettingsService, SETTINGS_REPOSITORY],
})
export class SettingsModule {}
