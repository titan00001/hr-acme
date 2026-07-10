import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { safeOrderBy } from '../../../../common/pagination/pagination.utils';
import type { Employee } from '../../domain/employee.model';
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

  async findByEmployeeId(employeeId: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { employeeId } });
    return entity ? toDomain(entity) : null;
  }

  async findByEmail(email: string): Promise<Employee | null> {
    const entity = await this.repository.findOne({ where: { email } });
    return entity ? toDomain(entity) : null;
  }

  async findMany(query: EmployeeListQuery): Promise<EmployeeListResult> {
    const qb = this.repository.createQueryBuilder('employee');

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

    const page = query.page;
    const limit = query.limit;
    qb.skip((page - 1) * limit).take(limit);

    const [entities, total] = await qb.getManyAndCount();

    return {
      data: entities.map(toDomain),
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
}
