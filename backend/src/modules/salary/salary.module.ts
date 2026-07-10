import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SalaryRecordEntity } from './adapters/outbound/salary-record.entity';
import { TypeOrmSalaryRecordRepository } from './adapters/outbound/typeorm-salary-record.repository';
import { SALARY_RECORD_REPOSITORY } from './ports/outbound/salary-record.repository.port';

@Module({
  imports: [TypeOrmModule.forFeature([SalaryRecordEntity])],
  providers: [
    TypeOrmSalaryRecordRepository,
    {
      provide: SALARY_RECORD_REPOSITORY,
      useExisting: TypeOrmSalaryRecordRepository,
    },
  ],
  exports: [SALARY_RECORD_REPOSITORY],
})
export class SalaryModule {}
