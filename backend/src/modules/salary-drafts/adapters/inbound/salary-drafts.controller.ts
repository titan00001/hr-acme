import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import type { AuthenticatedUser } from '../../../../common/auth/jwt.strategy';
import { PaginationQueryDto } from '../../../../common/pagination/pagination-query.dto';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { SalaryRecordResponseDto } from '../../../salary/adapters/inbound/salary-record-response.dto';
import { SalaryDraftService } from '../../application/salary-draft.service';
import { toSalaryDraftResponseDto } from '../../application/salary-draft.mapper';
import { SalaryDraftListResponseDto } from './salary-draft-list-response.dto';
import { SalaryDraftResponseDto } from './salary-draft-response.dto';
import { UpsertSalaryDraftDto } from './upsert-salary-draft.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('Salary Drafts')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller()
export class SalaryDraftsController {
  constructor(private readonly salaryDraftService: SalaryDraftService) {}

  @Post('employees/:employeeId/salary/draft')
  @ApiOperation({ summary: 'Create or update salary draft for an employee' })
  @ApiCreatedResponse({ type: SalaryDraftResponseDto })
  @ApiOkResponse({ type: SalaryDraftResponseDto })
  async upsert(
    @Param('employeeId', ParseUUIDPipe) employeeId: string,
    @Body() dto: UpsertSalaryDraftDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<SalaryDraftResponseDto> {
    const draft = await this.salaryDraftService.upsert(
      employeeId,
      dto,
      req.user.username,
    );
    return toSalaryDraftResponseDto(draft);
  }

  @Get('salary-drafts')
  @ApiOperation({ summary: 'List pending salary drafts' })
  @ApiOkResponse({ type: SalaryDraftListResponseDto })
  findAll(
    @Query() query: PaginationQueryDto,
  ): Promise<SalaryDraftListResponseDto> {
    return this.salaryDraftService.findAll(query);
  }

  @Get('salary-drafts/:id')
  @ApiOperation({ summary: 'Get salary draft detail' })
  @ApiOkResponse({ type: SalaryDraftResponseDto })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<SalaryDraftResponseDto> {
    const draft = await this.salaryDraftService.findOne(id);
    return toSalaryDraftResponseDto(draft);
  }

  @Post('salary-drafts/:id/commit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit draft to salary record' })
  @ApiOkResponse({ type: SalaryRecordResponseDto })
  commit(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: AuthenticatedRequest,
  ): Promise<SalaryRecordResponseDto> {
    return this.salaryDraftService.commit(id, req.user.username);
  }

  @Delete('salary-drafts/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Rollback (delete) salary draft' })
  @ApiNoContentResponse()
  async rollback(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.salaryDraftService.rollback(id);
  }
}
