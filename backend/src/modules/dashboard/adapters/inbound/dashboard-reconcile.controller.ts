import { Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiProperty,
  ApiTags,
} from '@nestjs/swagger';
import { SWAGGER_BEARER_AUTH } from '../../../../common/swagger/setup-swagger';
import { DashboardSnapshotService } from '../../application/dashboard-snapshot.service';

class DashboardReconcileResponseDto {
  @ApiProperty({ example: 5 })
  countries!: number;

  @ApiProperty({ example: 12 })
  trends!: number;
}

@ApiTags('Settings')
@ApiBearerAuth(SWAGGER_BEARER_AUTH)
@Controller('settings/dashboard')
export class DashboardReconcileController {
  constructor(
    private readonly dashboardSnapshotService: DashboardSnapshotService,
  ) {}

  @Post('reconcile')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Recompute dashboard snapshots from source records (ops/recovery)',
  })
  @ApiOkResponse({ type: DashboardReconcileResponseDto })
  reconcile(): Promise<DashboardReconcileResponseDto> {
    return this.dashboardSnapshotService.reconcile();
  }
}
