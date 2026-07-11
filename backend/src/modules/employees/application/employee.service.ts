import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { EmployeeStatus } from '../../../common/enums/employee-status.enum';
import { getPaginationMeta } from '../../../common/pagination/pagination.utils';
import { DashboardSnapshotService } from '../../dashboard/application/dashboard-snapshot.service';
import { SettingsService } from '../../settings/application/settings.service';
import { CreateEmployeeDto } from '../adapters/inbound/create-employee.dto';
import { EmployeeQueryDto } from '../adapters/inbound/employee-query.dto';
import { EmployeeResponseDto } from '../adapters/inbound/employee-response.dto';
import { PaginatedEmployeesDto } from '../adapters/inbound/paginated-employees.dto';
import { UpdateEmployeeDto } from '../adapters/inbound/update-employee.dto';
import type { Employee } from '../domain/employee.model';
import {
  EMPLOYEE_REPOSITORY,
  type EmployeeRepositoryPort,
} from '../ports/outbound/employee.repository.port';
import {
  toEmployeeListResponseDto,
  toEmployeeResponseDto,
} from './employee.mapper';

@Injectable()
export class EmployeeService {
  constructor(
    @Inject(EMPLOYEE_REPOSITORY)
    private readonly employeeRepository: EmployeeRepositoryPort,
    private readonly settingsService: SettingsService,
    private readonly dashboardSnapshotService: DashboardSnapshotService,
  ) {}

  async findAll(query: EmployeeQueryDto): Promise<PaginatedEmployeesDto> {
    return this.listEmployees({
      ...query,
      status: query.status ?? EmployeeStatus.Active,
    });
  }

  async findLeft(query: EmployeeQueryDto): Promise<PaginatedEmployeesDto> {
    return this.listEmployees({
      ...query,
      status: EmployeeStatus.Left,
    });
  }

  async findOne(id: string): Promise<Employee> {
    const employee = await this.employeeRepository.findById(id);
    if (!employee) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return employee;
  }

  async findOneResponse(id: string): Promise<EmployeeResponseDto> {
    const item = await this.employeeRepository.findListItemById(id);
    if (!item) {
      throw new NotFoundException(`Employee ${id} not found`);
    }
    return toEmployeeListResponseDto(item);
  }

  async create(dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    await this.assertSupportedCountry(dto.country);

    const existingByEmployeeId = await this.employeeRepository.findByEmployeeId(
      dto.employeeId,
    );
    if (existingByEmployeeId) {
      throw new ConflictException(
        `Employee with employeeId ${dto.employeeId} already exists`,
      );
    }

    const existingByEmail = await this.employeeRepository.findByEmail(
      dto.email,
    );
    if (existingByEmail) {
      throw new ConflictException(
        `Employee with email ${dto.email} already exists`,
      );
    }

    const now = new Date();
    const employee: Employee = {
      id: randomUUID(),
      employeeId: dto.employeeId,
      name: dto.name,
      email: dto.email,
      country: dto.country,
      employmentType: dto.employmentType,
      status: EmployeeStatus.Active,
      joiningDate: dto.joiningDate,
      currentSalaryId: null,
      createdAt: now,
      updatedAt: now,
    };

    const saved = await this.employeeRepository.save(employee);
    await this.dashboardSnapshotService.onEmployeeCreated(saved.country);
    return toEmployeeResponseDto(saved, null);
  }

  async update(
    id: string,
    dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const current = await this.findOne(id);

    if (dto.country !== undefined && dto.country !== current.country) {
      await this.assertSupportedCountry(dto.country);
    }

    if (dto.email !== undefined && dto.email !== current.email) {
      const existingByEmail = await this.employeeRepository.findByEmail(
        dto.email,
      );
      if (existingByEmail && existingByEmail.id !== id) {
        throw new ConflictException(
          `Employee with email ${dto.email} already exists`,
        );
      }
    }

    const updated: Employee = {
      ...current,
      name: dto.name ?? current.name,
      email: dto.email ?? current.email,
      country: dto.country ?? current.country,
      employmentType: dto.employmentType ?? current.employmentType,
      joiningDate: dto.joiningDate ?? current.joiningDate,
      updatedAt: new Date(),
    };

    await this.employeeRepository.update(updated);
    return this.findOneResponse(id);
  }

  async relieve(id: string): Promise<EmployeeResponseDto> {
    const current = await this.findOne(id);

    if (current.status === EmployeeStatus.Left) {
      throw new BadRequestException(`Employee ${id} is already Left`);
    }

    const listItem = await this.employeeRepository.findListItemById(id);
    const currency = listItem?.currentSalary?.currency ?? null;
    const totalCompensation =
      listItem?.currentSalary?.totalCompensation ?? null;

    const updated: Employee = {
      ...current,
      status: EmployeeStatus.Left,
      updatedAt: new Date(),
    };

    await this.employeeRepository.update(updated);
    await this.dashboardSnapshotService.onEmployeeRelieved({
      country: current.country,
      currency,
      totalCompensation,
    });
    return this.findOneResponse(id);
  }

  private async listEmployees(
    query: EmployeeQueryDto,
  ): Promise<PaginatedEmployeesDto> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const result = await this.employeeRepository.findMany({
      page,
      limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
      search: query.search,
      status: query.status,
      employmentType: query.employmentType,
      country: query.country,
    });

    const meta = getPaginationMeta(result.total, page, limit);

    return {
      data: result.data.map(toEmployeeListResponseDto),
      ...meta,
    };
  }

  private async assertSupportedCountry(country: string): Promise<void> {
    const countries = await this.settingsService.getCountries();
    if (!countries.includes(country)) {
      throw new BadRequestException(
        `Country ${country} is not in supported countries`,
      );
    }
  }
}
