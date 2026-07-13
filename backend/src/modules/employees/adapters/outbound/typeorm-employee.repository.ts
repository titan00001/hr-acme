import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { safeOrderBy } from '../../../../common/pagination/pagination.utils';
import { SalaryRecordEntity } from '../../../salary/adapters/outbound/salary-record.entity';
import type {
  CurrentSalarySummary,
  Employee,
  EmployeeListItem,
} from '../../domain/employee.model';
import {
  EmployeeListQuery,
  EmployeeListResult,
  EmployeeRepositoryPort,
} from '../../ports/outbound/employee.repository.port';
import { EmployeeEntity } from './employee.entity';

const ALLOWED_SORT_FIELDS = [
  'name',
  'email',
  'country',
  'employmentType',
  'status',
  'joiningDate',
  'createdAt',
] as const;

function toDomain(entity: EmployeeEntity): Employee {
  const joiningDate =
    typeof entity.joiningDate === 'string'
      ? entity.joiningDate
      : new Date(entity.joiningDate).toISOString().slice(0, 10);

  return {
    id: entity.id,
    employeeId: entity.employeeId,
    name: entity.name,
    email: entity.email,
    country: entity.country,
    employmentType: entity.employmentType,
    status: entity.status,
    joiningDate,
    currentSalaryId: entity.currentSalaryId,
    createdAt: entity.createdAt,
    updatedAt: entity.updatedAt,
  };
}

function toEntity(employee: Employee): EmployeeEntity {
  const entity = new EmployeeEntity();
  entity.id = employee.id;
  entity.employeeId = employee.employeeId;
  entity.name = employee.name;
  entity.email = employee.email;
  entity.country = employee.country;
  entity.employmentType = employee.employmentType;
  entity.status = employee.status;
  entity.joiningDate = employee.joiningDate;
  entity.currentSalaryId = employee.currentSalaryId;
  entity.createdAt = employee.createdAt;
  entity.updatedAt = employee.updatedAt;
  return entity;
}

function toSalarySummary(
  totalCompensation: string | null | undefined,
  currency: string | null | undefined,
): CurrentSalarySummary | null {
  if (!totalCompensation || !currency) {
    return null;
  }
  return {
    totalCompensation: String(totalCompensation),
    currency,
  };
}

@Injectable()
export class TypeOrmEmployeeRepository implements EmployeeRepositoryPort {
  constructor(
    @InjectRepository(EmployeeEntity)
    private readonly repository: Repository<EmployeeEntity>,
  ) {}

