import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SettingsModule } from '../settings/settings.module';
import { SalaryTemplateService } from './application/salary-template.service';
import { SalaryTemplatesController } from './adapters/inbound/salary-templates.controller';
import { SalaryTemplateEntity } from './adapters/outbound/salary-template.entity';
import { TypeOrmSalaryTemplateRepository } from './adapters/outbound/typeorm-salary-template.repository';
import { SALARY_TEMPLATE_REPOSITORY } from './ports/outbound/salary-template.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryTemplateEntity]), SettingsModule],
  controllers: [SalaryTemplatesController],
  providers: [
    SalaryTemplateService,
    TypeOrmSalaryTemplateRepository,
    {
      provide: SALARY_TEMPLATE_REPOSITORY,
      useExisting: TypeOrmSalaryTemplateRepository,
    },
  ],
  exports: [SalaryTemplateService, SALARY_TEMPLATE_REPOSITORY],
})
export class SalaryTemplatesModule {}
