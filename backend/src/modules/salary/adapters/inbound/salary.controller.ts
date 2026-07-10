import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../../common/auth/jwt.strategy';
import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { SalaryService } from '../../application/salary.service';
import { MigrateFromTemplateDto } from './migrate-from-template.dto';
import { MigrateFromTemplateResponseDto } from './migrate-from-template-response.dto';
import { SalaryHistoryResponseDto } from './salary-history-response.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('Salary')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller()
export class SalaryController {
  constructor(private readonly salaryService: SalaryService) {}

  @Get('employees/:employeeId/salary/history')
  @ApiOperation({ summary: 'List committed salary history for an employee' })
  @ApiOkResponse({ type: SalaryHistoryResponseDto })
  getHistory(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Query() query: PaginationQueryDto,
  ): Promise<SalaryHistoryResponseDto> {
    return this.salaryService.getHistory(employeeId, query);
  }

  @Post('salary-templates/:templateId/migrate')
  @ApiOperation({
    summary: 'Bulk migrate employees to a template (creates drafts)',
  })
  @ApiOkResponse({ type: MigrateFromTemplateResponseDto })
  migrate(
    @Param('templateId', ParseUUIDPipe) templateId: string,
    @Body() dto: MigrateFromTemplateDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<MigrateFromTemplateResponseDto> {
    return this.salaryService.migrateFromTemplate(
      templateId,
      dto,
      req.user.username,
    );
  }
}