  async findById(id: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { id } });
    return entity ? toDomain(entity) : null;
  }

  async findByIds(ids: string[]): Promise<Employee[]> {
    if (ids.length === 0) {
      return [];
    }
    const entities = await this.repository.find({ where: { id: In(ids) } });
    return entities.map(toDomain);
  }

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { employeeId } });
    return entity ? toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? toDomain(entity) : null;
  }

  async findListItemById(id: string): Promise<EmployeeListItem | null> {
    const row = await this.repository
      .createQueryBuilder('employee')
      .leftJoin(
        SalaryRecordEntity,
        'salary',
        'salary.id = employee.currentSalaryId',
      )
      .where('employee.id = :id', { id })
      .select([
        'employee.id AS id',
        'employee.employee_id AS "employeeId"',
        'employee.name AS name',
        'employee.email AS email',
        'employee.country AS country',
        'employee.employment_type AS "employmentType"',
        'employee.status AS status',
        'employee.joining_date AS "joiningDate"',
        'employee.current_salary_id AS "currentSalaryId"',
        'employee.created_at AS "createdAt"',
        'employee.updated_at AS "updatedAt"',
        'salary.total_compensation AS "totalCompensation"',
        'salary.currency AS "salaryCurrency"',
      ])
      .getRawOne<{
        id: string;
        employeeId: string;
        name: string;
        email: string;
        country: string;
        employmentType: Employee['employmentType'];
        status: Employee['status'];
        joiningDate: string | Date;
        currentSalaryId: string | null;
        createdAt: Date;
        updatedAt: Date;
        totalCompensation: string | null;
        salaryCurrency: string | null;
      }>();

    if (!row) {
      return null;
    }

    return this.mapRawListItem(row);
  }

  async findMany(query: EmployeeListQuery): Promise<EmployeeListResult> {
    const qb = this.repository
      .createQueryBuilder('employee')
      .leftJoin(
        SalaryRecordEntity,
        'salary',
        'salary.id = employee.currentSalaryId',
      );

    if (query.status) {
      qb.andWhere('employee.status = :status', { status: query.status });
    }

    if (query.employmentType) {
      qb.andWhere('employee.employmentType = :employmentType', {
        employmentType: query.employmentType,
      });
    }

    if (query.country) {
      qb.andWhere('employee.country = :country', { country: query.country });
    }

    if (query.search) {
      qb.andWhere(
        '(employee.name ILIKE :search OR employee.email ILIKE :search OR employee.employeeId ILIKE :search)',
        { search: `%${query.search}%` },
      );
    }

    const order = safeOrderBy(
      query.sortBy,
      query.sortOrder,
      ALLOWED_SORT_FIELDS,
      'employee',
    );

    if (order) {
      qb.orderBy(`employee.${order.field}`, order.order);
    } else {
      qb.orderBy('employee.name', 'ASC');
    }

    const total = await qb.getCount();

    const rows = await qb
      .select([
        'employee.id AS id',
        'employee.employee_id AS "employeeId"',
        'employee.name AS name',
        'employee.email AS email',
        'employee.country AS country',
        'employee.employment_type AS "employmentType"',
        'employee.status AS status',
        'employee.joining_date AS "joiningDate"',
        'employee.current_salary_id AS "currentSalaryId"',
        'employee.created_at AS "createdAt"',
        'employee.updated_at AS "updatedAt"',
        'salary.total_compensation AS "totalCompensation"',
        'salary.currency AS "salaryCurrency"',
      ])
      .offset((query.page - 1) * query.limit)
      .limit(query.limit)
      .getRawMany<{
        id: string;
        employeeId: string;
        name: string;
        email: string;
        country: string;
        employmentType: Employee['employmentType'];
        status: Employee['status'];
        joiningDate: string | Date;
        currentSalaryId: string | null;
        createdAt: Date;
        updatedAt: Date;
        totalCompensation: string | null;
        salaryCurrency: string | null;
      }>();

    return {
      data: rows.map((row) => this.mapRawListItem(row)),
      total,
    };
  }

  async save(employee: Employee): Promise<Employee> {
    const saved = await this.repository.save(toEntity(employee));
    return toDomain(saved);
  }

  async update(employee: Employee): Promise<Employee> {
    const saved = await this.repository.save(toEntity(employee));
    return toDomain(saved);
  }

  private mapRawListItem(row: {
    id: string;
    employeeId: string;
    name: string;
    email: string;
    country: string;
    employmentType: Employee['employmentType'];
    status: Employee['status'];
    joiningDate: string | Date;
    currentSalaryId: string | null;
    createdAt: Date;
    updatedAt: Date;
    totalCompensation: string | null;
    salaryCurrency: string | null;
  }): EmployeeListItem {
    const joiningDate =
      typeof row.joiningDate === 'string'
        ? row.joiningDate
        : new Date(row.joiningDate).toISOString().slice(0, 10);

    return {
      id: row.id,
      employeeId: row.employeeId,
      name: row.name,
      email: row.email,
      country: row.country,
      employmentType: row.employmentType,
      status: row.status,
      joiningDate,
      currentSalaryId: row.currentSalaryId,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      currentSalary: toSalarySummary(row.totalCompensation, row.salaryCurrency),
    };
  }
}
