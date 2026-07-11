import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeStatus } from '../../../../common/enums/employee-status.enum';
import { EmployeeEntity } from '../../../employees/adapters/outbound/employee.entity';
import { SalaryRecordEntity } from '../../../salary/adapters/outbound/salary-record.entity';
import type {
  ActiveCurrentSalaryRow,
  CountryHeadcountRow,
  DashboardQueryPort,
  RecentRevisionResult,
  TrendSalaryRow,
} from '../../ports/outbound/dashboard-query.port';

@Injectable()
export class TypeOrmDashboardQueryAdapter implements DashboardQueryPort {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly employeeRepository: Repository<EmployeeEntity>,
    @InjectRepository(SalaryRecordEntity)
    private readonly salaryRecordRepository: Repository<SalaryRecordEntity>,
  ) {}

  async findActiveCurrentSalaries(): Promise<ActiveCurrentSalaryRow[]> {
    const rows = await this.employeeRepository
      .createQueryBuilder('employee')
      .innerJoin(
        SalaryRecordEntity,
        'record',
        'record.id = employee.currentSalaryId',
      )
      .where('employee.status = :status', { status: EmployeeStatus.Active })
      .select([
        'employee.id AS "employeeId"',
        'employee.country AS country',
        'record.currency AS currency',
        'record.total_compensation AS "totalCompensation"',
        'record.id AS "recordId"',
      ])
      .getRawMany<{
        employeeId: string;
        country: string;
        currency: string;
        totalCompensation: string;
        recordId: string;
      }>();

    return rows.map((row) => ({
      employeeId: row.employeeId,
      country: row.country,
      currency: row.currency,
      totalCompensation: String(row.totalCompensation),
      recordId: row.recordId,
    }));
  }

  async findActiveHeadcountByCountry(): Promise<CountryHeadcountRow[]> {
    const rows = await this.employeeRepository
      .createQueryBuilder('employee')
      .where('employee.status = :status', { status: EmployeeStatus.Active })
      .select('employee.country', 'country')
      .addSelect('COUNT(*)', 'headcount')
      .groupBy('employee.country')
      .getRawMany<{ country: string; headcount: string }>();

    return rows.map((row) => ({
      country: row.country,
      headcount: Number(row.headcount),
    }));
  }

  async findActiveCommittedInRange(
    from: string,
    to: string,
  ): Promise<TrendSalaryRow[]> {
    const rows = await this.salaryRecordRepository
      .createQueryBuilder('record')
      .innerJoin(EmployeeEntity, 'employee', 'employee.id = record.employeeId')
      .where('employee.status = :status', { status: EmployeeStatus.Active })
      .andWhere('record.effectiveDate >= :from', { from })
      .andWhere('record.effectiveDate <= :to', { to })
      .select([
        'record.effective_date AS "effectiveDate"',
        'record.currency AS currency',
        'record.total_compensation AS "totalCompensation"',
      ])
      .getRawMany<{
        effectiveDate: string | Date;
        currency: string;
        totalCompensation: string;
      }>();

    return rows.map((row) => ({
      effectiveDate:
        typeof row.effectiveDate === 'string'
          ? row.effectiveDate
          : new Date(row.effectiveDate).toISOString().slice(0, 10),
      currency: row.currency,
      totalCompensation: String(row.totalCompensation),
    }));
  }

  async findRecentRevisions(
    page: number,
    limit: number,
  ): Promise<RecentRevisionResult> {
    const baseQb = this.salaryRecordRepository
      .createQueryBuilder('record')
      .innerJoin(EmployeeEntity, 'employee', 'employee.id = record.employeeId')
      .where('employee.status = :status', { status: EmployeeStatus.Active });

    const total = await baseQb.getCount();

    const rows = await baseQb
      .orderBy('record.createdAt', 'DESC')
      .select([
        'record.id AS id',
        'record.employee_id AS "employeeId"',
        'employee.name AS "employeeName"',
        'employee.employee_id AS "employeeCode"',
        'record.effective_date AS "effectiveDate"',
        'record.currency AS currency',
        'record.total_compensation AS "totalCompensation"',
        'record.reason AS reason',
        'record.created_by AS "createdBy"',
        'record.created_at AS "createdAt"',
      ])
      .offset((page - 1) * limit)
      .limit(limit)
      .getRawMany<{
        id: string;
        employeeId: string;
        employeeName: string;
        employeeCode: string;
        effectiveDate: string | Date;
        currency: string;
        totalCompensation: string;
        reason: string | null;
        createdBy: string;
        createdAt: Date;
      }>();

    return {
      total,
      data: rows.map((row) => ({
        id: row.id,
        employeeId: row.employeeId,
        employeeName: row.employeeName,
        employeeCode: row.employeeCode,
        effectiveDate:
          typeof row.effectiveDate === 'string'
            ? row.effectiveDate
            : new Date(row.effectiveDate).toISOString().slice(0, 10),
        currency: row.currency,
        totalCompensation: String(row.totalCompensation),
        reason: row.reason,
        createdBy: row.createdBy,
        createdAt: row.createdAt,
      })),
    };
  }
}
