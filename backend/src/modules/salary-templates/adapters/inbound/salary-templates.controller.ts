import {
  Body,
  Controller,
  Delete,
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
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { SalaryTemplateService } from '../../application/salary-template.service';
import { toTemplateResponseDto } from '../../application/salary-template.mapper';
import { CreateTemplateDto } from './create-template.dto';
import { CreateTemplateVersionDto } from './create-template-version.dto';
import { TemplateListResponseDto } from './template-list-response.dto';
import { TemplateQueryDto } from './template-query.dto';
import { TemplateResponseDto } from './template-response.dto';
import { UpdateTemplateDto } from './update-template.dto';

@ApiTags('Salary Templates')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('salary-templates')
export class SalaryTemplatesController {
  constructor(private readonly salaryTemplateService: SalaryTemplateService) {}

  @Get()
  @ApiOperation({ summary: 'List salary templates' })
  @ApiOkResponse({ type: TemplateListResponseDto })
  findAll(@Query() query: TemplateQueryDto): Promise<TemplateListResponseDto> {
    return this.salaryTemplateService.findAll(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create first version of a salary template' })
  @ApiCreatedResponse({ type: TemplateResponseDto })
  async create(@Body() dto: CreateTemplateDto): Promise<TemplateResponseDto> {
    const template = await this.salaryTemplateService.create(dto);
    return toTemplateResponseDto(template, template.version);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get salary template by id' })
  @ApiOkResponse({ type: TemplateResponseDto })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<TemplateResponseDto> {
    return this.salaryTemplateService.findOneResponse(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update an unassigned template (rejected when isAssigned)',
  })
  @ApiOkResponse({ type: TemplateResponseDto })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTemplateDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.salaryTemplateService.update(id, dto);
    return this.salaryTemplateService.findOneResponse(template.id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete an unassigned template (rejected when isAssigned)',
  })
  @ApiNoContentResponse()
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.salaryTemplateService.remove(id);
  }

  @Post(':id/versions')
  @ApiOperation({ summary: 'Create a new version of a template family' })
  @ApiCreatedResponse({ type: TemplateResponseDto })
  async createVersion(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreateTemplateVersionDto,
  ): Promise<TemplateResponseDto> {
    const template = await this.salaryTemplateService.createVersion(id, dto);
    return toTemplateResponseDto(template, template.version);
  }
}
