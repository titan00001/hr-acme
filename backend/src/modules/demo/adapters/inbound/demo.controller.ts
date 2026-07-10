import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
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
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { DemoService } from '../../application/demo.service';
import {
  DemoClearResponseDto,
  DemoSeedResponseDto,
  DemoStatusResponseDto,
} from './demo-response.dto';

type AuthenticatedRequest = Request & { user: AuthenticatedUser };

@ApiTags('Settings — Demo')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('settings/demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get('status')
  @ApiOperation({ summary: 'Demo seed status' })
  @ApiOkResponse({ type: DemoStatusResponseDto })
  getStatus(): Promise<DemoStatusResponseDto> {
    return this.demoService.getStatus();
  }

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Seed demo employees (only when empty)' })
  @ApiOkResponse({ type: DemoSeedResponseDto })
  seed(@Req() req: AuthenticatedRequest): Promise<DemoSeedResponseDto> {
    return this.demoService.seed(req.user.username);
  }

  @Post('clear')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear demo data; preserve settings' })
  @ApiOkResponse({ type: DemoClearResponseDto })
  clear(): Promise<DemoClearResponseDto> {
    return this.demoService.clear();
  }
}
