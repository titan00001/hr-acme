import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { EmployeeService } from '../../application/employee.service';
import { toEmployeeResponseDto } from '../../application/employee.mapper';
import { CreateEmployeeDto } from './create-employee.dto';
import { EmployeeQueryDto } from './employee-query.dto';
import { EmployeeResponseDto } from './employee-response.dto';
import { PaginatedEmployeesDto } from './paginated-employees.dto';
import { RelieveEmployeeDto } from './relieve-employee.dto';
import { UpdateEmployeeDto } from './update-employee.dto';

@ApiTags('Employees')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('employees')
export class EmployeesController {
  constructor(private readonly employeeService: EmployeeService) {}

  @Get()
  @ApiOperation({ summary: 'List active employees (default)' })
  @ApiOkResponse({ type: PaginatedEmployeesDto })
  findAll(@Query() query: EmployeeQueryDto): Promise<PaginatedEmployeesDto> {
    return this.employeeService.findAll(query);
  }

  @Get('left')
  @ApiOperation({ summary: 'List left employees' })
  @ApiOkResponse({ type: PaginatedEmployeesDto })
  findLeft(@Query() query: EmployeeQueryDto): Promise<PaginatedEmployeesDto> {
    return this.employeeService.findLeft(query);
  }

  @Post()
  @ApiOperation({ summary: 'Onboard a new employee' })
  @ApiCreatedResponse({ type: EmployeeResponseDto })
  async create(@Body() dto: CreateEmployeeDto): Promise<EmployeeResponseDto> {
    const employee = await this.employeeService.create(dto);
    return toEmployeeResponseDto(employee);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get employee detail' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeService.findOne(id);
    return toEmployeeResponseDto(employee);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update employee fields' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    const employee = await this.employeeService.update(id, dto);
    return toEmployeeResponseDto(employee);
  }

  @Post(':id/relieve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark employee as Left' })
  @ApiOkResponse({ type: EmployeeResponseDto })
  async relieve(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RelieveEmployeeDto,
  ): Promise<EmployeeResponseDto> {
    void dto;
    const employee = await this.employeeService.relieve(id);
    return toEmployeeResponseDto(employee);
  }
}
